console.log("Starting NGINX");
var ng = process.cwd()+"/nginx/sbin/nginx";
console.log(jxcore.utils.cmdSync("sudo chmod 755 "+ng));
console.log(jxcore.utils.cmdSync("sudo service nginx stop"));
console.log(jxcore.utils.cmdSync("sudo "+ng+" -p "+process.cwd() + "/nginx"));
