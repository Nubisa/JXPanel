/**
 * Created by Nubisa Inc. on 7/24/14.
 */


var sqlite2 = require("./../install/sqlite2");

sqlite2.SetFileName(__dirname + "/test2.db")

var str = "test of the string 簎艜薤 佹侁刵 炟砏 輘, 斔櫅檷 藽轚酁 墏 犤繵 觓倎";


sqlite2.UpdateDB(str, function (err) {
    if (err) {
        console.error("Cannot update.", err);
    } else {
        console.log("Updated OK.");


        sqlite2.ReadDB(function (err2, str2) {
            if (err2) {
                console.error("Cannot read.", err2);
                return;
            }

            if (str !== str2) {
                console.error("String are not equal.");
                console.error("str1", str);
                console.error("str2", str2);
                return;
            }

            console.log("Read OK.")
        });
    }
});
