// gets instance of JXpanel API object
var jxpanel = global.getJXPanelAPI(module);

exports.request = function (env, args, cb) {

    // gets factory object related to env
    var addonFactory = jxpanel.getAddonFactory(env);

    // creates form object
    var form = addonFactory.form.new("simple_form");

    // adds first group with one label control (simpleText)
    form.addSection("Simple Text");
    form.addControl("simpleText", "txt0", {label: "Label", value: "text label", required: true});

    // adds second group with three controls: text, checkbox and combobox
    form.addSection("Text Boxes");
    form.addControl("text", "txt1", {label: "Text field", default: "default value"});
    form.addControl("text", "txt2", {label: "Required Text field", required: true, title: "placeholder"});
    form.addControl("password", "txt3", {label: "Password field", default: "default other value"});
    form.addControl("multiline", "txt4", {label: "Multiline Text", default: "first\nsecond\nthird", rows: 3});

    form.addSection("Other Controls");
    form.addControl("checkbox", "chk1", {label: "Checkbox", default: 1});
    form.addControl("combobox", "chk11", {label: "Combobox", default: 2, values: [1, 2, 3]});

    // registering a listener for form's submit
    form.on('submit', function (values, cb) {
        console.log("values from form", values);

        if (values.chk1) {
            // saves form values only if checkbox is enabled
            cb(true);
        } else {
            // otherwise clear form values saved internally
            form.clear();
            cb(false);
        }
    });

    // rendering form + html and sending back to browser
    cb(null, addonFactory.render(form.render()));
};
