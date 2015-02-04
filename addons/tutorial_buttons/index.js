var jxpanel = global.getJXPanelAPI(module);

exports.request = function (env, args, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    // calls javascript on client's side
    addonFactory.header.addClientButton("Header client button", "alert('Hello'); return false;");
    // calls javascript method1 at server side with arg "Clicked from header"
    addonFactory.header.addServerButton("Header server button", "method1", "Clicked from header", true);

    // call javascript method1 at server side with arg "Clicked from page"
    var html = addonFactory.html.getServerButton("Server button (raise an error)", "method1", "Clicked from page");

    cb(null, addonFactory.render(html));
};

// this is the method that will be called on server-side whenever any of two server buttons defined above
// will be clicked at the browser side
jxpanel.server.addJSMethod("method1", function (env, params, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    var err = null;
    if (params.arg == "Clicked from page")
        err = "This is an error.";

    cb(err);
});
