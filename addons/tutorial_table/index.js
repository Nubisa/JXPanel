var jxpanel = global.getJXPanelAPI(module);

exports.request = function (env, args, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);
    var table = [];

    // the first row of a table are always a column names
    // let's have 4 columns in our table
    table.push(["", "ID", "Name", "Status"]);

    // now populating the table
    table.push(["", "1", "John Doe", "Admin"]);
    table.push(["", "2", "Alan Smithee", "User"]);
    table.push(["", "3", "Hong Gildong", "User"]);
    table.push(["", "4", "Tommy Atkins", "User"]);

    // we can add a checkbox to the first column of each row
    for (var a = 1; a <= 4; a++) {
        // an ID of a checkbox should start with "jxrow_" prefix
        var chk = '<input type="checkbox" id="jxrow_' + a + '"></input>';
        table[a][0] = chk;
    }

    // how can we use checkboxes? Let's add a header server-button
    // When it is clicked, it sends selected checkbox ids to the server
    // calls javascript method1 at server side with arg "Clicked from header"
    addonFactory.header.addServerButton("John Doe selected", "method1", "some param", true);

    // rendering the table
    var html = addonFactory.table.render(table);

    cb(null, addonFactory.render(html));
};

jxpanel.server.addJSMethod("method1", function (env, params, cb) {

    // example params value:
    // { op: 'method1', arg: 'some param', selection: [ '3', '4' ] }
    var JohnDoeSelected = params.selection.indexOf("1") !== -1;

    cb(JohnDoeSelected ? null : "You must select at least John Doe.");
});

