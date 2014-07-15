var server = require('jxm');
var form_lang = require('./form_lang');


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

//        console.log("email validation", req);

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

        var pos = allowed.indexOf("" + val.toLowerCase());

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

        if (!val && (val + "" !== "0")) {
            return {result: true};
        }

        var parsed = parseInt(val);

        if (isNaN(parsed)) {
            return {result: false, msg: form_lang.Get(active_user.lang, "ValueInvalidInteger", null)};
        }

        console.log("options", this.options, "parsed", parsed);
        if (this.options) {
            var params = [];
            var err = false;

            if (this.options.lt || this.options.lt === 0) {
                params.push("less than " + this.options.lt);
                if (parsed >= this.options.lt) err = true;
            }

            if (this.options.lte || this.options.lte === 0) {
                params.push("less than " + this.options.lte + " (or equal)");
                if (parsed > this.options.lte) err = true;
            }

            if (this.options.gt || this.options.gt === 0) {
                params.push("greater than " + this.options.gt);
                if (parsed <= this.options.gt) err = true;
            }

            if (this.options.gte || this.options.gte === 0) {
                params.push("greater than " + this.options.gte + " (or equal)");
                if (parsed < this.options.gte) err = true
            }

            if (err)
                return {result: false, msg: form_lang.Get(active_user.lang, "ValueShouldBe", null, [ params.join(" and ") ])};
        }

        return {result: true};
    };
};