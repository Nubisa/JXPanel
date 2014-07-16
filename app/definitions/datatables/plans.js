/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");

exports.settings = {
    columns :[ "_checkbox",  "_id", "plan_name", "plan_cpu", "plan_memory"],
    dbTable : sqlite.Plan,
    addForm : "addPlan",
    addFormURL : "addplan.html"
};
