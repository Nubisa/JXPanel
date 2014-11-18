/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");

exports.name = path.basename(__filename, ".js").toLowerCase();
exports.displayNameLabel = "DomainsUpperCase";

exports.settings = {
    columns :[
        "_checkbox",
        {
            name : "_id",
            class : "hidden-320"
        },
        {
            name : "domain_name",
            class : "hidden-480"
        },
        {
            name : "user_owner_id",
            class : "hidden-xs"
        },
        {
            name: "plan_table_id",
            displayName : "PlanID",
            class : "hidden-480"
        },
        {
            name: "port_http",
            displayName: "TCP",
            class : "hidden-xs hidden-sm"
        },
        {
            name: "ssl",
            class : "hidden-xs hidden-sm"
        },
        {
            name : "jx_app_status",
            class : "hidden-480"
        },
        {
            name : "jx_app_status_short",
            class : "visible-480"
        }
    ],
    addForm : "addDomain",
    addFormURL : "adddomain.html"
};


