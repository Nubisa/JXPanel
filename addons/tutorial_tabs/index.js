var jxpanel = global.getJXPanelAPI(module);

exports.request = function (env, args, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    // tabs are define in an array like this:
    var tabs = [
        {id: "tab1", label: "Databases", icon: '<img id="dashboard_img" class="menu-icon" src="icons/dashboard.png">'},
        {id: "tab2", label: "Empty Tab"}
    ];

    // we can add an extra tab, just for the admin
    if (addonFactory.activeUser.isAdmin)
        tabs.push({id: "config", label: "Configuration"});

    // applying tabs definitions
    addonFactory.tabs.create("my_tabs", tabs);

    // depending on which tab is currently selected, we display different tab's content
    var html = "";
    if (!args.tab || args.tab == "tab1") {
        // if there is no args.tab, it means that no tab has been chosen so far (default)
        html = "Contents for tab1. This is the default tab.";
    }
    else if (args.tab == "tab2") {
        // each tab has its own url, it is enough to set `tab` variable to a tab name
        var tab3Url = addonFactory.url.addon + "&tab=config";
        html = 'Contents for tab2.<br>Click <a href="' + tab3Url + '">here</a> to switch to `Configuration` tab.';
    } else if (args.tab == "config") {
        html = "Configuration Page";
    }

    cb(null, addonFactory.render(html));
};

