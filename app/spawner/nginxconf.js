//Copyright Nubisa Inc. 2014 All Rights Reserved

//ssl_info {key: "", crt: ""}  OR NULL
exports.createConfig = function(domain, node_ports, log_location, directives, ssl_info, ifc_list){ // node_ports is an array (first http, second https)
    var config_str = "map $http_upgrade $connection_upgrade {\n"
        +"  default upgrade;\n"
        +"  '' close;\n"
        +"}\n\n";

    if (directives) {
        directives = directives.trim() + ";";
        directives = '  #plan`s directives\n  '
            + directives.replace(/\n/g, '').replace(/;;/g, ";").replace(/;/g, ';\n    ').trim()
            + "\n";
    } else {
        directives = "";
    }

    var sports = ["80"];
    if(ssl_info)
        sports.push("443");

    config_str +=
        'upstream jxcore_target_' + domain + ' {\n'
       +'  server 127.0.0.1:'+ node_ports[0] +';\n'
      // when this was present, changes in domain's config and reloading nginx did not have immediate effect
      // since old connection was still kept
      // +'  keepalive 9999999;\n'
       +'}\n\n';

    for(var i in sports){
        var sport = sports[i];
        for(var o in ifc_list){
            var ip = ifc_list[o];
            if (!ip) continue;
            var extra = "";
            // ipv6
            if (ip.indexOf(":") !== -1) {
                ip = "[" + ip + "]";
                extra += " ipv6only=on";
            }
            if (sport == 443) extra += " ssl";
            var str_config =
                "server{\n"
                    +"  listen "+ip+":"+sport+ extra + ';\n'
                    +"  server_name "+domain+";\n"
                    +"  server_name www."+domain+";\n"
                    +"  server_name ipv4."+domain+";\n"
                    +(sport=='443'?"  ssl on;\n":'')
                    +(sport=='443'?"  ssl_certificate_key " + ssl_info.key + ";\n" : "")
                    +(sport=='443'?"  ssl_certificate " + ssl_info.crt + ";\n" : "")
                    +"  location / {\n"
                    +"    proxy_pass http://jxcore_target_" + domain + ";\n"
                    +"    proxy_read_timeout 9999999;\n"
                    +"    proxy_http_version 1.1;\n"
                    +"    proxy_set_header Upgrade $http_upgrade;\n"
                    +"    proxy_set_header Connection \"Upgrade\";\n"

                    +"    proxy_set_header Host $host;\n"
                    +"    proxy_set_header X-Real-IP $remote_addr;\n"

                    +"  }\n";

            if (log_location) str_config += ""
                    +"  location /jxcore_logs {\n"
                    +"    autoindex on;\n"
                    +"    alias "+log_location+";\n"
                    +"    add_header Content-type text/plain;\n"
                    +"  }\n";

            str_config += ""
                    +directives
                    +"}\n";

            config_str += str_config + "\n\n";
        }
    }

    return config_str;
};



exports.createDefaultConfig = function(ssl_info, ifc_list, panel_port){ // node_ports is an array (first http, second https)

    var sports = ["80", "443", panel_port]
    var config_str = "";

    for(var i in sports){
        var sport = sports[i];
        if (!sport) continue;
        for(var o in ifc_list){
            var ip = ifc_list[o];
            var extra = "";
            // ipv6
            if (ip.indexOf(":") !== -1) {
                ip = "[" + ip + "]";
                extra += " ipv6only=on";
            }
            if (sport == 443) extra += " ssl";
            var str_config =
                "server{\n"
                +"  listen "+ip+":"+sport+ extra + ' default_server;\n'
                +(sport=='443'?"  ssl on;\n":'')
                +(sport=='443'?"  ssl_certificate_key " + ssl_info.key + ";\n" : "")
                +(sport=='443'?"  ssl_certificate " + ssl_info.crt + ";\n" : "");

            if (sport == panel_port) {
                str_config += "\n"
                +"  location / {\n"
                +"    proxy_pass http://127.0.0.1:8000;\n"
                +"    proxy_set_header Host $host;\n"
                +"    proxy_set_header X-Real-IP $remote_addr;\n"
                +"    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n"
                +"  }\n";
            } else {
                str_config += "\n"
                +"  proxy_set_header Host $host;\n"
                +"  proxy_set_header X-Real-IP $remote_addr;\n"
                +"  return 404;\n";
            }

            str_config += ""
            +"}\n";

            config_str += str_config + "\n\n";
        }
    }

    return config_str;
};
