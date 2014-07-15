/**
 * Created by Nubisa Inc. on 7/15/14.
 */


exports.getData = function() {
    var columns = [ "ID", "Name", "LastName" ];

    var thead = [];
    var tbody = [];
    for (var a in columns) {
        thead.push("<td>" + columns[a] + "</td>")
    }

    for (var y = 1; y < 100; y++) {
        tbody.push("<tr>");
        for (var x in columns) {
            tbody.push("<td>" + (x) + "." + y + "</td>");
        }
        tbody.push("</tr>");
    }

    return "<thead><tr>" + thead.join("\n") + "</tr></thead>\n<tbody>" + tbody.join("\n") + "</tbody>";
};



