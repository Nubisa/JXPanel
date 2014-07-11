#!/bin/sh
openssl genrsa -out $1.key 1024
openssl req -new -key $1.key -out $1.csr -subj "/C=XX/ST=XXX/L=XXXX/O=XX/CN=$1"
openssl x509 -req -days 3650 -in $1.csr -signkey $1.key -out $1.crt
rm $1.csr
