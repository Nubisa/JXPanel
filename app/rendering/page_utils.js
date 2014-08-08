
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