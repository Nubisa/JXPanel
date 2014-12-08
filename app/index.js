var system_tools = require("./system_tools");
if (!system_tools.platformSupported())
    process.exit();

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

var index = process.argv.indexOf(__filename);
var argv = process.argv.slice(index + 1);

if(argv[0] == "help"){
    jxcore.utils.console.log("Command line options for "+site_defaults.EN.panelName);
    jxcore.utils.console.log("Start: jx index.js");
    jxcore.utils.console.log("Install: jx index.js install");
    jxcore.utils.console.log("Uninstall: jx index.js uninstall");
    jxcore.utils.console.log("ReInstall: jx index.js reinstall");
}

if(argv[0] == "uninstall" || argv[0] == "reinstall"){
    icheck.uninstall();

    if(argv[0] == "uninstall")
        return;
}

var unknownArg = function() {
    console.log("Unknown parameters: " + argv.join(" "));
    process.exit();
};

if(argv[0] === "nginx") {

    var nginx = require("./install/nginx");
    if (argv[1] === "start") return nginx.startIfStopped(true, true); else
    if (argv[1] === "stop") return nginx.stopIfStarted(true, true); else
    if (argv[1] === "restart") return nginx.restart(true, true); else
    if (argv[1] === "reload") return nginx.reload(false); else
    if (argv[1] === "fix" && argv[2] === "config") {

        var ip_tools = require("./ip_tools");
        var database = require("./install/database");
        var hosting_tools = require("./hosting_tools");
        database.ReadDB(function(err) {
            if (err)
                throw err;

            var invalid_domains = ip_tools.getAppsWithInvalidIP();
            if (invalid_domains.length) {

                hosting_tools.appStopMultiple(invalid_domains, function(err){
                    if (err)
                        console.error("There were some errors while trying to stop applications.", err);
                    else
                        console.log("OK");
                });
            }
        });
        return;
    } else
    return unknownArg();
}

if(argv[0] === "ftp") {

    var ftp = require("./install/ftp");
    if (argv[1] === "start") return ftp.startIfStopped(true); else
    if (argv[1] === "stop") return ftp.stopIfStarted(true); else
    if (argv[1] === "reload") return ftp.restart(); else
    if (argv[1] === "deny" || argv[1] === "allow") {

        var database = require("./install/database");
        database.ReadDB(function(err) {
            if (err)
                throw err;

            var ret = true;
            if (argv[1] == "deny")
                ret = ftp.denyUser(argv[2], true);
            else
            if (argv[1] == "allow")
                ret = ftp.allowUser(argv[2], true);

            if (ret.err)
                system_tools.console.error(ret.err);

            return; // do not use process.exit() as changes in db may not be saved
        });
        return;
    } else
        return unknownArg();
}


if(argv[0] === "set") {

    if (argv[1] === "address") {
        var syntax = "The syntax is:\nset address [IP address or domain name]";

        var ip_tools = require("./ip_tools");
        var validations = require("./definitions/validations");

        var valid_domain = validations.checkDomain(argv[2]);
        var supported_ip = ip_tools.isSupported(argv[2]);

        if (!argv[2] || (!valid_domain && !supported_ip)) {
            console.log("Please provide valid argument. " + syntax);
            return;
        }

        var database = require("./install/database");
        database.ReadDB(function(err) {
            if (err)
                throw err;

            database.setConfigValue("address", argv[2], true);
            return;
        });
        return;
    }

    return unknownArg();
}

if(argv[0] === "fix") {

    if ((argv[1] || "").toLowerCase() === "ip") {
        var syntax = "The syntax is:\nfix IP [old IP address] [new IP address]"

        if (!argv[2] || !argv[3]) {
            console.log("Please provide valid IP address. " + syntax);
            return;
        }

        var ip_tools = require("./ip_tools");
        var database = require("./install/database");
        database.ReadDB(function(err) {
            if (err)
                throw err;

            var ret = ip_tools.replaceIP(argv[2], argv[3]);
            if (ret.err)
                console.error(ret.err);
            else
                console.log("OK");

            return;
        });
        return;
    }

    return unknownArg();
}


if(icheck.requireInstallation()){
    if(argv[0] != "install" && argv[0] != "reinstall"){
        jxcore.utils.console.log("To install "+site_defaults.EN.panelName+", use\n" + process.argv[0] + " index install");
        process.exit(0);
    }

    jxcore.utils.console.log("Installing "+site_defaults.EN.panelName);
    icheck.install();
}
else {

    if (argv[0])
        return unknownArg();

    var server = require('jxm');
    var render_engine = require('./rendering/render');
    var form_methods = require('./rendering/form_methods');
    var charts = require('./definitions/charts/charts');
    var _active_users = require('./definitions/active_user');
    var database = require("./install/database");
    var downloads = require("./definitions/downloads")
    var terminal = require("./definitions/terminal");
    var addons_tools = require("./addons_tools");
    var nginx = require("./install/nginx");
    var ftp = require("./install/ftp");
    var help_tools = require("./help/help_tools");
    var hosting_tools = require("./hosting_tools");

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
    help_tools.defineMethods();

    server.linkResourcesFromPath("/", "../ui/");

    server.mediaserver.noCache = true;
    render_engine.defineRender(server.mediaserver);

    var opts = null;

    if(fs.existsSync(__dirname + '/app.dev_config')){
        opts = JSON.parse(fs.readFileSync(__dirname + '/app.dev_config') + "");
    }

    opts = opts || {};
    opts.port = site_defaults.port;

    server.on('request', downloads.check);

    database.ReadDB(function(err) {

        var address = database.getConfigValue("address");
        if (address)
            opts.address = address;

        if (err)
            throw err;
        else {
            server.on("start", function() {

                hosting_tools.getMonitorJSON(false, function(err) {
                    if (err) {
                        // monitor offline, for safety we can delete nginx configs, since they will be recreated on apps start
                        nginx.removeAllConfigs();

                        if (nginx.restart(false, true).err || ftp.startIfStopped().err)
                            process.exit();
                    }

                    var str =
                        "\n\tYou can use the following commands to change IP address:\n" +
                        "\t$ jx index set address [IP address or domain name]\n";

                    jxcore.utils.console.log(str);
                });

            });

            server.start(opts);
        }
    });
}
