var fs = require('fs');
var server = require('jxm');
var render_engine = require('./rendering/render');
var form_methods = require('./rendering/form_methods');
var charts = require('./definitions/charts/charts');
var site_defaults = require('./definitions/site_defaults');
var _active_users = require('./definitions/active_user');
var database = require("./db/database");
var downloads = require("./definitions/downloads")
var terminal = require("./definitions/terminal");
var path = require("path");

require('http').setMaxHeaderLength(0);

server.setApplication("JXPanel", "/", "NUBISA_JX_PANEL_2014");

server.setConfig("consoleInfo", false);

server.addJSMethod("serverMethod", function (env, params) {
    server.sendCallBack(env, params + " World!");
});

for(var o in form_methods){
    server.addJSMethod(o, form_methods[o]);
}

terminal.defineMethods();
site_defaults.defineMethods();
charts.defineChartMethods();
_active_users.defineMethods();

server.linkResourcesFromPath("/", "../ui/");

server.mediaserver.noCache = true;
render_engine.defineRender(server.mediaserver);

var opts = null;

if(fs.existsSync(__dirname + '/app.dev_config')){
    opts = JSON.parse(fs.readFileSync(__dirname + '/app.dev_config') + "");
}

server.on('request', downloads.check);

database.ReadDB(function(err) {

    if (err)
        throw err;
    else
        server.start(opts);
});




var jx_opt = {};

jx_opt.rootDir = path.join(__dirname, "../__tmp_jx_root/");
jx_opt.dirNativeModules = jx_opt.rootDir + "native_modules/";
jx_opt.dirAppsConfig = jx_opt.rootDir + "app_configs/";

// full path to downloaded jx. will be known after downloading
jx_opt.jxPath = null;
// version of downloaded jx
jx_opt.jxv = null;


process.jxconfig = jx_opt;