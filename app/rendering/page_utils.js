
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

    var str = '<a data-original-title="' + label + '" class="jxbtn" onclick="' + onclick + '">'
          +'<i class="fa ' + iconClass + '"></i><span class="dummy-label">' + label + '</span>'
          +'</a>';

    if (additionalStyle !== false)
        str = exports.getButtonsGroup(str, additionalStyle);

    return str;
};


exports.getButtonsGroup = function(html, additionalStyle) {

    additionalStyle = additionalStyle || "";
    return '<span id="buttons" class="jxbuttons" style="' + additionalStyle + '">'
             +'<i class="fa fa-fw fa-align-justify" style="color: #757a7b;"></i>&nbsp;&nbsp;'
             + html
             +'</span>';
};



/**
 * Returns html containing tabs and tab panes
 * @param id - tabs control id
 * @param tabs - array, e.g. :
     tabs = [
     {   id: "databases1",
         label: "Databases1",
         icon : '<img id="dashboard_img" class="menu-icon" src="icons/dashboard.png">',
         url1 : "/addon.html?mongodb&tab=databases1"},
     {
         id: "contents1",
         label: "Contents",
         contents : 'this is some html contents'}
     ];
 * @param currentTab - e.g. "databases1"
 * @returns {string} - html containing tabs
 */
exports.getTabs = function (id, tabs, currentTab) {

    var str = '<ul id="' + id + '" class="nav nav-tabs bordered">';
    var tab_contents = "";

    for (var a in tabs) {
        var tab = tabs[a];
        if (!currentTab) currentTab = tab.id; // first tab will be active, if no other tab is specified
        if (currentTab === tab.id)
            str += '<li class="active" id="' + tab.id + '">';
        else
            str += '<li id="' + tab.id + '">';

        var icon = tab.icon || '<i class="fa fa-fw fa-align-justify">';
        var href = "";
        if (tab.contents) {
            href = 'href="#tab-pane-' + tab.id + '" data-toggle="tab"';
        } else {
            if (!tab.url)
                tab.url = "#";
            href = 'href="' + tab.url + '"';
        }
        str += '<a ' + href + '>' + icon + '</i> ' + tab.label + '</a></li>';

        if (tab.contents) {
            var _class = currentTab === tab.id ? "tab-pane fade in active" : "tab-pane fade";
            tab_contents += '<div class="' + _class + '" id="tab-pane-' + tab.id + '">' + tab.contents + '</div>';
        }
    }

    if (tab_contents)
        tab_contents = '<div class="tab-content padding-10">' + tab_contents + '</div>';

    str += '</ul>';

    return str + tab_contents;
};