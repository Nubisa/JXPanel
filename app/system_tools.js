var outputConvert = function(str, expects, fixer){

    var lines = str.split('\n');
    if(lines.length){
        var obj = {};
        var dict = {length:0};
        var n = 0;
        var apply_result = null;
        for(var i=0, ln=lines.length;i<ln;i++){
            var cols;
            if(!apply_result){
                lines[i] = lines[i].replace(/\\t/g, " ");

                if(n==0)
                    cols = lines[i].match(/[a-zA-Z0-9#%//.:+_-]+/g);
                else
                    cols = lines[i].match(/[a-zA-Z0-9#%//.:+_-]+[ ]?[a-zA-Z]*/g);

                if(!cols)
                    continue;

                if(cols.length<expects){
                    continue;
                }
            }
            else
            {
                cols = apply_result;
                apply_result = null;
            }

            var back = [];
            for(var o in cols){
                cols[o] = cols[o].trim();
                if(n==0){
                    obj[cols[o]] = [];
                    dict[o] = cols[o];
                    dict.length ++;
                }
                else{
                    if(!obj[dict[o]]){
                        back = [];
                        break;
                    }
                    back.push(cols[o]);
                }
            }
            if(back.length){
                for(var o in back){
                    obj[dict[o]].push(back[o]);
                }
            }
            else if(n>0 && fixer){
                var result = fixer(dict, cols);
                if(result){
                    i--;
                    apply_result = result;
                }
            }
            n++;
        }
        dict = null;
        return obj;
    }
    return {};
};


var getTop = function(){
    var num_cols = 12;
    var result = jxcore.utils.cmdSync("top -l 1 -ncols "+num_cols);

    if(result.exitCode != 0 || !result.out){
        return null;
    }

    var ln = result.out.indexOf("\n\n") + 2;
    result.out = result.out.substr(ln, result.out.length-ln);

    var combiner = function(cols, expects){
        if(/[a-zA-Z]+/.test(cols[2])){
            var arr = [cols[0], cols[1] + " " + cols[2]];

            for(var o = 3, ln = cols.length; o<ln ;o++){
                arr.push(cols[o]);
            }
            if(arr.length>expects){
                return combiner(arr, expects);
            }
            return arr;
        }
        return cols;
    };

    var fixer = function(dict, cols){
        if(cols.length>num_cols){
            return combiner(cols, num_cols);
        }
    };

    return outputConvert(result.out, num_cols, fixer);
};


var getdiskUsage = function(folder){
    var result = jxcore.utils.cmdSync("du -sh " + folder);

    if(result.exitCode != 0 || !result.out){
        return null;
    }

    result = result.out.split('\t');
    result = result[0].toLowerCase().trim();

    var size = result.substr(result.length-1, 1) + "";
    var total = parseFloat(result.substr(0, result.length-1));

    if(size == "g"){
        return total;
    }
    else if(size == "m"){
        return total / 1024;
    }
    else if(size == "k"){
        return total / (1024 * 1024);
    }
    return total;
};


var getDiskInfo = function(){
    var num_cols = 0;
    var result = jxcore.utils.cmdSync("df -h");

    if(result.exitCode != 0 || !result.out){
        return null;
    }

    result.out = result.out.toLowerCase().replace("mounted on", "mounted_on");

    var ln = result.out.indexOf("\n\n");
    if(ln > 0){
        ln += 2;
        result.out = result.out.substr(ln, result.out.length-ln);
    }

    var combiner = function(cols, expects){
        if(/[a-zA-Z]+/.test(cols[1])){
            var arr = [cols[0] + " " + cols[1]];

            for(var o = 2, ln = cols.length; o<ln ;o++){
                arr.push(cols[o]);
            }
            if(arr.length>expects){
                return combiner(arr, expects);
            }
            return arr;
        }
        return cols;
    };

    var fixer = function(dict, cols){
        if(cols.length>dict.length){
            return combiner(cols, dict.length);
        }
    };

    return outputConvert(result.out, num_cols, fixer);
};


//returns folder's disk usage in Gb
exports.getDiskUsageSync = getdiskUsage;
exports.getDiskUsage = function(folder, cb){
    var task = function(folder){
        var ts = require('./system_tools');
        return ts.getDiskUsageSync(folder);
    };

    jxcore.tasks.addTask(task, folder, cb);
};

// returns objected version of top results { PID: [ array of PIDs] , ...... }
exports.getTopSync = getTop;
exports.getTop = function(cb){
    var task = function(){
        var ts = require('./system_tools');
        return ts.getTopSync();
    };

    jxcore.tasks.addTask(task, null, cb);
};

// returns objected version of "df -h" results { Filesystem: [ array of ..] , ...... }
exports.getDiskInfoSync = getDiskInfo;
exports.getDiskInfo = function(cb){
    var task = function(){
        var ts = require('./system_tools');
        return ts.getDiskInfoSync();
    };

    jxcore.tasks.addTask(task, null, cb);
};
