#!/bin/sh

zip -r jxaddon_mongodb.zip *
mv jxaddon_mongodb.zip ../
scp ../jxaddon_mongodb.zip nubisa_krzs@192.168.1.11:~/Desktop/