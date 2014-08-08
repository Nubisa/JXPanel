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

exports.check_users = check_users;