
exports.dateNow = function(gl){
    return Date.now();
};


exports.getErrorBar = function(errString) {

    var str = '<div class="alert alert-danger fade in">'
             +'<button class="close" data-dismiss="alert">×</button>'
             +'<i class="fa-fw fa fa-times"></i>'
             + errString
             +'</div>';

    return str;
};



exports.getProgressBar = function(maxValue, value, unit) {

    var percent = maxValue === 0 ? value * 100 : parseInt(value * 100 / maxValue);
    if (!unit) unit = "";

    var color = "bg-color-greenLight";
    if (percent > 75 && percent < 90) color = "bg-color-yellow";
    if (percent >= 90 && percent < 100) color = "bg-color-redLight";
    if (percent >= 100) {
        color = "bg-color-red";
        percent = 100;
    }


//    var str = '<div class="progress" style="margin: 0px;">'
//             +'    <div class="progress-bar bg-color-primary" role="progressbar" style="width: ' + percent + '%"></div>'
//             +'</div>';

    var str = ''//'<div style="display: inline-block;">'
        + '<div class="progress" style="margin: 0px; margin-right: 20px; width: 200px; display: inline-block; white-space: nowrap; vertical-align: middle;">'
        +'    <div aria-valuenow="_val_" style="width: _val_%;" class="progress-bar ' + color + '" aria-valuetransitiongoal="_val_"></div>'
        +'</div>'
        + '<div style="display: inline-block;">'
        + value + " " + unit + " / " + maxValue + " " + unit
        +'</div>';

    return str.replace(/_val_/g, percent);
};

exports.getSingleButton = function(label, iconClass, onclick, additionalStyle) {

    var str = '';

    if (additionalStyle !== false)
        str += '<span id="buttons" class="jxbuttons" style="' + additionalStyle + '">'
              +'<i class="fa fa-fw fa-align-justify" style="color: #757a7b;"></i>&nbsp;&nbsp;';

    str += '<a id="btn_refresh" data-original-title="' + label + '" class="jxbtn" onclick="' + onclick + '">'
          +'<i class="fa ' + iconClass + '"></i><span class="dummy-label">' + label + '</span>'
          +'</a>';

    if (additionalStyle !== false)
        str += '</span>';

    return str;
};