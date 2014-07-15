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