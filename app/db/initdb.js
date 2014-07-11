/**
 * Created by Nubisa Inc. on 7/11/14.
 */


// adds field definitions based on forms definitions


var forms = require("../definitions/forms");
var sqlite = require("./sqlite");




var createFields = function(db) {
    for(var form_name in forms.forms) {
        var fields = [];
        var form = forms.forms[form_name];
        for (var name in form.controls) {
            var json = { field_name: name };
            fields.push(json);
        }

        console.log("fields", fields);
        sqlite.User.AddNewFieldRules(db, fields, function (err) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("Fields Added");
            }
        })
    }
};


sqlite.CreateDatabase("./dbfile.db", function (err, db) {
    if (err) {
        console.error(err);
        return;
    } else {
        console.log("DB created OK.");

        createFields(db);
    }

});




