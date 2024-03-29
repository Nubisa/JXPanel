#!/bin/sh
$(rm -rf /nginx)
unzip pcre-8.35.zip
cd pcre-8.35
./configure
make
cd ..
make clean
./configure --prefix=/nginx --with-pcre=pcre-8.35/ --with-http_ssl_module
make install
cp *.js /nginx/
cp *.jxp /nginx/
mkdir -p /nginx/logs
DIR="$( cd "$( dirname "$0" )" && pwd )"
cd /nginx/logs
echo "" > access.log
echo "" > error.log
cd ..
/usr/local/bin/jx compile /nginx/nginx.jxp
mv /nginx/nginx.jx $DIR/$1_nginx.jx
cd $DIR
rm -rf pcre-8.35
make clean
rm -rf /nginx