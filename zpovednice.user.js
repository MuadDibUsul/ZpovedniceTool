// ==UserScript==
// @name        ZpovedniceTool+adm
// @version     1.0.6
// @description Tools for zpovednice.cz - the admin version
// @namespace   zpovednice
// @author      Muad*Dib
// @icon        https://zpovednice.cz/favicon.ico
// @updateURL   https://github.com/MuadDibUsul/ZpovedniceTool/raw/admin/zpovednice.user.js
// @downloadURL https://github.com/MuadDibUsul/ZpovedniceTool/raw/admin/zpovednice.user.js
// @include     http://zpovednice.cz/*
// @include     http://*.zpovednice.cz/*
// @include     http://www.zpovednice.cz/*
// @include     http://www.zpovednice.eu/*
// @include     http://zpovednice.eu/*
// @include     https://zpovednice.cz/*
// @include     https://*.zpovednice.cz/*
// @include     https://www.zpovednice.cz/*
// @include     https://www.zpovednice.eu/*
// @include     https://zpovednice.eu/*
// @require     https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/jquery-3.2.1.min.js
// @require     https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/bootstrap.min.js
// @require     https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/propeller.min.js
// @require     https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/popper.min.js
// @require     https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/ZP_config.js?v=0.53
// @resource    css_tooltip https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/tooltip.css?v=13
// @resource    css_bs https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/bootstrap.min.css
// @resource    css_prop https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/propeller.min.css
// @resource    dialog_css https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/dialog.css?v=1
// @resource    config_css https://raw.githubusercontent.com/MuadDibUsul/ZpovedniceTool/admin/resources/config.css?v=8
// @grant       unsafeWindow
// @grant       GM_addStyle
// @grant       GM_getResourceText
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_listValues
// @grant       GM_deleteValue
// @grant       GM_info
// ==/UserScript==
/* globals $ */

GM_addStyle(GM_getResourceText("css_tooltip"));

func_config();
const config = ZP_config.get();

const maxwidth = 120;
const maxheight = 120;
const bgcolor = "#11244B";

const nick = config["nick"];
const pass = config["pass"];

const quoteTemplate = config['quoteTemplate'];

// nicky, co zvyraznovat:
const highlightNicks = config['highlightNicks'];

// k nim prislusne barvy:
const highlightColors = config['highlightColors'];

// nicky, co ignorovat:
const ignoreNicks = config['ignoreNicks'];

// barvy zvyrazneni v listu
const highlightListColors = config['highlightListColors'];

const hideHeader = config['hideHeader'];

if (highlightNicks.length != highlightColors.length) {
    alert("chyba v nastaveni skriptu \n Pocet prezdivek v \n highlightNicks \n MUSI byt stejny, jako pocet barev v \n highlightColors!");
}

// redirect www.zpovednice.cz to zpovednice.cz
if (location.hostname.substr(0, 4) == 'www.') {
    location.replace(location.href.replace(/www\./, ''));
}
if (location.hostname.substr(10, 3) == '.eu') {
    location.replace(location.href.replace('.eu', '.cz'));
}

// menu
if (location.pathname.includes('index.php') || $('div#ixleft').length) {
    $('.boxheadsp')[0].innerText = 'Zpovědnice tool+';
    $($('.boxaround')[3]).html(makeMenu());
}

function makeMenu() {
    var menu = '<select style="margin-top:9; width: 138px" class="graybutt" value="" id="selectConfig">';
    menu += '<option disabled>KONFIGURACE...</option>';

    const names = config['configNames'];
    const active = getvar('ZP/activeConfigName') ?? names.length > 0 ? names[0] : 'default';
    for (const name of names) {
        var selected = "";
        if (name === active) selected = "selected = 'selected'";
        menu += "<option " + selected + " value='" + name + "'>" + name + "</option>";
    }

    menu += '</select>';
    menu += '<input type="submit" style="margin-top:9; width: 138px" class="graybutt open-config" value="NASTAVENÍ">';
    menu += '<input type="submit" style="margin-top:9; width: 138px" class="graybutt open-config-admin" value="ADMIN NASTAVENÍ">';
    menu += '<input type="submit" style="margin-top:9; width: 138px" class="graybutt open-about" value="ABOUT - v' + GM_info.script.version + '">';
    menu = '<div class="boxbackgr">' + menu + '</div>';
    return menu;
}

// funkce, ktere se daji vypnout, zapnout
const func={

// skryti hlavicky
    func_hideHeader: function ()
    {
        if (location.pathname.includes('index.php') || $('div#ixleft').length) {
            $('table')[0].remove();
            $('table')[0].remove();
            $('table')[0].remove();
            $('#allhdr').remove();
            $('#hdrlogo').remove();
            $('#ixmidst').css('top', 0);
            if (location.pathname.includes('index.php') || $('div#ixleft').length) {
                $('#ixleft').css('top', 0);
                $('#ixright').css('top', 0);
                $('#spodek').css('height', 0);
            }
        }
    },

    // skrytí zpovedi ignorovanych uzivatelu
    func_ignoreNicks: function ()
    {
        for (var i = 0; i < ignoreNicks.length; i++) {
            if (ignoreNicks[i].length > 0) {
                var element = $(".signnick:contains('" + ignoreNicks[i] + "')").closest("table").closest("tr").prev().prev();
                for (var el of element) {
                    if (el && el[0]) el = el[0];
                    if (el.children && el.children[0].className == "sectlheader") {
                        $(el).hide();
                        el = el.nextElementSibling;
                        while (el != null && el.children[0].className != "sectlheader") {
                            $(el).hide();
                            el = el.nextElementSibling;
                        }
                    }
                }
                element = $(".signunreg:contains('" + ignoreNicks[i] + "')").closest("table").closest("tr").prev().prev();
                for (el of element) {
                    if (el && el[0]) el = el[0];
                    if (el.children && el.children[0].className == "sectlheader") {
                        el.hide();
                        el = el.nextElementSibling;
                        while (el != null && el.children[0].className != "sectlheader") {
                            $(el).hide();
                            el = el.nextElementSibling;
                        }
                    }
                }
                //    $('td.absoltext:visible:contains('+ ignore[i] +')').css('color',bgcolor);
            }
        }
    },

    // autologin
    func_autologin: function ()
    {
        if ($('#logon').length) {
            $('#logon input[name="nick"]').val(nick);
            $('#logon input[name="heslo"]').val(pass);
            $('#logon input[type="submit"]').click();
        }
    },

    // zvyrazneni zpovedi v seznamu
    func_highlightList: function ()
    {
        $('#conflist ul').each(function () {
            if ($(this).find("li.c6 img").attr("src") == "grafika/zmarkv.gif") {
                $(this).css("background", highlightListColors[0]);
                $(this).css("display", "flex");
                if ($(this).find("li.c5").html().includes(":")) {
                    $(this).css("background", highlightListColors[1]);
                }
            } else if ($(this).find("li.c5").html().includes(":")) {
                $(this).css("background", highlightListColors[2]);
                $(this).css("display", "flex");
            }
        });
    },

    // zvyrazneni zpovedi se jmenem
    func_highlightNicks: function ()
    {
        for (var i = 0; i < highlightNicks.length; i++) {
            if (highlightNicks[i].length > 0) {
                $('td.absoltext:contains(' + highlightNicks[i] + ')').css('background', highlightColors[i]);
            }
        }
    },

    // pictures
    func_pictures: function ()
    {
        $(".signnick:visible,.signunreg:visible").each(function () {
            var id_with_url = $(this).children("a").attr("href");
            if (id_with_url) { // it can be undefined !
                var ids = id_with_url.match(/\d+$/g); // last number of url, url is like profil.php?kdo=666
                if (ids && 0 < ids.length) {
                    var id = ids[0];
                    $(this).parent().parent().parent().parent().parent().find(".absoltext").prepend('<img src="foto/id' + id + '.jpg" align="right" border=0 onerror="this.style.display=\'none\'" style="max-height:' + maxheight + ';max-width:' + maxwidth + ';display:block;margin-bottom: -30px;margin-right: -10px;">');
                    $(this).parent().parent().parent().parent().parent().parent().find(".conftext").prepend('<img src="foto/id' + id + '.jpg" align="right" border=0 onerror="this.style.display=\'none\'" style="max-height:' + maxheight + ';max-width:' + maxwidth + ';display:block;margin-bottom: -30px;margin-right: -10px;">');
                }
            }
            $(this).parent().parent().parent().parent().removeAttr('style');
        });
    },

    // pictures of deleted users ;-)
    func_deletedPictures: function ()
    {
        $("span.redhigh").each(function () {
            if (this.innerText == "NENALEZENO - Profil uživatele byl smazán.") {
                $(this).append("<span>");
                $(this).find('span').append("<br /><br />");
                let id = window.location.href.split("=")[1];
                $(this).find('span').append('<img id="photo" src="foto/id' + id + '.jpg" border=0 onerror="this.style.display=\'none\'" style="display:block;margin-left:auto;margin-right:auto;width:50%">');
            }
        });
        $('.signinfo').css('text-align', 'left');
    },

    // citace
    func_quoting: function ()
    {
        var button_text = " cituj ";
        var space_between;

        $(".absoltext .signnick:visible,.absoltext .signunreg:visible").parent().parent().parent().parent().prepend('<a href="" class="doanswer">' + button_text + '</a>').find(".doanswer").click(
            function (event) {
                // get text
                var text = $(event.currentTarget).parent().parent().prev().find(".absoltext").text();
                doQuote(event, text);
            }
        );

        $($(".signinfo .signnick:visible,.signinfo .signunreg:visible")[0]).parent().parent().parent().parent().prepend('<a href="" class="doanswer">' + button_text + '</a>').find(".doanswer").click(
            function (event) {
                // get text
                var text = $(event.currentTarget).parent().parent().parent().prev().find(".conftext").text();
                doQuote(event, text);
            }
        );
    },

    // rychla odpoved v profilu
    func_quickReply: function ()
    {
        $('a[href*="deletek.php"').each(function () {
            $(this).before('<a href="javascript:void(0);" class="replyToggle">&nbsp;ODPOVĚDĚT</a>&nbsp;&nbsp;');

            var proID = "" + $(this).parent().parent().parent().parent().next().children('a').attr('href');
            var proKoho = proID.replace(/\D/g, '');
            var profilID = $('input[name="odid"]').attr('value');

            var text = $(this).parent().parent().parent().parent().next().next().next();

            var html = '';

            html += '<div class="fastReply" style="display: none; margin-bottom: 5px;">';
            html += '<center><form method="post" action="kontrolk.php" target="_blank">';
            html += '<input type=hidden NAME=proid VALUE="' + proKoho + '">';
            html += '<input type=hidden NAME=odid VALUE="' + profilID + '">';
            html += '<textarea class="collect" rows="5" cols="80" name="body"></textarea>';
            html += '<input type="submit" value="Odeslat zápis" class="replyMessage" />';
            html += '</form></center>';
            html += '</div>';

            text.after(html);
        });

        $('.replyMessage').click(function () {
            $('.replyToggle', $(this).parent().parent().parent().parent()).hide();
            $(this).parent().parent().parent().hide();
        });
        $('.replyToggle').click(function () {
            var div = $(this).parent().parent().parent().parent().parent().children('.fastReply');

            var area = $('textarea', div);

            div.toggle();
            if (div.css('display') != 'none') {

                setTimeout(function () {
                    area.focus();

                }, 100);
            } else {
                $(this).children('img').attr('src', imageArrowRight);
            }
        });
    }

}

func.func_ignoreNicks();
func.func_highlightNicks()
func.func_deletedPictures()

for (const key in config){
    if (key.startsWith('mod_') && config[key]){
        const funcName = key.replace('mod_','func_');
        func[funcName]();
    }
}

var page = location.pathname.replace(/^\/*/, '').replace(/^admin\/|\/*$|\.php$/g, '');
var link = location.hostname + '/detail.php?statusik=';

// redirect after form processing
var form = document.forms.namedItem('formular');

if (page == 'souhlasr' && typeof form != 'undefined') {
    form.action += '?return=' + form.elements.namedItem('ciselko').value;
} else if (page == 'kontrolr' && location.search.indexOf('return') != -1) {
    location.replace(link + location.search.match(/return=(\d+)/)[1]);
}

// fix the insane title
document.title = document.title = 'Zpovědnice - ' + nick + ' +';

// open all links in the current window
/*
for (var i = 0; i < document.links.length; i++) {
    document.links[i].target = '_self';
}
*/

// automatic links to the related pages
if (['detail', 'profil'].indexOf(page) != -1) {
    ['conftext', 'confheader', 'absoltext', 'guesttext'].forEach(
        function (c) {
            var x = document.getElementsByClassName(c);
            for (var i = 0; i < x.length; i++) {
                x[i].innerHTML = x[i].innerHTML.replace(/ (\d{5,7})/g, ' <a href="' + link + '$1">$1</a>');
            }
        }
    );
}




function doQuote(event, text) {
    var nickname = $(event.currentTarget).parent().find(".signunreg").text().trim();
    if (!nickname) {
        nickname = $(event.currentTarget).parent().find(".signnick a").text().trim();
    }
    text = quoteTemplate.replace('{text}', text).replace('{nick}', nickname);
    // insert text
    if ($("textarea").val().length > 1) {
        const space_between = "\n\n"; // n-th reply
    } else {
        const space_between = ""; // first reply
    }
    $("textarea").val($("textarea").val() + space_between + text + "\n\n");

    // move cursor
    var textarea_length = $("textarea").val().length;
    var cursor_index = textarea_length; // it is really not -1 :)
    $("textarea")[0].selectionStart = cursor_index;
    $("textarea")[0].selectionEnd = cursor_index;

    // scroll to textarea
    $("textarea").focus();
    event.preventDefault();
}

function replaceConfLinks(text) {
    const link = location.hostname;
    return text.replace(/\b(\d{6})\b/g, '<a class="confLink" target="_blank" href="' + link + '/detail.php?statusik=$1">$1</a>');
}


function getvar(varname) {
    console.log('getting var ' + varname + ' = ' + GM_getValue('zp_inner/' + varname));
    return GM_getValue('zp_inner/' + varname);
}

function setvar(varname, value = false) {
    if (value) {
        console.log('setting var ' + varname + ' = ' + value);
        GM_setValue('zp_inner/' + varname, value);
    } else {
        console.log('deleting var ' + varname + '.');
        GM_deleteValue('zp_inner/' + varname);
    }
}

function func_config() {
    ZP_config.init('Zpovědnice tool+', {
        configName: {
            label: "Název konfigurace",
            description: "Můžeš si vytvořit několik různých konfigurací a pak se mezi nimi rychle přepínat, případně mít různé konfigurace pro různá zařízení.",
            type: "text",
            default: "default"
        },
        nick: {
            label: "Nick",
            description: "Pro různé potřeby skriptu je třeba zadat tvůj nick. Jinak nemusí něco fungovat správně.",
            type: "text",
            default: ""
        },
        pass: {
            label: "Heslo",
            description: "Heslo bude uloženo pouze v prohlížeči, nebude se nikdy nikam odesílat a slouží pouze pro automatické přihlašování. Nemusíš ho vyplňovat jestli nechceš.",
            type: "password",
            default: ""
        },
        highlightNicks: {
            label: "Zvýrazňované nicky",
            description: "Zadej libovolný počet nicků, oddělených čárkou. Rozhřešení obsahující tato slova se pak budou barevně zvýrazňovat. Může to být jen část slova. A dá se to použít nejen na nicky. (není od věci zadat si tam sebe - uvidíš rychle, kdo tě zmiňuje.",
            type: "array",
            default: "Muad, kaiten, Pragma"
        },
        highlightColors: {
            label: "Barvy pro zvýrazňované nicky",
            description: "Zde ve stejném pořadí zadej barvy pro zvýraznění nicků viz předchozí položka nastavení. Barev musí být stejný počet jako nicků. Používají se named HTML colors viz třeba www.w3schools.com/colors/colors_names.asp",
            type: "array",
            default: "Green, Indigo, LightPink"
        },
        ignoreNicks: {
            label: "Ignorované nicky",
            description: "Zadej seznam nicků, jejichž rozhřešení pak už nikdy neuvidíš. To může být trošku nebezpečný...",
            type: "array",
            default: ""
        },

        mod_hideHeader: {
            label: "Skrytí headeru",
            description: "Skryje logo Zpovědnice.",
            type: "checkbox",
            default: false
        },
        mod_autologin: {
            label: "Automatické přihlašování",
            description: "Je třeba mít vyplněné heslo.",
            type: "checkbox",
            default: false
        },
        mod_pictures: {
            label: "Zobrazování profilové fotky pod rozhřešením.",
            type: "checkbox",
            default: false
        },
        mod_quoting: {
            label: "Citace",
            description: "Přidá tlačítko cituj, které kopíruje rozhřešení do okna pro odpověď.",
            type: "checkbox",
            default: false
        },
        quoteTemplate: {
            label: "Šablona pro citace",
            type: "textarea",
            default: "\"<i>{text}</i>\"\n  <b>{nick}</b>"
        },
        mod_quickReply: {
            label: "Rychlá odpověď v profilu",
            description: "Umožní v profilu napsat rychlou odpověď bez nutnosti návštěvy cílového profilu.",
            type: "checkbox",
            default: false
        },
        mod_highlightList: {
            label: "Obarvit seznam",
            description: "Obarví navštívené / změnené zpovědi v seznamu.",
            type: "checkbox",
            default: true
        },
        highlightListColors: {
            label: "Barvy pro seznam",
            description: "Zadej 3 barvy oddělené čárkou pro zpověď do které jsi přispěl, zpověď do které jsi přispěl a někdo do ní přispěl po tobě, zpověď na kterou ses se díval a něco se tam změnilo.",
            type: "array",
            default: "darkblue, blue, darkslategrey"
        },
        configNames: {
            type: "hidden",
            default: ['default']
        },
        css: {
            type: "hidden",
            default: ""
        }
    }, GM_getResourceText("dialog_css"), GM_getResourceText("config_css"), refreshMe);
}

$("#selectConfig").on("change", function (e) {
    refreshMe(e.currentTarget.value);
});

function refreshMe(config) {
    if (config) {
        setvar('ZP/activeConfigName', config);
    }
    location.reload();
}

if ($('.open-config').length) {
    document.querySelector(".open-config").addEventListener("click", ZP_config.open);
}

$.expr[":"].contains = $.expr.createPseudo(function (arg) {
    return function (elem) {
        return $(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// admin part>

const adminSecret = "";
var day = (new Date()).getUTCDate();
if ((new Date()).getUTCHours() == 23) day++;
if (("" + day).length == 1) day = "0" + day;
var adminPass = "" + day + adminSecret+'@';

// new admin link
if ($('#ixleft a[href="ad.php"]').length) {
    $('#ixleft a[href="ad.php"]')[0].href = 'adnew.php';
}

// RIPE
$('a[href*="http://whois.domaintools.com"]').each(function () {
    this.setAttribute('target', '_blank');
    var ip = this.href.substr(29);
    var anchor = document.createElement('a');
    var span = document.createElement('span');
    span.innerHTML = ' - ';
    anchor.setAttribute('href', 'https://apps.db.ripe.net/db-web-ui/query?searchtext=' + ip);
    anchor.setAttribute('target', '_blank');
    anchor.innerHTML = 'Ripe';
    this.after(anchor);
    this.after(span);
});

// IP
$('a[href*="prehledvip.php?tr=p&"]').each(function () {
    this.setAttribute('target', '_blank');
    var href = this.href;
    var ip = href.substr(45);
    var anchor = document.createElement('a');
    var separator = document.createElement('span');
    separator.innerHTML = ' - ';
    var ipspan = document.createElement('span');
    ipspan.innerHTML = ip;
    ipspan.setAttribute('style', 'user-select: all; cursor: pointer;');
    ipspan.setAttribute('onclick', 'document.execCommand("copy")');
    ipspan.setAttribute('tooltip', "click = zkopírovat do schránky");
    anchor.setAttribute('href', window.location.origin + '/adm.php?ippa=' + ip + '&action=a_ip');
    anchor.setAttribute('target', '_blank');
    anchor.innerHTML = ' N ';
    anchor.setAttribute('tooltip', "novej admin");
    this.after(anchor);
    this.after(separator.cloneNode(true));
    this.before(ipspan);
    this.before(separator.cloneNode(true));
    this.innerHTML = ' O ';
    this.setAttribute('tooltip', "starej admin");
});

// ID
$('a[href*="prehledvip.php?tr=i&"]').each(function () {
    this.setAttribute('target', '_blank');
    var href = this.href;
    var id = href.substr(45);
    var anchor = document.createElement('a');
    var separator = document.createElement('span');
    separator.innerHTML = ' - ';
    var idspan = document.createElement('span');
    idspan.innerHTML = id;
    idspan.setAttribute('style', 'user-select: all; cursor: pointer;');
    idspan.setAttribute('onclick', 'document.execCommand("copy")');
    idspan.setAttribute('tooltip', "click = zkopírovat do schránky");
    anchor.setAttribute('href', location.hostname + '/adm.php?ida=' + id + '&action=a_id');
    anchor.setAttribute('target', '_blank');
    anchor.innerHTML = ' N ';
    anchor.setAttribute('tooltip', "novej admin");
    this.after(anchor);
    this.after(separator.cloneNode(true));
    this.before(idspan);
    this.before(separator.cloneNode(true));
    this.innerHTML = ' O ';
    this.setAttribute('tooltip', "starej admin");
});

// smazat bez blokace
$('a[href*="smazat.php?statusik="]').each(function () {
    if (this.innerHTML == ' Smazat bez blokace') {
        this.innerHTML = ' SBB';
        this.setAttribute('tooltip', "Smazat bez blokace");
        this.parentElement.innerHTML = this.parentElement.innerHTML.replace('Nábídka pro VIP osobu', '');
    }
});

// doplneni hesla pro smazani
if (location.pathname.includes('zrus_nick_vsude.php')) {
    $('input[name=hesliko]').val(adminSecret);
}

// presmerovani na login do adm pri pristupu bez prihlaseni
if (location.pathname.includes('adm.php')) {
    if ($('font:contains("NEOPRAVNENY VSTUP")').length > 0) {
        setvar('admurl', location.href);
        location.replace(window.location.hostname + '/adnew.php');
    } else {
        var url = getvar('admurl');
        if (url.length > 0) {
            setvar('admurl');
            location.replace(url);
        }
    }
}

// autologin admin
if (location.pathname.includes('adnew.php') && $('form[action="adlnew.php"] input[name=T1]').length) {
    $('form[action="adlnew.php"] input[name=T1]').val(adminPass);
    $('form[action="adlnew.php"] input[type="submit"]').click();
}
