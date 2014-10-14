/**
 * Created by root on 10/13/14.
 */

var db = require("./db");


exports.event = function(event_name, args, cb) {

    jxcore.utils.console.log("Event fired. Addon listening", event_name, JSON.stringify(args), "blue");

    if (event_name === "userRemove") {
        db.RemoveDB("all", function(err) {
            cb(err);
        });
    }
};



exports.uninstall = function(cb) {
    jxcore.utils.console.log("Event fired. Addon Uninstall", "blue");

    cb(false);
};