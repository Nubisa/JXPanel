/**
 * Created by nubisa on 7/29/14.
 */

/**
 * Created by Nubisa Inc. on 7/24/14.
 */


var database = require("./../app/install/database");
var sqlite2 = require("./../app/install/sqlite2");
var util = require("util");
var fs = require("fs");

var inspect = function(obj) {
    return util.inspect(obj, { depth : 9 });
};

var log = function(obj) {
    console.log(inspect(obj));
}

var start = function() {

    var unlimited = database.getPlan("Unlimited");
    console.log("getPlan", unlimited);

    if (!unlimited) {
        database.AddPlan(null, "Unlimited", {
            maxDomainCount: 10,
            maxUserCount: 10,
            canCreatePlan: false,
            canCreateUser: true,
            planMaximums : {}

        });

        console.log("addUser Kris", database.AddUser("Unlimited", "Kris", {}));
        console.log("addUser Kris2", database.AddUser("Unlimited", "Kris2", {}));
        console.log("deleteUser Kris2", database.deleteUser("Kris2", {}));
        console.log("addUser Kris2", database.AddUser("Unlimited", "Kris2", {}));  // error while adding user again

    }

//    console.log("getUser Kris", database.getUser("Kris"));
//    console.log("getUser Kris2", database.getUser("Kris2"));

};


var update_test = function() {

    database.AddPlan(null, "Unlimited", {
        maxDomainCount: 10,
        maxUserCount: 10,
        canCreatePlan: false,
        canCreateUser: true,
        planMaximums : {}

    });

    database.AddPlan(null, "Plan1", {
        maxDomainCount: 10,
        maxUserCount: 10,
        canCreatePlan: false,
        canCreateUser: true,
        planMaximums : {}
    });


    console.log("addUser Kris", database.AddUser("Unlimited", "Kris", {}));
    console.log("addUser Kris2", database.AddUser("Unlimited", "Kris2", {}));
    console.log("getUser Kris2 before update", database.getUser("Kris2"));
    console.log("getPlan Plan1 before update", database.getPlan("Plan1"));
    var kris2 = database.getUser("Kris2");
    kris2.plan = "Plan1";
    console.log("update Kris2", database.updateUser("Kris2", kris2));
    console.log("getUser Kris2 after update", database.getUser("Kris2"));
    console.log("getPlan Plan1 after update", database.getPlan("Plan1"));
};

//
//
//var start2 = function() {
//    console.log(util.inspect(database.DB));
//
////    console.log("root's hosting plan", util.inspect(database.getUser("root")));
//    console.log("plan1", util.inspect(database.getPlan("plan1")));
//    console.log("getUser kris1", database.getUser("kris1"));
//
////    console.log("deleteUser", inspect(database.deleteUser("fake")));
//};
//
//
//var start3 = function() {
//    database.AddUser("Unlimited", "oguz", {email : "mail"} )
//    database.updateUser("oguz", {email : "mail2"});
//};
//
//
//var start4= function() {
//    database.AddUser("Unlimited", "oguz", {email : "mail"} )
//
//    var oguz = database.getUser("oguz");
//    oguz.email = "mail2";
//    database.updateUser("oguz", oguz);
////    console.log("after update", inspect(database.getUser("oguz")));
//};
//


var start5 = function() {


    var ret = database.AddPlan(null, "Unlimited", {
        maxDomainCount: 10,
        maxUserCount: 10,
        canCreatePlan: true,
        canCreateUser: true,
        planMaximums : {}
    });
    console.log("addPlan Unlimited for Kris", ret);
    console.log("addUser Kris", database.AddUser("Unlimited", "Kris", {}));

    var ret = database.AddPlan("Kris", "Plan1", {
        maxDomainCount: 10,
        maxUserCount: 10,
        canCreatePlan: true,
        canCreateUser: true,
        planMaximums : {}
    });
    console.log("addPlan Plan1 for Kris", ret);

    console.log("addUser Kris2", database.AddUser("Plan1", "Kris2", {}));

    // Kris2 should be displayed
    console.log("getUsersByUserName Kris", inspect(database.getUsersByUserName("Kris")));
};

//
//var fixMaximus = function() {
//    for(var plan in database.DB.Plans) {
//        for(var m in database.DB.Plans[plan].planMaximus) {
//            var v = database.DB.Plans[plan].planMaximus[m];
//        }
//    }
//};


var suspendTest = function() {

    var plan = database.getPlan("plan1");
    plan.SuspendPlan("par1");
//    log(plan);

    plan.SuspendPlan("par2");
//    log(plan);

    plan.UnSuspendPlan("par1");
//    log(plan);

    plan.UnSuspendPlan();
//    log(plan);

};

var testdb = __dirname + "/test.db";

//sqlite2.SetFileName(testdb);
// let's work on empty testdb
if (fs.existsSync(testdb))
    fs.unlinkSync(testdb);


database.ReadDB(function(err) {
    if (err) console.error(err); else suspendTest();
});


var ss = [ ];
console.log(Object.prototype.toString.call(ss));