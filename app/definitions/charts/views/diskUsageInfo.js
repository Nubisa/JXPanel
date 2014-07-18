var st = require('../../../system_tools');
var form_lang = require('../../form_lang');
var _active_user = require('../../active_user');
var chart_methods = require('../chart_methods');

exports.chart = function(){
  function _chart(){
      this.name = "diskUsageInfo";
      this.title = "DiskUsageInformation";
      this.mediumSize = "4";
      this.smallSize = "8";
      this.type = "Pie";
      this.height = 150;

      this.options = {
          //Boolean - Whether we should show a stroke on each segment
          segmentShowStroke : true,

          //String - The colour of each segment stroke
          segmentStrokeColor : "#fff",

          //Number - The width of each segment stroke
          segmentStrokeWidth : 2,

          //Number - The percentage of the chart that we cut out of the middle
          percentageInnerCutout : 0, // This is 0 for Pie charts

          //Number - Amount of animation steps
          animationSteps : 100,

          //String - Animation easing effect
          animationEasing : "easeOutBounce",

          //Boolean - Whether we animate the rotation of the Doughnut
          animateRotate : true,

          //Boolean - Whether we animate scaling the Doughnut from the centre
          animateScale : false,

          //String - A legend template
          legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"

      };

      var createLabel = function(name, color, value){
          return "<span style='color:"+color+";'>"+name+":</span> "+value+" ";
      };

      var addPieData = function(obj, _value, _color, _highlight, _label){
          obj.d.push({value:_value, color:_color, highlight:_highlight, label:_label});
      };

      var _this = this;

      var createPieData = function(index, data, lang){
          var pie = {d:[], l:[]};
          if(!_this.rendered){
              pie.names = data.filesystem;
              _this.rendered = true;
          }

          pie.l.push(createLabel(form_lang.Get(lang, "Capacity"), "#000000", data.size[index]));
          addPieData(pie, parseFloat(data.used[index].match(/[0-9.]+/)[0]), "#F7464A", "#B00000", "Used");
          addPieData(pie, parseFloat(data.avail[index].match(/[0-9.]+/)[0]), "#00b000", "#46BFBD", "Available");

          return pie;
      };

      this.getData = function(env, active_user, params, cb){

          st.getDiskInfo(env, function(_data){
              var data = _data.res;
              var _env = _data.e;

              var index = params.id;

              var lang = "EN";
              if(active_user && active_user.lang)
                  lang = active_user.lang;

              var pie = createPieData(index, data, lang);

              console.log("DiskUsageInfo Response");

              pie.btn_ref = true;

              cb(pie, _this.getOptions(_env, _active_user.getUser(_env.SessionID), params));
          });
      };

      this.getOptions = function(env, active_user, params){
          return this.options;
      };
  }

  return new _chart();
};