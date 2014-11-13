#!/bin/sh

cd app/spawner
./compile.sh
cd ../../
zip -r -9 JXPanel.zip app ui tools start.sh -x tools/apps/*.zip tools/nginx/*.jx /app/node_modules/jxm/* /app/*monitor*.log /app/app.dev_config /app/spawner/*.sh  /app/spawner/*.jxp
scp ./JXPanel.zip root@nodejx.com:/var/www/vhosts/nubisacloud.com/nodejx/jxpanel/
scp ./xi.sh root@nodejx.com:/var/www/vhosts/nubisacloud.com/nodejx/jxpanel/


#scp ./JXPanel.zip root@192.168.62.154:/home/nubisa/
#scp ./xi.sh root@192.168.62.154:/home/nubisa/

#scp ./JXPanel.zip root@192.168.62.199:/home/nubisa/
#scp ./xi.sh root@192.168.62.198:/home/nubisa/

#scp ./x1.sh root@192.168.62.199:/home/nubisa/
#scp ./JXPanel.zip nubisa@jxsuse.cloudapp.net:/home/nubisa/
#scp ./x1.sh nubisa@jxsuse.cloudapp.net:/home/nubisa/