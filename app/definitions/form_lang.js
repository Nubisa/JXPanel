var util = require('util');
var fs = require("fs");
var path = require("path");

var langs = {};

//langs.EN = require("./langs/EN.js").Labels;
//langs.PL = require("./langs/PL.js").Labels;


var countries = {
    "BD": "Bangladesh",
    "BE": "Belgium",
    "BF": "Burkina Faso",
    "BG": "Bulgaria",
    "BA": "Bosnia and Herzegovina",
    "BB": "Barbados",
    "WF": "Wallis and Futuna",
    "BL": "Saint Bartelemey",
    "BM": "Bermuda",
    "BN": "Brunei Darussalam",
    "BO": "Bolivia",
    "BH": "Bahrain",
    "BI": "Burundi",
    "BJ": "Benin",
    "BT": "Bhutan",
    "JM": "Jamaica",
    "BV": "Bouvet Island",
    "BW": "Botswana",
    "WS": "Samoa",
    "BR": "Brazil",
    "BS": "Bahamas",
    "JE": "Jersey",
    "BY": "Belarus",
    "O1": "Other Country",
    "LV": "Latvia",
    "RW": "Rwanda",
    "RS": "Serbia",
    "TL": "Timor-Leste",
    "RE": "Reunion",
    "LU": "Luxembourg",
    "TJ": "Tajikistan",
    "RO": "Romania",
    "PG": "Papua New Guinea",
    "GW": "Guinea-Bissau",
    "GU": "Guam",
    "GT": "Guatemala",
    "GS": "South Georgia and the South Sandwich Islands",
    "GR": "Greece",
    "GQ": "Equatorial Guinea",
    "GP": "Guadeloupe",
    "JP": "Japan",
    "GY": "Guyana",
    "GG": "Guernsey",
    "GF": "French Guiana",
    "GE": "Georgia",
    "GD": "Grenada",
    "GB": "United Kingdom",
    "GA": "Gabon",
    "SV": "El Salvador",
    "GN": "Guinea",
    "GM": "Gambia",
    "GL": "Greenland",
    "GI": "Gibraltar",
    "GH": "Ghana",
    "OM": "Oman",
    "TN": "Tunisia",
    "JO": "Jordan",
    "HR": "Croatia",
    "HT": "Haiti",
    "HU": "Hungary",
    "HK": "Hong Kong",
    "HN": "Honduras",
    "HM": "Heard Island and McDonald Islands",
    "VE": "Venezuela",
    "PR": "Puerto Rico",
    "PS": "Palestinian Territory",
    "PW": "Palau",
    "PT": "Portugal",
    "SJ": "Svalbard and Jan Mayen",
    "PY": "Paraguay",
    "IQ": "Iraq",
    "PA": "Panama",
    "PF": "French Polynesia",
    "BZ": "Belize",
    "PE": "Peru",
    "PK": "Pakistan",
    "PH": "Philippines",
    "PN": "Pitcairn",
    "TM": "Turkmenistan",
    "PL": "Poland",
    "PM": "Saint Pierre and Miquelon",
    "ZM": "Zambia",
    "EH": "Western Sahara",
    "RU": "Russian Federation",
    "EE": "Estonia",
    "EG": "Egypt",
    "TK": "Tokelau",
    "ZA": "South Africa",
    "EC": "Ecuador",
    "IT": "Italy",
    "VN": "Vietnam",
    "SB": "Solomon Islands",
    "EU": "Europe",
    "ET": "Ethiopia",
    "SO": "Somalia",
    "ZW": "Zimbabwe",
    "SA": "Saudi Arabia",
    "ES": "Spain",
    "ER": "Eritrea",
    "ME": "Montenegro",
    "MD": "Moldova, Republic of",
    "MG": "Madagascar",
    "MF": "Saint Martin",
    "MA": "Morocco",
    "MC": "Monaco",
    "UZ": "Uzbekistan",
    "MM": "Myanmar",
    "ML": "Mali",
    "MO": "Macao",
    "MN": "Mongolia",
    "MH": "Marshall Islands",
    "MK": "Macedonia",
    "MU": "Mauritius",
    "MT": "Malta",
    "MW": "Malawi",
    "MV": "Maldives",
    "MQ": "Martinique",
    "MP": "Northern Mariana Islands",
    "MS": "Montserrat",
    "MR": "Mauritania",
    "IM": "Isle of Man",
    "UG": "Uganda",
    "TZ": "Tanzania, United Republic of",
    "MY": "Malaysia",
    "MX": "Mexico",
    "IL": "Israel",
    "FR": "France",
    "IO": "British Indian Ocean Territory",
    "FX": "France, Metropolitan",
    "SH": "Saint Helena",
    "FI": "Finland",
    "FJ": "Fiji",
    "FK": "Falkland Islands (Malvinas)",
    "FM": "Micronesia, Federated States of",
    "FO": "Faroe Islands",
    "NI": "Nicaragua",
    "NL": "Netherlands",
    "NO": "Norway",
    "NA": "Namibia",
    "VU": "Vanuatu",
    "NC": "New Caledonia",
    "NE": "Niger",
    "NF": "Norfolk Island",
    "NG": "Nigeria",
    "NZ": "New Zealand",
    "NP": "Nepal",
    "NR": "Nauru",
    "NU": "Niue",
    "CK": "Cook Islands",
    "CI": "Cote d'Ivoire",
    "CH": "Switzerland",
    "CO": "Colombia",
    "CN": "China",
    "CM": "Cameroon",
    "CL": "Chile",
    "CC": "Cocos (Keeling) Islands",
    "CA": "Canada",
    "CG": "Congo",
    "CF": "Central African Republic",
    "CD": "Congo, The Democratic Republic of the",
    "CZ": "Czech Republic",
    "CY": "Cyprus",
    "CX": "Christmas Island",
    "CR": "Costa Rica",
    "CV": "Cape Verde",
    "CU": "Cuba",
    "SZ": "Swaziland",
    "SY": "Syrian Arab Republic",
    "KG": "Kyrgyzstan",
    "KE": "Kenya",
    "SR": "Suriname",
    "KI": "Kiribati",
    "KH": "Cambodia",
    "KN": "Saint Kitts and Nevis",
    "KM": "Comoros",
    "ST": "Sao Tome and Principe",
    "SK": "Slovakia",
    "KR": "Korea, Republic of",
    "SI": "Slovenia",
    "KP": "Korea, Democratic People's Republic of",
    "KW": "Kuwait",
    "SN": "Senegal",
    "SM": "San Marino",
    "SL": "Sierra Leone",
    "SC": "Seychelles",
    "KZ": "Kazakhstan",
    "KY": "Cayman Islands",
    "SG": "Singapore",
    "SE": "Sweden",
    "SD": "Sudan",
    "DO": "Dominican Republic",
    "DM": "Dominica",
    "DJ": "Djibouti",
    "DK": "Denmark",
    "VG": "Virgin Islands, British",
    "DE": "Germany",
    "YE": "Yemen",
    "DZ": "Algeria",
    "US": "United States",
    "UY": "Uruguay",
    "YT": "Mayotte",
    "UM": "United States Minor Outlying Islands",
    "LB": "Lebanon",
    "LC": "Saint Lucia",
    "LA": "Lao People's Democratic Republic",
    "TV": "Tuvalu",
    "TW": "Taiwan",
    "TT": "Trinidad and Tobago",
    "TR": "Turkey",
    "LK": "Sri Lanka",
    "LI": "Liechtenstein",
    "A1": "Anonymous Proxy",
    "TO": "Tonga",
    "LT": "Lithuania",
    "A2": "Satellite Provider",
    "LR": "Liberia",
    "LS": "Lesotho",
    "TH": "Thailand",
    "TF": "French Southern Territories",
    "TG": "Togo",
    "TD": "Chad",
    "TC": "Turks and Caicos Islands",
    "LY": "Libyan Arab Jamahiriya",
    "VA": "Holy See (Vatican City State)",
    "VC": "Saint Vincent and the Grenadines",
    "AE": "United Arab Emirates",
    "AD": "Andorra",
    "AG": "Antigua and Barbuda",
    "AF": "Afghanistan",
    "AI": "Anguilla",
    "VI": "Virgin Islands, U.S.",
    "IS": "Iceland",
    "IR": "Iran, Islamic Republic of",
    "AM": "Armenia",
    "AL": "Albania",
    "AO": "Angola",
    "AN": "Netherlands Antilles",
    "AQ": "Antarctica",
    "AP": "Asia/Pacific Region",
    "AS": "American Samoa",
    "AR": "Argentina",
    "AU": "Australia",
    "AT": "Austria",
    "AW": "Aruba",
    "IN": "India",
    "AX": "Aland Islands",
    "AZ": "Azerbaijan",
    "IE": "Ireland",
    "ID": "Indonesia",
    "UA": "Ukraine",
    "QA": "Qatar",
    "MZ": "Mozambique"
};

// patch for EN
countries.EN = countries.GB;

var dir = path.join(__dirname, "langs") + path.sep;
var files = fs.readdirSync(dir);

for(var i in files) {
    var file = files[i];

    try {
        var m = require(dir + file);
    } catch (ex) {
        continue;
    }

    if (m.Labels) {
        var bname = path.basename(file, path.extname(file));
        langs[bname] = m.Labels;
        m = null;
    }
}

/**
 *
 * @param lang
 * @param val
 * @param notNull - if provided and translation was not found in langs - val is returned instead of null.
 * @return {*}
 * @constructor
 */
exports.Get = function(lang, val, notNull, arrParams){

    if (val.toString().indexOf("|") !== -1) {
        var arr = val.split("|");
        val = arr[0];
        arrParams = [];
        for (var i = 1, len = arr.length; i < len; i++)
            arrParams.push(arr[i]);
    }

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


exports.GetBool = function(lang, val, labelTrue, labelFalse) {
    return val
        ? '<i class="fa-lg fa fa-check text-success"></i> ' + exports.Get(lang, labelTrue, true)
        : '<i class="fa-lg fa fa-times text-danger"></i> ' + exports.Get(lang, labelFalse, true);
};


exports.getSupportedLangs = function (active_user) {
    var ret = {};
    var html = [];

    var lang = active_user.lang;
    var alias = lang;
    if (lang === "EN") alias = "GB";
    html.push('<a href="#" class="dropdown-toggle" data-toggle="dropdown">');
    html.push('<img src="img/blank.gif" class="flag flag-' + alias.toLocaleLowerCase() + '" alt="' + countries[lang] + '"><span style="margin-left: 5px; margin-right: 5px;">' + lang + '</span><i class="fa fa-angle-down"></i></a>');


    html.push('<ul class="dropdown-menu pull-right">');
    for (var i in langs) {
        var alias = i;
        if (i === "EN") alias = "GB";

        ret[i] = countries[i] || exports.Get("EN", "LanguageUnsupported", true);

        if (active_user.lang === i)
            html.push('<li class="active">');
        else
            html.push('<li>');

        html.push('<a href="#" onclick="return utils.jxSwitchLang(\'' + i + '\')">');
        html.push('<img src="img/blank.gif" class="flag flag-' + alias.toLowerCase() + '" alt="' + ret[i] + '"> ' + ret[i] + ' </a>');
        html.push('</li>');
    }
    html.push('</ul>');


    return { langs: ret, html: html.join("\n") }
};

//exports.get