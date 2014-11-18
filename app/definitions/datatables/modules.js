/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");

exports.name = path.basename(__filename, ".js").toLowerCase();
exports.displayNameLabel = "JXcoreNPMModules";

exports.settings = {
    columns :[
        "_checkbox",
        "_id", "name",
        {
            name : "version",
            class : "hidden-320"
        },
        {
            name : "description",
            class : "hidden-xs"
        }
    ]
};


