var langs = {};

langs.EN = require("./langs/EN.js").Labels;

exports.Get = function(lang, val){

    if(langs[lang] && langs[lang][val]){
        return langs[lang][val];
    }

    if(langs.EN[val])
        return langs.EN[val];


    return null;
};