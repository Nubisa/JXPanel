if(!global.jxcore){
    console.error("This application requires JXcore to run. Please visit http://jxcore.com");
    return;
}

var ret = jxcore.utils.cmdSync("whoami");
if (ret.out.toString().trim() !== "root") {
    console.error("This application needs to be running as root. Try sudo.");
    return;
}

var fs = require('fs');
var site_defaults = require('./definitions/site_defaults');
var icheck = require('./install/install');

process.on('uncaughtException', function(err) {
   console.error("uncaughtException", err);
});


if(process.argv[2] == "help"){
    jxcore.utils.console.log("Command line options for "+site_defaults.EN.panelName);
    jxcore.utils.console.log("Start: jx index.js");
    jxcore.utils.console.log("Install: jx index.js install");
    jxcore.utils.console.log("Uninstall: jx index.js uninstall");
    jxcore.utils.console.log("ReInstall: jx index.js reinstall");
}

if(process.argv[2] == "uninstall" || process.argv[2] == "reinstall"){
    icheck.uninstall();

    if(process.argv[2] == "uninstall")
        return;
}

if(process.argv[2] === "nginx") {

    var nginx = require("./install/nginx");
    if (process.argv[3] === "start") nginx.start(); else
    if (process.argv[3] === "stop") nginx.stop(); else
    if (process.argv[3] === "reload") nginx.reload(false);

    return;
}

if(process.argv[2] === "ftp") {

    var ftp = require("./install/ftp");
    if (process.argv[3] === "start") ftp.start(); else
    if (process.argv[3] === "stop") ftp.stop(); else
    if (process.argv[3] === "reload") ftp.restart(false);
//    if (process.argv[3] === "test") ftp.denyUser("nubisa");
//    if (process.argv[3] === "allow") ftp.allowUser(process.argv[4]);
//    if (process.argv[3] === "deny") ftp.denyUser(process.argv[4]);

    return;
}


if(icheck.requireInstallation()){
    if(process.argv[2] != "install" && process.argv[2] != "reinstall"){
        jxcore.utils.console.log("To install "+site_defaults.EN.panelName+", use\n" + process.argv[0] + " index install");
        process.exit(0);
    }

    jxcore.utils.console.log("Installing "+site_defaults.EN.panelName);
    icheck.install();
}
else {
    var server = require('jxm');
    var render_engine = require('./rendering/render');
    var form_methods = require('./rendering/form_methods');
    var charts = require('./definitions/charts/charts');
    var _active_users = require('./definitions/active_user');
    var database = require("./install/database");
    var downloads = require("./definitions/downloads")
    var terminal = require("./definitions/terminal");
    var addons_tools = require("./addons_tools");

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
    addons_tools.defineMethods();

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
}
