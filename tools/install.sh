#!/bin/bash

if [[ "$1" == "" ]]
then
    echo "expects: install [panel name]"
    exit -1
fi

runit() {
    if [[ $1 == 0 ]]
    then
        echo ""
    else
        exit -1
    fi
}

jx cpp.js;runit $?
jx ftp.js $1;runit $?

echo "Done!"

