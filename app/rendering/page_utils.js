
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

    var percent = parseInt(value * 100 / maxValue);
    if (!unit) unit = "";

//    var str = '<div class="progress" style="margin: 0px;">'
//             +'    <div class="progress-bar bg-color-primary" role="progressbar" style="width: ' + percent + '%"></div>'
//             +'</div>';

    var str = '<div class="progress" style="margin: 0px;">'
        +'    <div aria-valuenow="_val_" style="width: _val_%;" class="progress-bar bg-color-blue" aria-valuetransitiongoal="_val_">' + value + " " + unit + '</div>'
        +'</div>';

    return str.replace(/_val_/g, percent);
};