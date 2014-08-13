var server = require('jxm');
var form_lang = require('./form_lang');
var system_tools = require("./../system_tools");
var database = require("./../install/database");
var site_defaults = require("./site_defaults");
var nginxconf = require("../spawner/nginxconf");
var nginx = require("../install/nginx");
var _active_user = require("../definitions/active_user");


/**
 *
 * @param minSize - optional
 * @param maxSize - optional
 * @constructor
 */
exports.String = function (minSize, maxSize) {
    this.min = parseInt(minSize);
    this.max = parseInt(maxSize);

    if (isNaN(this.min) && isNaN(this.max)) {
        // no params, so consider value to be validated
        return {result: true};
    }

    this.validate = function (env, active_user, val) {
        if (!isNaN(this.min) && val.trim().length < this.min) {
            return {result: false, msg: form_lang.Get(active_user.lang, "RequiresMinimumLength", null, [this.min])};
        } else if (!isNaN(this.max) && val.trim().length > this.max) {
            return {result: false, msg: form_lang.Get(active_user.lang, "RequiresMaximumLength", null, [this.max])};
        }

        return {result: true};
    };
};


exports.Email = function () {

    this.validate = function (env, active_user, val) {

        // todo: better email validation
        var regexp = /.+\@.+\..+/;
        var ret = regexp.exec(val);

        if (ret === null) {
            return {result: false, msg: form_lang.Get(active_user.lang, "EmailInvalid", null)};
        } else {
            return {result: true};
        }
    };
};

exports.Boolean = function () {

    this.validate = function (env, active_user, val) {

        var allowed = [ "1", "0", "true", "false" ];

        var pos = allowed.indexOf("" + val.toString().toLowerCase());

        if (pos === -1) {
            return {result: false, msg: form_lang.Get(active_user.lang, "ValueInvalidBoolean", null)};
        } else {
            return {result: true};
        }
    };
};


exports.Int = function (options) {

    this.options = options;

    this.validate = function (env, active_user, val) {

        if (!val && (val + "" !== "0" || val === "")) {
            return {result: true};
        }

        var parsed = parseInt(val);

        var reg = new RegExp("^\\d+$");

        if (isNaN(parsed) || !reg.test(val)) {
            return {result: false, msg: form_lang.Get(active_user.lang, "ValueInvalidInteger", null)};
        }

        var translate = function(txt) {
            return form_lang.Get(active_user.lang, txt, true);
        };

        if (this.options) {
            var params = [];
            var err = false;

            if (this.options.gt || this.options.gt === 0) {
                params.push(translate("greater than") + " " + this.options.gt);
                if (parsed <= this.options.gt) err = true;
            }

            if (this.options.gte || this.options.gte === 0) {
                params.push(translate("greater than") + " " + this.options.gte + " (" + translate("or") + " " + translate("equal" + ")"));
                if (parsed < this.options.gte) err = true
            }

            if (this.options.lt || this.options.lt === 0) {
                params.push(translate("less than") + " " + this.options.lt);
                if (parsed >= this.options.lt) err = true;
            }

            if (this.options.lte || this.options.lte === 0) {
                params.push(translate("less than") + " " + this.options.lte +  " (" + translate("or") + " " + translate("equal" + ")"));
                if (parsed > this.options.lte) err = true;
            }

            if (err) {
                var delim = " " + translate("and") + " ";
                return {result: false, msg: form_lang.Get(active_user.lang, "ValueShouldBe", null, [ params.join(delim) ])};
            }
        }

        return {result: true};
    };
};


exports.Password = function (password_field) {

    var _password_field = password_field;

    this.validate = function (env, active_user, val, params) {

        if (params.controls && params.controls[_password_field] === val) {
            return {result: true};
        } else {
            return {result: false, msg: form_lang.Get(active_user.lang, "PasswordDoesNotMatch", null)};
        }
    };
};


exports.MaxPort = function(min_port_field) {

    var _min_port_field = min_port_field;

    this.validate = function (env, active_user, val, params) {

        var min = params.controls[_min_port_field];
        var max = val;
        var ret = new exports.Int({ gt : min, lte : site_defaults.defaultAppMaxPort }).validate(env, active_user, val, params.controls);
        if (!ret.result) return ret;

        var domains = database.getDomainsByUserName(null, 1e5);
        if ((max - min) < domains.length * 2)
            return {result: false, msg: form_lang.Get(active_user.lang, "JXcoreAppSmallPortRange", true, [ domains.length * 2, max - min ])};

        return {result : true} ;
    };
};


exports.UserName = function() {

    this.validate = function (env, active_user, val) {

        var reg = /[^0-9A-Za-z_]/;

        if (val.match(reg) !== null || val.length >31)
            return {result: false, msg: form_lang.Get(active_user.lang, "UsernameEnterRequired", true)};

        if (system_tools.systemUserExists(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "UserSystemAlreadyExists", true)};

        if (database.getUser(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "UserAlreadyExists", true)};

        return {result: true};
    };
};


exports.Domain = function() {

    this.validate = function (env, active_user, val) {

        // todo: better email validation
        var reg = new RegExp("^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,4}$", "i");

        if (!reg.test(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainInvalid", true)};

        if (database.getDomain(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainAlreadyExists", true)};

        var domains = database.getDomainsByUserName(null, 1e5);

        var cfg = database.getConfig();
        var min = cfg.jx_app_min_port;
        var max = cfg.jx_app_max_port;

        var needed = domains.length * 2 + 2;
        if (max - min < needed)
            return { result: false, msg: form_lang.Get(active_user.lang,  "DomainCannotAdd", true) + " " + form_lang.Get(active_user.lang, "JXcoreAppSmallPortRange", true, [needed, max - min] )};

        return {result: true};
    };
};


// verifies plan name
exports.Plan = function() {

    this.validate = function (env, active_user, val) {

        if (database.getPlan(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "PlanAlreadyExists", true)};

        return {result: true};
    };
};

// validates app's file name
exports.FileName = function() {

    this.validate = function (env, active_user, val) {

        var cannotContain = [ './', '/.', '.\\', '\\.', '\n', '\r', '\t' ];
        var cannotStart = [ '/', '\\', ' ', '..'];

        var str = val + "";
        for(var o in cannotContain) {
            if (str.indexOf(cannotContain[o]) !== -1)
                return {result: false, msg: form_lang.Get(active_user.lang, "PathCannotContain", true, [cannotContain[o]])};
        }

        for(var o in cannotStart) {
            var tmp = cannotStart[o];
            if (str.slice(0, tmp.length) === tmp)
                return {result: false, msg: form_lang.Get(active_user.lang, "PathCannotStart", true, [cannotStart[o]])};
        }

        return {result: true};
    };
};

exports.NginxDirectives = function() {

    this.validate = function (env, active_user, val, params) {

        if (!val || val === "" || (val && val.trim() === ""))
            return {result: true};

        var plan_name = _active_user.isRecordUpdating(active_user, params.form);
        if (!plan_name)
            return {result: false, msg: form_lang.Get(active_user.lang, "PlanInvalid", true )};

        var plan = database.getPlan(plan_name);
        if (!plan)
            return {result: false, msg: form_lang.Get(active_user.lang, "PlanInvalid", true )};

        var configString = nginxconf.createConfig("jxcorefakedomain.com", [ 10000, 10001], null, params.controls["plan_nginx_directives"]);
        var test = nginx.testConfig(configString);

        if (test.err)
            return {result: false, msg: form_lang.Get(active_user.lang, "NginxDirectivesInvalid", true ) + " " + test.err};

        return {result: true};
    };
};



