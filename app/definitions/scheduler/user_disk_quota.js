var db = require('../../install/database');
var last_quota_check = Date.now();

var check_quotas = function(){
    if(Date.now()<last_quota_check + 30000)
        return;
    last_quota_check = 0;
    db.ReadDB(function(err) {
        var plans = db.getPlansByPlanName("Unlimited", 1e7);
        console.log("plans", plans);
        for(var o in plans){
            console.log(plans[o]);
        }
    });
};

exports.check_quotas = check_quotas;