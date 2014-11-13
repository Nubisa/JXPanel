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

JX="/usr/local/bin/jx"

$JX cpp.js;runit $?
#$JX ftp.js $1;runit $?

OS_STR=$($JX -e "console.log(jxcore.utils.OSInfo().OS_STR)" 2>&1)

echo "Compiling nginx..."
cd nginx
./build-nginx.sh $OS_STR > /dev/null
runit $?
cd ../

# non-sudo user should have access to it
sudo -u $SUDO_USER sudo rm -rf ~/.npm ~/.jx
runit $?

#npm modules rebuild
echo "Instaling npm modules..."
cd ../app/node_modules/authenticate-pam/
sudo -u $SUDO_USER $JX install
runit $?

cd ../pty.js/
sudo -u $SUDO_USER $JX install
runit $?

# app/
cd ../../
sudo -u $SUDO_USER $JX install jxm > /dev/null
runit $?
