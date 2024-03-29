var fs = require('fs');
var _active_user = require('../active_user');
var form_lang = require('../form_lang');
var rep = require('../../rendering/smart_search').replace;
var path = require('path');
var server = require('jxm');

exports.getChart = function(sessionId, chart, index){
  var chart = require('./views/' + chart).chart();

  return renderChart(sessionId, chart, index);
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
                return gl.ch.name;

            return form_lang.Get(gl.lang, gl.ch[val], true);
        }
    }
];

var total_charts = 0;

var renderChart = function(sessionId, chart, index){
    var active_user = _active_user.getUser(sessionId);
    var lang = active_user.lang;

    var base_str = "";
    if(index === 0){
        base_str = "<script>window.renderCharts = [];</script>";
        total_charts = 0;
    }

    total_charts %= 99;

    if(!active_user.charts){
        active_user.charts = {};
    }
    active_user.charts[chart.name] = chart;


    var str = fs.readFileSync(path.join(__dirname, "../charts/ajaxChart.html")) + "";
    chart.number = total_charts++;
    logic.globals = { ch:chart, active_user:active_user, lang:lang };

    return base_str + rep(str, logic);
};

exports.defineChartMethods = function(){
    server.addJSMethod("getChartData", function (env, params) {
        var active_user = _active_user.getUser(env.SessionID);

        if(!active_user || !params || !params.chartName || !active_user.charts || !active_user.charts[params.chartName]){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        var chart = active_user.charts[params.chartName];
        chart.getData(env, active_user, params, function(_data, options){
            server.sendCallBack(env, {data:_data, options:options});
        });
    });

};