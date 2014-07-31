var db = require('../../install/database');
var folders = require('../../definitions/user_folders');
var last_quota_check = 0;

var check_quotas = function(){
    if(Date.now()<last_quota_check + 30000)
       return;
    last_quota_check = 0;
    db.ReadDB(function(err) {
        var plans = db.getPlansByPlanName("Unlimited", 1e7);
        for(var o in plans){
            var plan = db.getPlan(plans[o]);
            var isSuspended = plan.suspended;
            if(!isSuspended){
                var max_disk = plan.planMaximums.plan_disk_space; // plan.planMaximums.plan_traffic -> web traffic
                if(max_disk){                                     // plan.plan_ssh -> ssh access
                    var users = plan.users;
                    for(var i in users){
                        var size = folders.getUserPathSize(i);
                        if(size>max_disk){
                            db.getUser(i).SuspendUser("plan_disk_space");
                        }
                    }
                }
            }
        }
    });
};

exports.check_quotas = check_quotas;