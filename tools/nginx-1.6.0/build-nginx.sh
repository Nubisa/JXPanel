#!/bin/sh
./configure --prefix=/nginx --with-pcre=pcre-8.33/
make install
cp *.js /nginx
cp *.jxp /nginx
mkdir -p /nginx/logs
cp *.log /nginx/logs
DIR="$( cd "$( dirname "$0" )" && pwd )"
cd /nginx
jx compile /nginx/nginx.jxp
mv /nginx/nginx.jx $DIR/$1_nginx.jx
cd $DIR
