/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');

exports.form = function () {

    var func = function(){
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.controls = [
            {"BEGIN" : "User Details"},

            {
                name:"person_name",
                details:{
                    label: "UserContactName",
                    method: tool.createTextBox,
                    options: { required: true, description : "Some description 2"}
                },
                validation:new validations.String(3)
            },

            {
                name:"person_email",
                details:{
                    label: "UserPassword",
                    method: tool.createTextBox,
                    options: { required: true, password:true }
                }
            },

            {
                name:"person_combo",
                details:{
                    label: "UserCombo",
                    method: tool.createComboBox,
                    options: { values:["a", "b", "c"]}
                }
            },

            {
                name:"person_check",
                details:{
                    label: "UserCheck",
                    method: tool.createCheckBox,
                    options: { required:true }
                }
            },

            {"END" : 1}
        ];
    };



    return new func();
};
