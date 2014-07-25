
<link rel="stylesheet" href="/css/jquery.terminal.css" />

var scr2 = document.createElement("script");
scr2.src = "/js/jquery.terminal-min.js";
var scr3 = document.createElement("script");
scr3.src = "/js/jquery.mousewheel-min.js";

elm_editor.parentNode.appendChild(scr2);
elm_editor.parentNode.appendChild(scr3);

window.terminalCount = 0;
document.getElementById("btn_clone").onmousedown = function(){
    createTerminal("term_" + (terminalCount++));
};

var createTerminal = function(name){
    var fname = name;
    if(!fname)
        fname = "{{label.Empty}}";

    var eid = "jx_e_" + name;
    var host_editor = createTab(eid, fname);
    if(!name)
        return;

    host_editor.innerHTML = "";
    var terminal = document.createElement("div");
    terminal.id = eid + "x_terminal";
    terminal.className = "note";
    terminal.style.cssText = "background:black;color:white;min-height:98%";
    host_editor.appendChild(terminal);
    jQuery(function($, undefined) {
        $(terminal).terminal(function(command, term) {
            if (command !== '') {
                try {
                    var result = window.eval(command);
                    if (result !== undefined) {
                        term.echo(new String(result));
                    }
                } catch(e) {
                    term.error(new String(e));
                }
            } else {
                term.echo('');
            }
        }, {
            greetings: 'Javascript Interpreter',
            name: 'js_term' + eid,
            height: host_editor.clientHeight-20,
            prompt: 'js> '});
    });
    window.editors["#" + name] = terminal;

};