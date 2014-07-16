var fs = require('fs');
var _active_user = require('../active_user');
var form_lang = require('../form_lang');
var rep = require('../../rendering/smart_search').replace;
var path = require('path');

exports.getChart = function(sessionId, chart){
  var chart = require('./views/' + chart).chart();

  return renderChart(sessionId, chart);
};

var logic = [
    {
        from:"{{label.$$}}", to:"$$",
        "$":function(val, gl)
        {
            var active_user = gl.active_user;
            var res = form_lang.Get(active_user.lang, val);
            return !res?"":res;
        }
    },
    {
        from:"{{chart.$$}}", to:"$$",
        "$":function(val, gl)
        {
            if(val == "id")
                return gl.name;

            return form_lang.Get(gl.lang, gl[val], true);
        }
    }
];

var last_sessionId = 0;
var total_charts = 0;

var renderChart = function(sessionId, chart){
    var str = fs.readFileSync(path.join(__dirname, "../charts/ajaxChart.html")) + "";
    var active_user = _active_user.getUser(sessionId);
    var lang = active_user.lang;

    if(last_sessionId != sessionId){
        last_sessionId = sessionId;
        total_charts = 0;
    }

    total_charts %= 99;

    chart.number = total_charts++;

    logic.globals = { name: chart.name, title: chart.title, active_user:active_user, lang:lang, number:chart.number };

    if(!active_user.charts){
        active_user.charts = {};
    }
    active_user.charts[chart.name] = chart;

    return rep(str, logic);
};