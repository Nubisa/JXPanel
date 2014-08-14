var db = require('../../install/database');
var folders = require('../../definitions/user_folders');
var last_quota_check = 0;

var check_quotas = function(){
    if(Date.now()<last_quota_check + 3000)
       return;
    last_quota_check = 0;
    db.ReadDB(function(err) {
        if(!db.getPlan(db.unlimitedPlanName))
            return;

        var plans = db.getPlansByPlanName(db.unlimitedPlanName, 1e7);

        var record_updated = false;
        for(var o in plans){
            var plan = db.getPlan(plans[o]);
            var isSuspended = plan.suspended && plan.suspended.indexOf("plan_disk_space") !== -1;
            if(!isSuspended){
                var max_disk = plan.planMaximums.plan_disk_space; // plan.planMaximums.plan_traffic -> web traffic
                if(max_disk){                                     // plan.plan_ssh -> ssh access
                    var users = plan.users;
                    for(var i in users){
                        var user = db.getUser(i);

                        var isUserSuspended = user.suspended && user.suspended.indexOf("plan_disk_space") !== -1;
                        var size = folders.getUserPathSize(i);
//                        console.log("quota size for user", user.name, "size", size, 'maxdisk', max_disk, "suspended", user.suspended,"isUserSuspended", isUserSuspended );
                        if(size>max_disk && max_disk !== db.defaultMaximum && !isUserSuspended){
                            user.SuspendUser("plan_disk_space");
                            record_updated = true;
                            continue;
                        }
                        if((size<max_disk || max_disk === db.defaultMaximum) && isUserSuspended) {
                            user.UnSuspendUser("plan_disk_space");
                            record_updated = true;
                            continue;
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