var st = require('../../../system_tools');

exports.chart = function(){
  function _chart(){
      this.name = "diskUsageInfo";
      this.title = "DiskUsageInformation";
      this.mediumSize = "4";
      this.smallSize = "8";
      this.type = "Pie";

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
          obj.l.push(createLabel(_label, _color, _value));
      };

      this.getData = function(env, active_user, params, cb){
          var _this = this;
          st.getDiskInfo(function(data){
              var pie = {d:[], l:[]};
              pie.l.push(createLabel("Mnt.", "#000000", data.filesystem[0]));
              pie.l.push(createLabel("Cap.", "#000000", data.size[0]));
              addPieData(pie, parseFloat(data.used[0].match(/[0-9.]+/)[0]), "#F7464A", "#B00000", "Used");
              addPieData(pie, parseFloat(data.avail[0].match(/[0-9.]+/)[0]), "#00b000", "#46BFBD", "Available");

              console.log("DiskUsageInfo Response");

              cb(pie, _this.getOptions(env, active_user, params));
          });
      };

      this.getOptions = function(env, active_user, paramms){
          return this.options;
      };
  }

  return new _chart();
};