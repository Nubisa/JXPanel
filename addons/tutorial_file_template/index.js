// gets instance of JXpanel API object
var jxpanel = global.getJXPanelAPI(module);

exports.request = function (env, args, cb) {

    // gets instance of JXpanel API object
    var addonFactory = jxpanel.getAddonFactory(env);

    // renders output and sends back to the browser
    cb(null, addonFactory.render("Hello !"));
};
