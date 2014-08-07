var db = require('../../install/database');
var folders = require('../../definitions/user_folders');
var last_quota_check = 0;

var check_quotas = function(){
    if(Date.now()<last_quota_check + 30000)
       return;
    last_quota_check = 0;
    db.ReadDB(function(err) {
        if(!db.getPlan("Unlimited"))
            return;

        var plans = db.getPlansByPlanName("Unlimited", 1e7);

        var record_updated = false;
        for(var o in plans){
            var plan = db.getPlan(plans[o]);
            var isSuspended = plan.suspended;
            if(!isSuspended){
                var max_disk = plan.planMaximums.plan_disk_space; // plan.planMaximums.plan_traffic -> web traffic
                if(max_disk){                                     // plan.plan_ssh -> ssh access
                    var users = plan.users;
                    for(var i in users){
                        var user = db.getUser(i);

                        var size = folders.getUserPathSize(i);
                        console.log(i, size);
                        if(size>max_disk && !user.suspended){
                            user.SuspendUser("plan_disk_space");
                            record_updated = true;
                        } else
                        if(size<max_disk && user.suspended) {
                            user.UnSuspendUser("plan_disk_space");
                            record_updated = true;
                        }
                    }
                }
            }
        }
        if(record_updated){
            db.updateDBFile();
            process.sendToMain( { reloadDB: true } );
        }
    });
};

exports.check_quotas = check_quotas;