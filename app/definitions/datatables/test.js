/**
 * Created by Nubisa Inc. on 7/15/14.
 */

exports.columns = ["ID", "Name", "LastName"];


exports.getData = function (active_user, cb) {
    var rows = [];

    for (var y = 1; y <= 10; y++) {
        var row = [];
        for (var x in exports.columns) {
            row.push(x + "." + y);
        }
        rows.push(row);
    }

    cb(false, rows);
};



