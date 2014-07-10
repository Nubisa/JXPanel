/*


 var rep = require('./smart_search').replace;

 var rules = [
 {
 from:"var $$ = ## - @@;",
 to:"var $$ = (-1 * (## - @@)) + ~~;",
 "@":function(val){
 return  val.match(/([0-9]+)/)[0];
 },
 "#":function(val){
 return  val.match(/([0-9]+)/)[0];
 },
 "~!":function(first, second, third){
 return parseFloat(second.match(/([0-9]+)/)[0]) - parseFloat(third);
 }
 }
 ];

 var str = "var q   = {((45) -3)};";

 console.log(rep(str, rules));

 */

var _replace = function(str, markers, _markers, from, togr, logic){
    var search = from + "";
    var res = from.match(new RegExp("([^a-zA-Z0-9_>\\-':\"}{ "+markers.join()+"]+)", "g"));
    for(var o in res){
        var s = res[o];
        for(var i in s){
            search = search.replace(new RegExp( "\\" + s[i], "g"), "\\" + s[i]);
        }
    }

    search = search.replace(/[ ]+/g, "([ ]*)");

    var inx = [], limits = [];
    var picker =
        "[{]*[ ]*[((]*[ ]*[\\[]*[ ]*[{]*[ ]*[((]*[ ]*[\\[]*[ ]*[{]*[ ]*[((]*[ ]*[\\[]*[ ]*[{]*[ ]*[((]*[ ]*[\\[]*[ ]*"
         + "([a-zA-Z0-9_'\"]+)"
         + "[ ]*[}]*[ ]*[))]*[ ]*[\\]]*[ ]*[}]*[ ]*[))]*[ ]*[\\]]*[ ]*[}]*[ ]*[))]*[ ]*[\\]]*[ ]*[}]*[ ]*[))]*[ ]*[\\]]*";

    for(var o in markers){
        search = search.replace(new RegExp("\\" + markers[o] + "\\" + markers[o], "g"), picker);
        var mind = from.indexOf(markers[o] + markers[o]);
        inx.push(mind);
        var n = inx.length;
        if(inx[n-1] == -1)
            limits.push(-1);
        else{
            if(inx[n-1]+2 >= from.length){
                limits.push(-5); // to the end!
            }
            else
            {
                var ll = from[inx[n-1] + 2];
                if(inx[n-1]+3 < from.length){
                    if(!_markers[from[inx[n-1]+3]]){
                        ll += from[inx[n-1]+3];
                    }
                }
                if(_markers[ll]){
                    throw new Error(ll + " at position " +  inx[n-1] + 2 + " can not be right after another marker");
                }
                limits.push(ll);
            }
        }
    }

    //console.log(search)

    var t_arr = [inx, limits, markers];
    var lnx = inx.length;
    for(var o=0;o<lnx;o++){ // O(x3) but lnx.length shouldn't be that big
        for(var z=1;z<lnx;z++){
            if(inx[z]<inx[z-1]){
                for(var x in t_arr){
                    var q = t_arr[x][z];
                    t_arr[x][z] = t_arr[x][z-1];
                    t_arr[x][z-1] = q;
                }
            }
        }
    }

    var found = str.match(new RegExp(search, "g"));

    //console.log(found);
    for(var o in found){
        var f = found[o];
        var ch = "  ";
        var newstr = togr;

        var ops = [];
        var ln = inx.length;
        for(var i=0;i<ln;i++){
            if(inx[i]>=0){
                var pos = inx[i];
                do{
                    if(limits[i] == -5){
                        ch = f.substr(n, f.length-(pos));
                    }
                    else
                        ch = f.substr(pos, f.indexOf(limits[i], pos) - pos);

                    pos += (ch.length);
                    f = f.substr(pos);

                    ch = ch.trim();
                    ops.push(ch);
                    //console.log("REMAINS", f, "POS", pos, "CH", "("+ch+")")

                    if(logic[markers[i]]){
                        ch = logic[markers[i]](ch);
                    }
                    newstr = newstr.replace(new RegExp("\\" + markers[i] + "\\" + markers[i], "g"), ch);

                    if(ln<=i+1)
                        break;

                    var new_match = (f.match(picker));
                    if(!new_match)
                        break;

                    pos = new_match.index;
                    //console.log("NEW POS", pos)
                    i++;
                }
                while(true);
                break;
            }
        }

        if(ops.length){
            for(var i in markers){
                if(logic[markers[i] + "!"]){
                    var ch = logic[markers[i] + "!"].apply(null, ops);
                    if(logic[markers[i]]){
                        ch = logic[markers[i]](ch);
                    }
                    newstr = newstr.replace(new RegExp("\\" + markers[i] + "\\" + markers[i], "g"), ch);
                }
            }
        }

        //console.log(f, newstr)
        str = str.replace(found[o], newstr);
    }

    return str;
};

var smart_replace = function(str, logic, markers){
    if(!markers){
        markers = ["#", "$", "@", "~"];
    }

    var _markers = {};
    for(var o in markers){
        _markers[markers[o]] = 1;
    }

    var res = str;
    for(var i in logic){
        res = _replace(res, markers, _markers, logic[i].from, logic[i].to, logic[i]);
    }

    return res;
};

exports.replace = smart_replace;