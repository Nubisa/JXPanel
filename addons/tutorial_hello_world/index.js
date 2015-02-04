
/**
 * This is addon's response on url: addon.html?hello_world.
 * The method should return an html, which will be displayed in a browser.
 * @param env
 * @param args
 * @param cb
 */
exports.request = function(env, args, cb) {
    cb(null, "Hello!");
};
