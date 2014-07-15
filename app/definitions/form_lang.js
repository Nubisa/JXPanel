var util = require('util');

var langs = {};

langs.EN = require("./langs/EN.js").Labels;

/**
 *
 * @param lang
 * @param val
 * @param notNull - if provided and translation was not found in langs - val is returned instead of null.
 * @return {*}
 * @constructor
 */
exports.Get = function(lang, val, notNull, arrParams){

    var str = null;
    if(langs[lang] && langs[lang][val]){
        str = langs[lang][val];
    }

    if(!str && langs.EN[val])
        str = langs.EN[val];

    if(!str)
        str = notNull ? val : null;

    if(str && arrParams)
    {
        arrParams = [str].concat(arrParams);
        str = util.format.apply(null, arrParams);
    }

    return str;
};
