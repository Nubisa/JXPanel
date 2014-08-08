console.log("Stopping NGINX");
var ng = process.cwd()+"/nginx/sbin/nginx";
console.log(jxcore.utils.cmdSync("sudo "+ng+" -s stop -p "+process.cwd() + "/nginx"));
