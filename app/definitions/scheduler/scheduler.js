var _active_user = require('./../active_user');
exports.isBusy = false;

jxcore.tasks.on('message', function(tid, msg){
    if(msg && msg.origin_scheduler){
        if(msg.callFromUser){
            _active_user[msg.callFromUser].apply(null, msg.params);
        }
        else if(msg.restarting){
            exports.isBusy = false;
        }
    }
});

// runs as a jxcore task, should return!!! otherwise there is no next run.
exports.doJobs = {
    define:function(){
        if(!process.scheduler){
            process.scheduler = true;
            process.on('restart', function(cb){
               console.error("Scheduler Thread is Restarted..");
               process.sendToMain({origin_scheduler:1, restarting:true});
               cb();
            });
            process.on('uncaughtException', function(err){
                if(err)
                    console.error(err);
            });
            process.check_users = require('./definitions/scheduler/user_sessions').check_users;
            process.check_quotas = require('./definitions/scheduler/user_disk_quota').check_quotas;
        }
    },
    logic:function(sessionIDs){
        // check user sessions
        process.check_users(sessionIDs);

        // check disk quotas
        process.check_quotas();

        return true;
    }
};