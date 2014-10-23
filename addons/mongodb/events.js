/**
 * Created by root on 10/13/14.
 */

var db = require("./db");
var shell = require("./shell");

// supported events:
//      userAdd, userUpdate, userRemove,
//      addonInstall, addonUninstall, addonUpdate
exports.event = function(event_name, args, cb) {

    jxcore.utils.console.log("Event fired. Addon listening", event_name, JSON.stringify(args), "blue");

    if (event_name === "userRemove") {
        db.RemoveDB("all", function(err) {
            if (cb) cb(err);
            return;
        });
    }

    if (event_name === "hostingPlanCriteria") {

        var intValidation = { type : "Integer", gte : 0 }
        var stringValidation = { type : "String", min : 2, max : 10 };
        var ret = [];
        var txt1 = { type : "text", id : "txt1", options : { label : "Databases", default : null, required : false, validation : intValidation } };
        var txt2 = { type : "text", id : "txt2", options : { label : "my txt2", default : "some value 2", required : false, validation : stringValidation } };
        ret.push(txt1);
        ret.push(txt2);

        return ret;
    }

    if (event_name === "addonUninstall") {
        shell.mongoStop();
    }

    if (cb) cb();
};
