/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");

exports.name = path.basename(__filename, ".js").toLowerCase();
exports.displayNameLabel = "LanguageDictionary";

exports.settings = {
    columns :[
        {
            name : "_id",
            class : "hidden-320"
        },
        {
            name : "Original",
            class : "original"
        },
        {
            name : "Translation",
            class : "translation"
        }
    ]
};


