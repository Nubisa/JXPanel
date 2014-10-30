/**
 * Created by root on 10/29/14.
 */

// launcher for nodebb - makes sure, that app init will happen when running as user
// instead of root

var whoami = jxcore.utils.cmdSync("whoami").out.toString().trim();
var isRoot = whoami.toString().trim() === "root";

if (isRoot)
    setTimeout(process.exit,10000);
else
    require("./app");
