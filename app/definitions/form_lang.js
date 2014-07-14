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
exports.Get = function(lang, val, notNull){

    if(langs[lang] && langs[lang][val]){
        return langs[lang][val];
    }

    if(langs.EN[val])
        return langs.EN[val];

    return notNull ? val : null;
};
