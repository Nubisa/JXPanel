var server = require('jxm');
var form_lang = require('./form_lang');
var system_tools = require("./../system_tools");
var hosting_tools = require("./../hosting_tools");
var ip_tools = require("./../ip_tools");
var database = require("./../install/database");
var site_defaults = require("./site_defaults");
var nginxconf = require("../spawner/nginxconf");
var root_functions = require("../spawner/root_functions");
var nginx = require("../install/nginx");
var _active_user = require("../definitions/active_user");
var path = require('path');
var fs = require("fs");
var pam = require('authenticate-pam');
var form_tools = require('../rendering/form_tools');
var apps_tools = require('../rendering/apps_tools');
var addDomain = require("../definitions/forms/addDomain");
var util = require("util");

// forces the form to ask user a question in order to confirm something
var needToConfirm = function(active_user, formName, input_id, title, confirm_text) {
    var options = { extra : { formName : formName } };
    options.checkbox_text = form_lang.Get(active_user.lang, "UsernameReuse", true);
    var res = form_tools.createCheckBox("", "", input_id + "_ok", true, active_user, options );
    var fakeId = active_user.session.forms[formName].fakeIdsReversed[input_id];
    var ntc = { id: fakeId, id_ok : res.fakeId, title : title, msg : confirm_text, html : res.html };
    return { result : false, ntc : ntc};
};


/**
 *
 * @param minSize - optional
 * @param maxSize - optional
 * @constructor
 */
exports.String = function (minSize, maxSize) {
    this.min = parseInt(minSize);
    this.max = parseInt(maxSize);

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

        var strValid = new exports.String(5);
        var ret = strValid.validate(env, active_user, val, params);
        if (!ret.result) return ret;

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
        var ret = new exports.Int({ gt : min, lte : site_defaults.defaultAppMaxPort }).validate(env, active_user, val);
        if (!ret.result) return ret;

        var domains = database.getDomainsByUserName(null, 1e5);
        if ((max - min) < domains.length * 2)
            return {result: false, msg: form_lang.Get(active_user.lang, "JXcoreAppSmallPortRange", true, [ domains.length * 2, max - min ])};

        return {result : true} ;
    };
};


exports.UserName = function() {

    this.validate = function (env, active_user, val, params) {

        var reg = /[^0-9A-Za-z_]/;

        if (val.match(reg) !== null || val.length >31)
            return {result: false, msg: form_lang.Get(active_user.lang, "UsernameEnterRequired", true)};

        if (database.getUser(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "UserAlreadyExists", true)};

        if (system_tools.systemUserExists(val)) {
            var pwd = params.controls['person_password'];
            var reuse = params.controls['person_username_ok'];

            var ret = jxcore.utils.cmdSync('id -g -n ' + params.controls['person_username']);
            if (ret.out.toString().trim() === "jxman") {

                if (!reuse) {
                    var fakeId = active_user.session.forms[params.form].fakeIdsReversed['person_username'];
                    var title = form_lang.Get(active_user.lang, "UserSystemAlreadyExists", true);
                    var txt = form_lang.Get(active_user.lang, "UserSystemReuse", true);
                    return needToConfirm(active_user, params.form, "person_username", title, txt);
                }

                // user checked "reuse" checkbox
                var error = null;
                pam.authenticate(val, pwd, function(err) {
                    error = err;
                    jxcore.utils.continue();
                });
                jxcore.utils.jump();
                if (error)
                    return {result: false, msg: form_lang.Get(active_user.lang, "PasswordFailed", true)};

            } else {
                return {result: false, msg: form_lang.Get(active_user.lang, "UserSystemAlreadyExists", true)};
            }
        }

        return {result: true};
    };
};


exports.Domain = function() {

    this.validate = function (env, active_user, val, params, field_name) {

        var reg = new RegExp("^([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.)+[a-zA-Z]{2,4}$", "i");

        if (!reg.test(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainInvalid", true)};

        var changed = false;
        if (val.slice(0,4).toLowerCase() === "www.") {
            val = val.slice(4);
            changed = true;
        }

        if (database.getDomain(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainAlreadyExists", true)};

        var domains = database.getDomainsByUserName(null, 1e5);
        var port_range = hosting_tools.getPortRange();

        var needed = domains.length * port_range.ppd + port_range.ppd;
        if (port_range.count < needed)
            return { result: false, msg: form_lang.Get(active_user.lang,  "DomainCannotAdd", true) + " " + form_lang.Get(active_user.lang, "JXcoreAppSmallPortRange", true, [needed, port_range.count] )};

        // value update
        if (changed) params.controls[field_name] = val;
        return {result: true};
    };
};


exports.SubDomain = function() {

    this.validate = function (env, active_user, val, params, field_name) {

        var reg = new RegExp("^([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.)+$", "i");

        if (!reg.test(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "SubDomainInvalid", true)};

        // value update
        if (val.slice(0,4).toLowerCase() === "www.")
            val = val.slice(4);

        var main_domain = addDomain.getMainDomainName(active_user, params.form);
        if (!main_domain)
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainNotFoundForSubdomain", true)};

        if (val.slice(-main_domain.length) === main_domain)
            return {result: false, msg: form_lang.Get(active_user.lang, "SubDomainName_Description", true, [ main_domain ])};

        // expanding to full domain name
        val = val + "." + main_domain;

        if (database.getDomain(val))
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainAlreadyExists", true)};

        var domains = database.getDomainsByUserName(null, 1e5);
        var port_range = hosting_tools.getPortRange();

        var needed = domains.length * port_range.ppd + port_range.ppd;
        if (port_range.count < needed)
            return { result: false, msg: form_lang.Get(active_user.lang,  "DomainCannotAdd", true) + " " + form_lang.Get(active_user.lang, "JXcoreAppSmallPortRange", true, [needed, port_range.count] )};

        // value update
        params.controls[field_name] = val;
        params.controls["main_domain_name"] = main_domain;

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

        var configString = nginxconf.createConfig("jxcorefakedomain.com", [ 9998, 9999 ], null, params.controls["plan_nginx_directives"], null, ip_tools.getUserIPs(active_user, "both"));
        var test = nginx.testConfig(configString);

        if (test.err)
            return {result: false, msg: form_lang.Get(active_user.lang, "NginxDirectivesInvalid", true ) + " " + test.err};

        return {result: true};
    };
};


// validates certificate's file name for an app
exports.SSLCertFileName = function(testConfig) {

    var _testConfig = testConfig;

    this.validate = function (env, active_user, val, params) {

        if (params.controls.ssl && !val)
            return {result: false, msg: form_lang.Get(active_user.lang, "ValueRequired", true )};

        var ret = new exports.FileName().validate(env, active_user, val, params);
        if (!ret.result) return ret;

        // now checking if cert file exists
        var domain_name = _active_user.isRecordUpdating(active_user, params.form);
        if (!domain_name)
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainNotFound", true)};

        var options = hosting_tools.appGetOptions(domain_name);
        if (options.err)
            return {result: false, msg: form_lang.Get(active_user.lang, options.err, true)};

        var file = path.join(options.app_dir, val);

        if (!fs.existsSync(file))
            return {result: false, msg: form_lang.Get(active_user.lang, "FileDoesNotExist", true)};

        if (params.controls.ssl && _testConfig) {
            var ssl_info = hosting_tools.appGetSSLInfo(options.app_dir, true, params.controls.ssl_crt, params.controls.ssl_key);

            var configString = nginxconf.createConfig("jxcorefakedomain.com", [ 9998, 9999 ], null, "", ssl_info, ip_tools.getUserIPs(active_user, "both") );
            var test = nginx.testConfig(configString);
            if (test.err)
                return {result: false, msg: form_lang.Get(active_user.lang, "NginxDirectivesInvalid", true ) + " " + test.err};
        }

        return {result: true};
    };
};


exports.IPAdresses = function(v6) {

    var _v6 = v6;

    this.validate = function (env, active_user, val, params) {

        var ips = ip_tools.getUserIPs(active_user, _v6);
        if (ips.err)
            return { result : false, msg: form_lang.Get(active_user.lang, ips.err, null) };

        var _val = util.isArray(val) ? val : [ val ];

        for (var o in _val) {
            if (ips.indexOf(_val[o]) === -1)
                return { result : false, msg: form_lang.Get(active_user.lang, "ValueInvalid", null) };
        }

        return {result: true};
    };
};

// validates app's file name
exports.AppType = function() {

    this.validate = function (env, active_user, val, params) {

        if (val == "custom") {
            var ret = new exports.FileName().validate(env, active_user, val, params);
            return ret;
        }

        var domain_name = _active_user.isRecordUpdating(active_user, params.form);
        if (!domain_name)
            return {result: false, msg: form_lang.Get(active_user.lang, "DomainNotFound", true)};

        var appData = apps_tools.getData(domain_name, val, true);
        if (appData.err)
            return { result: false, msg : form_lang.Get(active_user.lang, appData.err, true) };

        return {result: true};
    };
};

// validates app's file name
exports.AppArgs = function() {

    this.validate = function (env, active_user, val, params, field_name) {

        var ret = root_functions.parseUserArgs(val);
        if (ret.err)
            return { result: false, msg : form_lang.Get(active_user.lang, 'JXcoreAppArgsCannotParse', true) };

        return {result: true};
    };
};


exports.getValidation = function(type, options) {

    if (!options) options = {};

    if (type === "Integer")
        return new exports.Int(options);

    if (type === "String")
        return new exports.String(options.min, options.max);

    if (type === "Boolean")
        return new exports.Boolean();

    if (type === "Username")
        return new exports.UserName();

    if (type === "Domain")
        return new exports.Domain();

    if (type === "Email")
        return new exports.Email();

    return null;
};

exports.getValidationByObject = function(obj) {

  if (obj && obj.type)
      return exports.getValidation(obj.type, obj.options || obj);

  return null;
};