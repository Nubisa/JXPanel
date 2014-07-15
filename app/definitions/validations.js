var server = require('jxm');
var form_lang = require('./form_lang');

exports.MinString = function(minSize){
    this.min = minSize;

    this.validate  = function(env, active_user, val){
        if(val.trim().length<this.min){
            return {result:false, msg:form_lang.Get(active_user.lang, "RequiresMinimumLength", null, [this.min])};
        }

        return {result:true};
    };
};