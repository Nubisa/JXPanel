# {{linklabel.addons_api_tutorials}}

## Hello World

This example contains only two files:

#### package.json

```js
{
    "name": "The Hello World add-on",
    "id" : "tutorial_hello_world"
}
```

#### index.js

```js
exports.request = function(env, args, cb) {
    cb(null, "Hello!");
};
```

That is enough to display "Hello!" in a browser each time user enters the add-on e.g. by clicking it at {{link.addonm}} table list.

However this kind of add-on does not bring much of use. Please see below to find more practical examples.

---

## Buttons

#### package.json

```js
{
    "name": "Buttons tutorial",
    "id" : "tutorial_buttons"
}
```

#### index.js

```js
var jxpanel = global.getJXPanelAPI(module);

exports.request = function (env, args, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    // calls javascript on client's side
    addonFactory.header.addClientButton("Header client button", "alert('Hello'); return false;");
    // calls javascript method1 at server side with arg "Clicked from header"
    addonFactory.header.addServerButton("Header server button", "method1", "Clicked from the header", true);

    // call javascript method1 at server side with arg "Clicked from page"
    var html = addonFactory.html.getServerButton("Server button (raise an error)", "method1", "Clicked from the page");

    cb(null, addonFactory.render(html));
};

// this is the method that will be called on server-side whenever any of two server buttons defined above
// will be clicked at the browser side
jxpanel.server.addJSMethod("method1", function (env, params, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    var err = null;
    if (params.arg == "Clicked from the page")
        err = "This is an error.";

    cb(err);
});

```

The sample code above defines two header buttons (visible at the top of the page) and also one page button.

The first of header buttons is a client-button and calls provided javascript code on the client-side (`alert('Hello'); return false;`).
Next, there is a server-button which calls *method1* on the server-side (passing a string argument "Clicked from the header"),
and it is defined with `jxpanel.server.addJSMethod()` function.

There is also one more button, but it doesn't appear on the header - it is displayed on the page frame, but it's also a server-button kind.
It calls the same *method1* but with a different argument ("Clicked from the page").

The `method1()` itself in this example it's not doing much - it just send an error to the browser client whenever page button is clicked
(to illustrate how to generate errors and also receive function arguments).


---

## Simple form

#### package.json

```js
{
    "name": "Simple form",
    "id" : "tutorial_form"
}
```

#### index.js

```js
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
```
This example displays simple form like on the picture below.
Please follow the comments for code's explanation. The full documentation can be found here: APIFACTORY.

{{imgb.tutorial_form}}
