var _active_user = require('./active_user');
exports.isBusy = false;

jxcore.tasks.on('message', function(tid, msg){
   if(msg){
       if(msg.scheduler){
           if(msg.callFromUser){
               _active_user[msg.userCall].apply(null, msg.params);
           }
       }
   }
});

// runs as a jxcore task, should return!!! otherwise there is no next run.
exports.doJobs = {
    define:function(){

        //var _active_user = require('./definitions/active_user');

        var check_users = function(users){
            var dt = Date.now();

            for(var o in users){
                if(users[o]){
                    if(dt > users[o].lastOperation + 600000){ // 10 mins timeout
                        //_active_user.clearUser(o);
                        process.sendToMain({scheduler:1, callFromUser:"clearUser", params:[o]});
                    }
                }
            }


        };

    },
    logic:function(users){

        // check user sessions
        check_users(users);

        // check disk quotas


        return true;
    }
};