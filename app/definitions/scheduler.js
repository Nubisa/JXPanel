var _active_user = require('./active_user');
exports.isBusy = false;

jxcore.tasks.on('message', function(tid, msg){
    if(msg && msg.origin_scheduler){
        if(msg.callFromUser){
            _active_user[msg.callFromUser].apply(null, msg.params);
        }
    }
});

// runs as a jxcore task, should return!!! otherwise there is no next run.
exports.doJobs = {
    define:function(){

        //var _active_user = require('./definitions/active_user');

        var check_users = function(ids){
            var dt = Date.now();

            for(var o in ids){
                if(ids[o]){
                    var tm = parseInt(jxcore.store.shared.read(o));
                    if(tm && dt > tm + 600000){ // 10 mins timeout
                        //_active_user.clearUser(o);
                        process.sendToMain({origin_scheduler:1, callFromUser:"clearUser", params:[o]});
                    }
                }
            }


        };

    },
    logic:function(sessionIDs){

        // check user sessions
        check_users(sessionIDs);

        // check disk quotas


        return true;
    }
};