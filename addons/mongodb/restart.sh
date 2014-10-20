#!/bin/sh
clear
./stop.sh
rm -rf /home/nubisa/GitHub/JXPanel/server_apps/addons/mongodb/data/*
cp ./mongodb.conf /home/nubisa/GitHub/JXPanel/server_apps/addons/mongodb/data/
./start.sh
jx ./test.js
jx ./test_createUser.js
jx ./test2.js