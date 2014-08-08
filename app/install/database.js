
var sqlite2 = require("./sqlite2");
var util = require('util');

var DB = {Plans:{}, Users:{}, Domains:{}, Config:{}};


var Plans = DB.Plans, Users = DB.Users, Domains = DB.Domains, Config = DB.Config;

var UpdateDB = function(stringToSave){ // KRIS FILL IN
    //save stringToSave to DB
    sqlite2.UpdateDB(stringToSave, function(err) {
        if (err)
            console.error(err);
    });
};

exports.updateDBFile = function(){
   UpdateDB(JSON.stringify(DB));
};

var ReadDB = function(cb){ // KRIS FILL IN

    sqlite2.ReadDB(function(err, fromSQLite) {
        if (!err) {
            DB = JSON.parse(fromSQLite);
            DB.Plans = DB.Plans || {};
            DB.Users = DB.Users || {};
            DB.Domains = DB.Domains || {};
            DB.Config = DB.Config || {};
            Plans = DB.Plans;
            Users = DB.Users;
            Domains = DB.Domains;
            Config = DB.Config;

            for(var o in Plans){
                Plans[o] = new Plan(o, null, Plans[o], true);
                // obsolete value
                delete Plans[o].suspended_reason;
            }
            for(var o in Users){
                Users[o] = new User(o, Users[o].plan, Users[o]);
                // obsolete value
                delete Users[o].suspended_reason;
                if(!Users[o].subPlans){
                    Users[o].subPlans = {};
                }
                if(!Users[o].domains){
                    Users[o].domains = {};
                }
            }

            // just for now removing obsolete values
            for(var o in Domains) {
                delete Domains[o].jx_app_log_web_access;
            }
            exports.DB = DB;
        }
        if (cb) cb(err);
    });
};


var extend = function(base, ext){
    for(var o in ext){
        base[o] = ext[o];
    }
};

var checkSet = function(name, host, sub, allowedValues){

    // false or 0 values may be intentional
    var allowed = false;
    if (allowedValues && allowedValues.length) {
        for(var i in allowedValues)
            if (allowedValues[i] === sub[name]) {
                allowed = true;
                break;
            }
    }

    if(!sub[name] && !allowed){
        throw new Error(name + " is required");
    }
    host[name] = sub[name];
};


exports.OnSuspend = null;
exports.ReadDB = ReadDB;

var operation_enum = {
    AddUser:1,
    AddPlan:2,
    AddDomain:3
};

var Domain = function(name, owner_user, opts){
    this.name = name;
    this.owner = owner_user.name;
    extend(this, opts);
};

var Plan = function(name, owner_user, opts, dummy){
    this.name = name;
    if(!dummy){
        this.owner = owner_user.name;
        checkSet("maxDomainCount", this, opts);
        checkSet("maxUserCount", this, opts);
        checkSet("canCreatePlan", this, opts, [false]);
        checkSet("canCreateUser", this, opts, [false]);
        checkSet("planMaximums", this, opts);
    }

    this.users = {};

    var _totalUsers = function(o_plan){
        var count = 0;
        for(var o in o_plan.users){
            var user = Users[o];

            if(!Users[o])
                continue;

            count++;
            for(var i in user.subPlans){
                var subPlan = Plans[i];
                if(!subPlan.suspended){
                    count += _totalUsers(subPlan);
                }
            }
        }
        return count;
    };

    var _totalDomains = function(o_plan){
        var count = 0;
        for(var o in o_plan.users){
            var user = Users[o];
            if(!Users[o])
                continue;

            for(var _ in user.domains){
                count++;
            }
            for(var i in user.subPlans){
                var subPlan = Plans[i];
                if(!subPlan.suspended){
                    count += _totalDomains(subPlan);
                }
            }
        }
        return count;
    };

    this.totalActiveUsers = function(){_totalUsers(this);};
    this.totalActiveDomains = function(){_totalDomains(this);};

    this.suspended = false;

    this.SuspendPlan = function(o){
        if (!this.suspended)
            this.suspended = [];

        if (this.suspended.trim)
            this.suspended = [ this.suspended ];

        if (this.suspended.indexOf(o) === -1)
            this.suspended.push(o);

        if(exports.OnSuspend){
            exports.OnSuspend(this.name, o, "Plan", true);
        }
    };

    this.UnSuspendPlan = function(o){
        if (o) {
            if (this.suspended) {
                if (this.suspended.trim)
                    this.suspended = [ this.suspended ];
                var pos = this.suspended.indexOf(o);
                if (pos !== -1)
                    this.suspended.splice(pos, 1);
                if (!this.suspended.length)
                    this.suspended = false;
            }
        } else {
            this.suspended = false;
        }

        if(exports.OnSuspend){
            exports.OnSuspend(this.name, o, "Plan", false);
        }
    };

    //todo: this method probably should be also called on UpdateXXX()
    this.CheckOperation = function(_operation_enum, with_opts){
        switch(_operation_enum){
            case operation_enum.AddPlan:
            {
                var res = this.canCreatePlan;
                if(!res){
                    return "PlanCannotAddPlans";
                }

                if(!with_opts.planMaximums){
                    throw new Error("plan should have a planMaximums definition");
                }

                if(with_opts.canCreateUser && !this.canCreateUser){
                    return "PlanCannotAddUsers";
                }

                if(with_opts.maxUserCount>this.maxUserCount){
                    return "PlanCannotAddMoreUsers|" + this.maxUserCount;
                }

                if(with_opts.maxDomainCount>this.maxDomainCount){
                    return "PlanCannotAddMoreDomains|" + this.maxDomainCount;
                }

                for(var o in with_opts.planMaximums){
                    if(this.planMaximums[o]){
                        if(with_opts.planMaximums[o]>this.planMaximums[o]){
                            return "PlanCannotAddMore|" + o + "|" + this.planMaximums[o];
                        }
                    }
                }

                return null;
            }
                break;
            case operation_enum.AddUser:
            {
                if(this.suspended){
                    return "UserSuspended";
                }
                if(!this.canCreateUser){
                    return "PlanCannotAddUsers";
                }
                if(_totalUsers(this)>=this.maxUserCount){
                    return "PlanCannotAddMore|user|" + this.maxUserCount;
                }
                var _owner = Users[this.owner];
                while(_owner){
                    if(!_owner.plan)
                        break;
                    var _plan = Plans[_owner.plan];
                    if(_totalUsers(_plan)>=_plan.maxUserCount){
                        return "PlanParentCannotAddMore|user";
                    }
                    if(!_plan.owner)
                        break;
                    _owner = Users[_plan.owner];
                }
                return null;
            }
                break;
            case operation_enum.AddDomain:
            {
                if(this.suspended){
                    return "UserSuspended";
                }
                if(_totalDomains(this)>=this.maxDomainCount){
                    return "PlanCannotAddMore|domain|" + this.maxDomainCount;
                }
                var _owner = Users[this.owner];
                while(_owner){
                    if(!_owner.plan)
                        break;
                    var _plan = Plans[_owner.plan];
                    if(_totalDomains(_plan)>=_plan.maxDomainCount){
                        return "PlanParentCannotAddMore|domain";
                    }
                    if(!_plan.owner)
                        break;
                    _owner = Users[_plan.owner];
                }
                return null;
            }
                break;

            default:
        }
        throw new Exception("Unknown Operation!");
    };

    extend(this, opts);
};

var User = function(name, parent_plan, opts){
    this.name = name;
    this.domains = {};
    this.plan = parent_plan.name;
    this.subPlans = {};

    this.suspended = false;

    this.SuspendUser = function(o){
        if (!this.suspended)
            this.suspended = [];

        if (this.suspended.trim)
            this.suspended = [ this.suspended ];

        if (this.suspended.indexOf(o) === -1)
            this.suspended.push(o);

        if(exports.OnSuspend){
            exports.OnSuspend(this.name, o, "User", true);
        }
        var plans = exports.getPlansByUserName(this.name);
        for(var i in plans){
            exports.getPlan(plans[i]).SuspendPlan(o);
        }
    };

    this.UnSuspendUser = function(){
        if (o) {
            if (this.suspended) {
                if (this.suspended.trim)
                    this.suspended = [ this.suspended ];
                var pos = this.suspended.indexOf(o);
                if (pos !== -1)
                    this.suspended.splice(pos, 1);
                if (!this.suspended.length)
                    this.suspended = false;
            }
        } else {
            this.suspended = false;
        }

        if(exports.OnSuspend){
            exports.OnSuspend(this.name, null, "User", false);
        }
        var plans = exports.getPlansByUserName(this.name);
        for(var o in plans){
            exports.getPlan(plans[o]).UnSuspendPlan();
        }
    };

    extend(this, opts);
};

var SUPER_USER = {name:"%$$SUPER_USER$$%", subPlans:{}};

var addPlan = function(owner_user, name, opts){
    if(Plans[name]){
        throw new Error(name + " plan exists");
    }
    if(owner_user != null){
        if(!Users[owner_user]){
            throw new Error(owner_user + " not found!");
        }
        owner_user = Users[owner_user];
        var res = Plans[owner_user.plan].CheckOperation(operation_enum.AddPlan, opts);
        if(res){
            return res;
        }
    }else{
        owner_user = SUPER_USER;
    }

    Plans[name] = new Plan(name, owner_user, opts);
    owner_user.subPlans[name] = 1;
    UpdateDB(JSON.stringify(DB));
    return null;
};

var addUser = function(parent_plan, name, opts){
    if(Users[name]){
        throw new Error(name + " user exists");
    }

    if(!Plans[parent_plan]){
        throw new Error(parent_plan + " plan not found!");
    }
    parent_plan = Plans[parent_plan];

    var res = parent_plan.CheckOperation(operation_enum.AddUser);
    if(res)
    {
        return res;
    }

    parent_plan.users[name] = 1;
    Users[name] = new User(name, parent_plan, opts);
    UpdateDB(JSON.stringify(DB));
    return null;
};

var addDomain = function(owner_user, name, opts){
    if(Domains[name]){
        throw new Error(name + " domain exists");
    }

    if(!Users[owner_user]){
        throw new Error(owner_user + " user not found!");
    }

    owner_user = Users[owner_user];
    var plan = Plans[owner_user.plan];

    var res = plan.CheckOperation(operation_enum.AddDomain);
    if(res){
        return res;
    }

    owner_user.domains[name] = 1;
    Domains[name] = new Domain(name, owner_user, opts);
    UpdateDB(JSON.stringify(DB));
    return null;
};

exports.getUsersByPlanName = function(plan_name, deep){
    if(!Plans[plan_name]){
        throw new Error(plan_name + " plan doesn't exist");
    }

    var plan = Plans[plan_name];
    deep--;
    var arr = [];
    for(var o in plan.users){
        arr.push(o);
        if(deep>0){
            var user = Users[o];

            if (!user)
                continue;

            for(var i in user.subPlans){
                arr = arr.concat( exports.getUsersByPlanName(i, deep) );
            }
        }
    }

    return arr;
};

exports.getUsersByUserName = function(user_name, deep){
    if(!Users[user_name]){
        throw new Error(user_name + " user doesn't exist");
    }
    var arr = [];
    var user = Users[user_name];

    for(var o in user.subPlans){
        arr = arr.concat( exports.getUsersByPlanName(o, deep) );
    }

    return arr;
};

exports.getPlansByUserName = function(user_name, deep){
    if(!Users[user_name]){
        throw new Error(user_name + " user doesn't exist");
    }
    deep--;
    var arr = [];
    var user = Users[user_name];

    for(var o in user.subPlans){
        arr.push(o);
        if(deep>0){
            var plan = Plans[o];
            for(var i in plan.users){
                arr = arr.concat( exports.getPlansByUserName(i, deep) );
            }
        }
    }

    return arr;
};

exports.getPlansByPlanName = function(plan_name, deep){
    var users = exports.getUsersByPlanName(plan_name, deep);
    var sub_plans = [];
    for(var i in users){
        var arr = exports.getPlansByUserName(users[i], deep);
        for(var i in arr){
            if(sub_plans.indexOf(arr[i])<0){
                sub_plans.push(arr[i]);
            }
        }
    }

    return sub_plans;
};

exports.getPlanByDomainName = function(name){
    if(!Domains[name]){
        throw new Error(name + " domain doesn't exist");
    }
    var domain = Domains[name];
    var user = Users[domain.owner];
    return Plans[user.plan];
};

exports.getDomainsByUserName = function(user_name, deep){

    if (user_name === null) {
        // gets all domains
        var arr = [];
        for(var domain in Domains) {
            arr.push(domain);
        }
        return arr;
    }

    if(!Users[user_name]){
        throw new Error(user_name + " user doesn't exist");
    }
    deep--;
    var arr = [];
    var user = Users[user_name];

    for(var o in user.domains){
        arr.push(o);
    }

    if(deep>0){
        var users = exports.getUsersByUserName(user_name, deep);
        for(var o in users){
            var sub_user = Users[users[o]];
            for(var i in sub_user.domains){
                arr.push(i);
            }
        }
    }

    return arr;
};

exports.getDomainsByPlanName = function(name, deep) {
    if(!Plans[name]){
        throw new Error(name + " plan doesn't exist");
    }

    var users = exports.getUsersByPlanName(name);
    var arr = [];
    for(var i in users) {
        var domains = exports.getDomainsByUserName(users[i], deep);
        for(var o in domains) {
            arr.push(domains[o]);
        }
    }

    return arr;
};

exports.deleteDomain = function(name){
    if(!Domains[name]){
        throw new Error(name + " domain doesn't exist");
    }
    var user = Users[Domains[name].owner];
    delete(Domains[name]);
    delete(user.domains[name]);
    UpdateDB(JSON.stringify(DB));
    return {deleted:true, domains:[name]};
};

exports.deleteUser = function(name){
    if(!Users[name]){
        throw new Error(name + " user doesn't exist");
    }
    var user = Users[name];
    var subs = {deleted:true, plans:[], users:[name], domains:[]};
    for(var o in user.subPlans){
        var res = exports.deletePlan(o);
        subs.plans = subs.plans.concat(res.plans);
        subs.users = subs.plans.concat(res.users);
        subs.domains = subs.plans.concat(res.domains);
    }

    // removing the user from any plan he is attached to
    for (var plan in Plans) {
        for(var user in Plans[plan].users) {
            if (user === name) {
                delete Plans[plan].users[user];
            }
        }
    }

    // removing domains of that user
    for(var domain in Domains) {
        var owner = Domains[domain].owner;
        if (owner === name) {
            delete(Domains[domain]);
        }
    }


    delete(Users[name]);
    UpdateDB(JSON.stringify(DB));
    return subs;
};

exports.deletePlan = function(name){
    if(!Plans[name]){
        throw new Error(name + " plan doesn't exist");
    }

    var plan = Plans[name];

    var owner = Users[plan.owner];
    if(!owner){
        throw new Error(plan.owner + " user doesn't exist");
    }

    var arr_users = exports.getUsersByPlanName(name,1e5);
    var arr_plans = [], arr_domains = [];
    for(var o in arr_users){
        arr_plans = arr_plans.concat(exports.getPlansByUserName(arr_users[o], 1e5));
        arr_domains = arr_domains.concat(exports.getDomainsByUserName(arr_users[o], 1e5));
    }

    delete(owner.subPlans[name]);
    delete(Plans[name]);
    for(var o in arr_users){
        delete(Users[arr_users[o]]);
    }
    for(var o in arr_domains){
        delete(Domains[arr_domains[o]]);
    }
    for(var o in arr_plans){
        delete(Plans[arr_plans[o]]);
    }

    UpdateDB(JSON.stringify(DB));
    return {deleted:true, plans:arr_plans, users:arr_users, domains:arr_domains};
};


exports.isOwnerOfUser = function(who, whom) {
    var arr = exports.getUsersByUserName(who);
    return arr.indexOf(whom) !== -1;
};

exports.isOwnerOfDomain = function(who, whom) {
    var arr = exports.getDomainsByUserName(who);
    return arr.indexOf(whom) !== -1;
};

exports.isOwnerOfPlan = function(who, whom) {
    var arr = exports.getPlansByUserName(who);
    return arr.indexOf(whom) !== -1;
};



exports.updateUser = function(name, data){
    if(!Users[name]){
        throw new Error(name + " user doesnt exist");
    }

    var user = Users[name];
    var parent_plan = Plans[user.plan];

    if(data.plan != user.plan){
        var top_owner = Users[parent_plan.owner];
        if(!top_owner.subPlans[data.plan]){
            throw new Error("Parent plan doesn't have given new plan name "+data.plan);
        }
    }

    var old_domains = JSON.stringify(user.domains);
    var new_domains = JSON.stringify(data.domains);
    if(old_domains != new_domains){
        throw new Error("You can't update user's domains from updateUser");
    }

    var old_plans = JSON.stringify(user.subPlans);
    var new_plans = JSON.stringify(data.subPlans);
    if(old_plans != new_plans){
        throw new Error("You can't update user's sub plans from updateUser");
    }

    Users[name] = data;
    UpdateDB(JSON.stringify(DB));
    return null;
};

exports.updateDomain = function(name, data){
    if(!Domains[name]){
        throw new Error(name + " domain doesnt exist");
    }

    var domain = Domains[name];
    var user = Users[domain.owner];

    if(data.owner != user.name){
        Domains[name] = null;
        var res = addDomain(data.owner, name, data);
        if(res){
            Domains[name] = domain;
            return res;
        }
        delete(user.domains[name]);
    }
    else{
        Domains[name] = new Domain(name, user, data);
    }
    UpdateDB(JSON.stringify(DB));
    return null;
};

exports.updatePlan = function(name, data){
    if(!Plans[name]){
        throw new Error(name + " plan doesn't exist");
    }

    var plan = Plans[name];
    if(plan.owner != data.owner){
        throw new Error("You can't change the owner of a plan");
    }

    var parent_plan = Users[plan.owner].plan;
    var res = Plans[parent_plan].CheckOperation(operation_enum.AddPlan, data);
    if(res){
        return res;
    }

    // this is pointless
    // plan and data are already the same.
    // data is plan object with values and methods fetched by database.getPlan("modified_plan")
//    var max_org = plan.planMaximums;
    var max_new = data.planMaximums;
    var sub_plans = exports.getPlansByPlanName(name, 1e5);

    for(var o in max_new){
//        if(max_org[o]){
//            if(max_new[o]<max_org[o]){
                for(var i in sub_plans){
                    var sub_plan = Plans[sub_plans[i]];
                    if(sub_plan.planMaximums[o]){
                        if(sub_plan.planMaximums[o]>max_new[o]){
                            sub_plan.SuspendPlan(o);
                        }
                    }
                }
//            }
//        }
    }

    var totalUsers = plan.totalActiveUsers();
    if(max_new.maxUserCount<totalUsers){
        max_new.SuspendPlan("maxUserCount");
    }
    var totalDomains = plan.totalActiveDomains();
    if(max_new.maxDomainCount<totalDomains){
        max_new.SuspendPlan("maxDomainCount");
    }

    data.UnSuspendPlan();
    Plans[name] = data;
    UpdateDB(JSON.stringify(DB));
    return null;
};

exports.getDomain = function(name){
    return Domains[name];
};

exports.getPlan = function(name){
    return Plans[name];
};

exports.getParentPlanName = function(name){
    var plan = Plans[name];
    if(!plan)
        return null;

    var user = Users[plan.owner];
    if(!user)
        return null;

    if(name == user.plan)
        return null;

    return user.plan;
};

exports.getUser = function(name){
    return Users[name];
};


exports.setConfig = function(config) {
    DB.Config = config;
    Config = DB.Config;
    UpdateDB(JSON.stringify(DB));
};

exports.getConfig = function() {
    return Config;
};

exports.setConfigValue = function(param, value, update) {
    Config[param] = value;
    if (update)
        UpdateDB(JSON.stringify(DB));
};

exports.getConfigValue = function(param) {
    return Config[param];
};

exports.fixDatabase = function() {

    var arr_plans = [], arr_domains = [], arr_users = [];
    var errors = [];

    var concat = function(ret) {
        arr_plans = arr_plans.concat(ret.plans);
        arr_domains = arr_domains.concat(ret.domains);
        arr_users = arr_users.concat(ret.users);
    };

    // removing dummy plans (without owner)
    for(var plan in Plans) {

        var owner = Plans[plan].owner;

        if (!Users[owner] && owner !== SUPER_USER.name) {
            // plan without owner
            var ret = exports.deletePlan(plan);
            if (!ret.deleted)
                errors.push("Cannot delete plan " + plan);

            concat(ret);
        } else {
            // if plan still keeps unexistent users
            for(var user in Plans[plan].users) {
                if (!Users[user]) {
                    delete Plans[plan].users[user];
                }
            }
        }
    }

    // removing dummy domain (without owner)
    for(var domain in Domains) {
        var owner = Domains[domain].owner;
        if (!Users[owner] && owner !== SUPER_USER.name) {
            delete Domains[domain];
            arr_domains.push(domain);
        }
    }


    // removing dummy users (without a plan)
    for(var user in Users) {
        var plan = Users[user].plan;
        if (!Plans[plan]) {
            delete Users[user];
            arr_users.push(user);
        }
    }

    if (errors.length) {
        return null;
    } else {
        UpdateDB(JSON.stringify(DB));
        return { plans: arr_plans, users: arr_users, domains: arr_domains};
    }
};


exports.AddPlan = addPlan;
exports.AddDomain = addDomain;
exports.AddUser = addUser;