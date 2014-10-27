/**
 * Created by root on 10/13/14.
 */

var db = require("./db");
var shell = require("./shell");

// supported events:
//      userAdd, userUpdate, userRemove,
//      addonInstall, addonUninstall, addonUpdate
//      hostingPlanCriteria, hostingPlanCriteriaChanged
exports.event = function(event_name, args) {

    jxcore.utils.console.log("Event fired. Addon listening", event_name, JSON.stringify(args), "blue");

    if (event_name === "userRemove") {
        // which user?
        db.RemoveDB("all", function(err) {
            return;
        });
    }

    if (event_name === "hostingPlanCriteria") {
        // args null
        // return required

        var intValidation = { type : "Integer", gte : 0 }
        var stringValidation = { type : "String", min : 2, max : 10 };
        var ret = [];
        var txt1 = { type : "text", id : "maxDatabases", options : { label : "Databases", default : null, required : false, validation : intValidation } };
//        var txt2 = { type : "text", id : "txt2", options : { label : "my txt2", default : "some value 2", required : false, validation : stringValidation } };
        ret.push(txt1);
        //ret.push(txt2);

        return ret;
    }

    if (event_name === "hostingPlanCriteriaChanged") {
        // args is array of items like: { id : "maxDatabases", old: 5, new: 6 }
        // return not required

        for(var field_name in args) {
            var obj = args[field_name];
            if (obj.checkSuspension) {

            }
        }
    }

    if (event_name === "addonUninstall") {
        // args null
        // return not required
        shell.mongoStop();
    }

};
