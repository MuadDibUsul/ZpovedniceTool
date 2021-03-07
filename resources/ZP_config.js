// ==UserScript==
// @name        ZP_config
// @version     0.49
// @grant       GM_setValue
// @grant		GM_getValue
// ==/UserScript==

var ZP_config = function () {

    "use strict";

    var config = {
        title: null,
        name: GM_getValue('ZP/activeConfigName') ?? 'default',
        settings: null
    }, dialog, css, ZP_config;

    function addChild(e, children) {
        if (!children) {
            return;
        }

        if (!Array.isArray(children)) {
            children = [children];
        }

        var i;
        for (i = 0; i < children.length; i++) {
            if (typeof children[i] == "string") {
                children[i] = document.createTextNode(children[i]);
            }
            e.appendChild(children[i]);
        }
    }

    function element(tag, attr, children) {
        var e, key, key2;

        e = document.createElement(tag);

        if (attr) {
            for (key in attr) {
                if (typeof attr[key] == "boolean") {
                    if (attr[key]) {
                        e.setAttribute(key, "");
                    } else {
                        e.removeAttribute(key);
                    }

                } else if (key == "event") {
                    for (key2 in attr[key]) {
                        e["on" + key2] = attr[key][key2];
                    }

                } else {
                    e.setAttribute(key, attr[key]);
                }
            }
        }

        addChild(e, children);

        return e;
    }

    function frag(children) {
        var fragment = document.createDocumentFragment();
        addChild(fragment, children);
        return fragment;
    }

    function getValue(key) {
        if (key === 'configNames') {
            key = 'ZP/configNames';
            var value = JSON.parse(GM_getValue(key));
        } else {
            key = config.name + "/" + key;
            var value = GM_getValue(key);
            /*		if (GM_getValue(key + "/type") == "object") {
                        value = JSON.parse(value);
                    }*/
            const s = config.settings[key];
            if (s.type === 'array') {
                value = value.replace(", ", ",").replace(" ,", ",");
                value = value.split(',');
            }
        }
        return value;
    }

    function setValue(key, value) {
        if (key === 'configNames') {
            key = 'ZP/configNames';
            value = JSON.stringify(value);
        } else {
            key = config.name + "/" + key;
            /*		if (typeof value == "object") {
                        GM_setValue(key + "/type", "object");
                        value = JSON.stringify(value);
                    }*/
        }
        GM_setValue(key, value);
    }

    function read() {
        var key, s;
        for (key in config.settings) {
            s = config.settings[key];
            s.value = getValue(key);
            if (s.value == null) {
                s.value = s.default;
            }
        }
    }

    function save() {
        var key, s;
        config.name = config.settings['configName'].value;
        if (!config.settings.configNames.value.includes(config.name)) {
            config.settings.configNames.value.push(config.name);
        }
        for (key in config.settings) {
            s = config.settings[key];
            if (s.value == null) {
                setValue(key, s.default);
            } else {
                setValue(key, s.value);
            }
        }
    }

    function deleteConfig() {
        var key, s;
        config.name = config.settings['configName'].value;
        if (config.settings.configNames.value.includes(config.name)) {
            const i = config.settings.configNames.value.indexOf(config.name);
            config.settings.configNames.value.splice(i, 1);
        }
        for (key in config.settings) {
            s = config.settings[key];
            deleteValue(key);
        }
    }

    function destroyDialog() {
        dialog.element.classList.remove("config-dialog-ani");
        setTimeout(function () {
            document.body.classList.remove("config-dialog-open");
            document.body.style.paddingRight = "";
            dialog.element.parentNode.removeChild(dialog.element);
            dialog = null;
        }, 220);
    }

    function createDialog(title) {
        var iframe = element("iframe", {"class": "config-dialog-content"});
        var modal = element("div", {"class": "config-dialog", "tabindex": "-1"}, [
            element("style", null, "body.config-dialog-open { padding-right: " + (window.innerWidth - document.documentElement.offsetWidth) + "px; }"),
            iframe
        ]);

        var head = element("div", {"class": "config-dialog-head"}, title);
        var body = element("div", {"class": "config-dialog-body"});
        var footer = element("div", {"class": "config-dialog-footer form-inline"});

        var style = element("style", null, getConfigCssString());

        document.body.classList.add("config-dialog-open");
        document.body.appendChild(modal);

        function manipulateIframe() {
            var doc = iframe.contentDocument;
            doc.head.appendChild(style);
            doc.body.appendChild(head);
            doc.body.appendChild(body);
            doc.body.appendChild(footer);
        }

        iframe.contentWindow.onload = manipulateIframe;

        manipulateIframe();

        function render() {
            var body = iframe.contentDocument.body,
                w = body.offsetWidth,
                h = body.scrollHeight;

//		iframe.style.width = w + "px";
            iframe.style.height = h + "px";
            modal.focus();

            modal.classList.add("config-dialog-ani");
        }

        return {
            element: modal,
            head: head,
            body: body,
            footer: footer,
            render: render
        };
    }

    function close(saveFlag) {
        var key, s;

        if (!dialog) {
            return;
        }
        destroyDialog();

        for (key in config.settings) {
            s = config.settings[key];
            if (saveFlag) {
                switch (s.type) {
                    case "number":
                        s.value = +s.element.value;
                        break;

                    case "password":
                        s.value = s.element.value;
                        break;

                    case "checkbox":
                        s.value = s.element.checked;
                        break;

                    case "radio":
                        s.value = s.element.querySelector("input:checked").value;
                        break;

                    case "select":
                        if (!s.multiple) {
                            s.value = s.element.value;
                        } else {
                            s.value = Array.prototype.map.call(
                                s.element.selectedOptions,
                                function (ele) {
                                    return ele.value;
                                }
                            );
                        }
                        break;

                    case "hidden":
                        break;

                    default:
                        s.value = s.element.value;
                }
                // Create inputs
            }
            // Create inputs
            s.element = null;
        }

        if (saveFlag) {
            save();
            if (config.onclose) {
                console.log('ZP_config.onclose');
                config.onclose();
            }
        }
    }

    function getConfigCssString() {
        return config.configCss;
    }

    function getCssString() {
        return config.dialogCss;
    }

    function setupDialogValue(reset, imports) {
        var key, setting, value;

        for (key in config.settings) {
            setting = config.settings[key];

            if (reset) {
                value = setting.default;
            } else {
                if (imports && imports[key] != undefined) {
                    value = imports[key];
                } else {
                    value = setting.value;
                }
            }

            switch (setting.type) {
                case "number":
                    setting.element.value = value.toString();
                    break;

                case "password":
                    setting.element.value = value;
                    break;

                case "checkbox":
                    setting.element.checked = value;
                    break;

                case "radio":
                    setting.element.querySelector("[value=" + value + "]").checked = true;
                    break;

                case "select":
                    if (!setting.multiple) {
                        setting.element.querySelector("[value=" + value + "]").selected = true;
                    } else {
                        while (setting.element.selectedOptions.length) {
                            setting.element.selectedOptions[0].selected = false;
                        }
                        value.forEach(function (value) {
                            setting.element.querySelector("[value=" + value + "]").selected = true;
                        });
                    }
                    break;

                case "hidden":
                    break;

                case "array":
                    if (typeof value == 'array')
                    setting.element.value = value.join(", ");

                default:
                    setting.element.value = value;
                    break;
            }
        }
    }

    function createInputs(dialog) {
        var key, s, group;

        for (key in config.settings) {
            s = config.settings[key];

            if (s.type == "textarea") {
                s.element = element("textarea", {"id": key, "rows": "5"});
                s.element.classList.add("form-control");
                group = [
                    element("label", {"for": key}, s.label),
                    s.element
                ];
            } else if (s.type == "radio") {
                s.element = element("fieldset", null, [element("legend", null, s.label)].concat(Object.keys(s.options).map(function (optKey) {
                    return element("label", {class: "radio"}, [
                        element("input", {type: "radio", name: key, value: optKey}),
                        s.options[optKey]
                    ]);
                })));
                group = [
                    s.element
                ];
            } else if (s.type == "select") {
                s.element = element(
                    "select",
                    {class: "form-control", multiple: !!s.multiple},
                    Object.keys(s.options).map(function (optKey) {
                        return element(
                            "option",
                            {value: optKey},
                            s.options[optKey]
                        );
                    })
                );
                group = element("label", null, [
                    s.label,
                    s.element
                ]);
            } else {
                s.element = element("input", {"id": key, "type": s.type});

                switch (s.type) {
                    case "number":
                        s.element.classList.add("form-control");
                        group = [
                            element("label", {"for": key}, s.label),
                            s.element
                        ];
                        break;
                    case "password":
                        s.element.classList.add("form-control");
                        group = [
                            element("label", {"for": key}, s.label),
                            element("label", {"for": key, "class": "description"}, s.description),
                            s.element
                        ];
                        break;
                    case "checkbox":
                        group = element("div", {"class": "checkbox"}, [
                            s.element,
                            element("label", {"for": key}, s.label),
                            element("label", {"for": key, "class": "description"}, s.description),
                        ]);
                        break;
                    case "hidden":
                        break;
                    default:
                        s.element.classList.add("form-control");
                        group = [
                            element("label", {"for": key}, s.label),
                            element("label", {"for": key, "class": "description"}, s.description),
                            s.element
                        ];
                }
            }

            dialog.body.appendChild(
                element("div", {"class": "form-group"}, group)
            );
        }
    }

    function createFooter(dialog) {

        dialog.footer.appendChild(frag([
            element("button", {
                "class": "btn-default", event: {
                    click: function () {
                        close(true);
                    }
                }
            }, "Save"),

            element("button", {
                "class": "btn-default", event: {
                    click: function () {
                        close();
                    }
                }
            }, "Cancel"),

            element("button", {
                class: "btn-default", event: {
                    click: function () {
                        setupDialogValue(true);
                    }
                }
            }, "Default"),

            element("button", {
                class: "btn-default", event: {
                    click: function () {
                        if (confirm('Opravdu chces tento config smazat?')) {
                            deleteConfig;
                            close(true);
                        }
                    }
                }
            }, "Smazat"),

            element("button", {
                class: "btn-sm", event: {
                    click: exportSetting
                }
            }, "Export"),
            element("button", {
                class: "btn-sm", event: {
                    click: importSetting
                }
            }, "Import"),
            element("button", {
                class: "btn-sm", event: {
                    click: importCss
                }
            }, "import css"),

        ]));
    }

    function exportSetting() {
        save();
        var exports = JSON.stringify(getConfigObj());
        prompt("Copy:", exports);
    }

    function importSetting() {
        var imports = prompt("Vloz sve vyexportovane nastaveni:", setting);
        if (!imports) {
            return;
        }
        try {
            setting = JSON.parse(imports);
        } catch (err) {
            alert("Invalid JSON!");
            return;
        }
        setupDialogValue(false, setting);
    }

    function importCss() {
        var imports = prompt("Vloz (mimifikovane) css:", getValue('css'));
        if (!imports) {
            return;
        }
        setValue('css', imports);
    }

    function createHead(dialog) {
        dialog.head.appendChild(frag([
            element("button", {
                class: "btn-x", event: {
                    click: close
                }
            }, "X")
        ]));
    }

    function open() {
        if (!css) {
            css = element("style", {"id": "config-css"}, getCssString());
            document.head.appendChild(css);
        }

        if (!dialog) {
            dialog = createDialog(config.title);

            // Create head
            createHead(dialog);

            // Create inputs
            createInputs(dialog);

            // Setup values
            setupDialogValue();

            // Create footer
            createFooter(dialog);

            // Render
            dialog.render();
        }
    }

    function getConfigObj(key) {
        var con;

        if (typeof key == "string") {
            return config.settings[key].value;
        } else {
            if (typeof key == "object") {
                con = key;
            } else {
                con = {};
            }
            for (key in config.settings) {
                con[key] = config.settings[key].value;
            }
            return con;
        }
    }

    function setup(options, loadCallback) {
        ZP_config.init(GM_info.script.name, options);
        ZP_config.onload = loadCallback;
        GM_registerMenuCommand(GM_info.script.name + " - Configure", ZP_config.open);
        loadCallback();
    }

    ZP_config = {
        init: function (title, settings, dialog_css, config_css, callback) {
            config.title = title;
            config.settings = settings;
            var names = GM_getValue('ZP/configNames');
            if (typeof names !== 'undefined' && names) {
                config.settings.configNames.value = JSON.parse(names);
            } else {
                config.settings.configNames.value = [];
            }
            config.configCss = config_css;
            config.dialogCss = dialog_css;
            config.onclose = callback;
            read();
            return ZP_config.get();
        },
        open: open,
        /*		onclose: callback,*/
        get: getConfigObj,
        setup: setup
    };

    return ZP_config;
}();
