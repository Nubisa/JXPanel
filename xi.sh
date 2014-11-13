#!/bin/bash

NORMAL_COLOR='\033[0m'
RED_COLOR='\033[0;31m'
GREEN_COLOR='\033[0;32m'
GRAY_COLOR='\033[0;37m'

UNZIP_INSTALL=""
LOG() {
    COLOR="$1"
    TEXT="$2"
    echo -e "${COLOR}$TEXT ${NORMAL_COLOR}"
}

find_arch() {
    check_again=$(uname -mrsn)
	if [[ "$check_again" =~ 'arm' ]]
	then
		echo "ARM"
	elif [[ "$check_again" =~ '64' ]]
	then
		echo "64"
	else
	    echo "32"
	fi
}

find_os() {
    arch=$(find_arch "$1")
    if [[ "$1" =~ 'Darwin' ]]
    then
        echo "jx_osx$arch"
        return
    fi

    if [[ "$1" =~ 'Ubuntu' ]]
    then
        OT=$(apt-get -y install unzip)
        echo "jx_ub$arch"
        return
    fi

    if [[ "$1" =~ 'Debian' ]]
    then
        OT=$(apt-get -y install unzip)
        echo "jx_deb$arch"
        return
    fi

    if [[ "$1" =~ 'SUSE' ]]
    then
        OT=$(zypper install -n -y unzip)
        echo "jx_suse$arch"
        return
    fi

    if [[ "$1" =~ 'Red Hat' ]]
    then
        OT=$(yum install -y unzip)
        echo "jx_rh$arch"
        return
    fi

    if [[ "$1" =~ 'Gentoo' ]]
    then
        echo "jx_gen$arch"
        return
    fi

    if [[ "$1" =~ 'ARCH' ]]
    then
    	if [[ "$arch" =~ "ARM" ]]
    	then
        	echo "jx_ark$arch"
        	return
        else
        	echo "This ARCH OS architecture is not supported yet"
        	exit
        fi
    fi

    rasp_check=$(uname -msrn)
    if [[ "$rasp_check" =~ 'raspberrypi' ]]
    then
        OT=$(apt-get install -y unzip)
        echo "jx_rasp"
        return
    fi

    if [[ "$rasp_check" =~ 'FreeBSD' ]]
    then
    	if [[ "$rasp_check" =~ '64' ]]
    	then
        echo "jx_bsd64"
        return
      fi
    fi

    echo "This OS is not supported - $1"
    exit
}

# added for JXPanel
GoJXPanel() {

    LOG $GREEN_COLOR "Downloading JXPanel..."
    LOG $GRAY_COLOR "$(rm -rf JXPanel.zip)"
    LOG $GRAY_COLOR "$(curl -O http://jxcore.com/jxpanel/JXPanel.zip)"

    LOG $GREEN_COLOR "Unpacking..."
    sudo -u $SUDO_USER mkdir -p JXPanel
    sudo -u $SUDO_USER unzip -o JXPanel.zip -d JXPanel > /dev/null

    set -e
    cd JXPanel/tools
    ./install.sh JXPanel
    cd ../../
    chown -R root:root JXPanel
    cd JXPanel/app
    /usr/local/bin/jx index.js install
    cd ../../
    set +e

    LOG $GREEN_COLOR "JXPanel ready. You can run it with the following command:"
    LOG $GRAY_COLOR "   $ cd JXPanel"
    LOG $GRAY_COLOR "   $ sudo ./start.sh"

    # Cleaning up
    rm -rf JXPanel.zip xi.sh
}
LOG $GREEN_COLOR "JXcore Installation Script for X systems\n"

# testing permission
trial=$(mkdir /usr/local/bin/jxcore_install_test 2>&1)
if [[ "$trial" =~ "denied" ]]
then
  echo "Permission denied. You need admin/root rights to make this installation. Try sudo/su ?"
  exit
fi
trial=$(rm -rf /usr/local/bin/jxcore_install_test)

linux_version="/proc/version"
zip_file=""
if [ -f "$linux_version" ]
then
	LOG $GRAY_COLOR "Testing for a Linux distro"
	output=$(cat /proc/version)
	zip_file=$(find_os "$output")
else
	LOG $GRAY_COLOR "Testing for a BSD distro"
	output="$(uname -mrsn)"
	zip_file=$(find_os "$output")
fi

link="https://s3.amazonaws.com/nodejx/$zip_file.zip"
LOG $GREEN_COLOR "Downloading $link"

LOG $GRAY_COLOR $(curl -k -o "$zip_file.zip" "$link")
LOG $GREEN_COLOR "Download completed. Testing for unzip command."

if [ -f "/usr/bin/unzip" ]
then
    LOG $GRAY_COLOR "$(unzip -u "$zip_file.zip")"
    rasp_check=$(uname -msrn)

    if [[ "$rasp_check" =~ 'FreeBSD' ]]
    then
      if [[ "$rasp_check" =~ '10.' ]]
      then
        cp "$zip_file/bsd10/jx" "/usr/local/bin/jx"
      else
        cp "$zip_file/bsd9/jx" "/usr/local/bin/jx"
      fi
    else
      cp "$zip_file/jx" "/usr/local/bin/jx"
    fi

    LOG $GRAY_COLOR "$(/usr/local/bin/jx -jxv)"

    GoJXPanel;
else
    LOG $RED_COLOR "unzip not found, please install unzip command and then run this script again.."
fi
LOG $GREEN_COLOR "Cleaning up.."
LOG $GRAY_COLOR "$(rm "$zip_file.zip")"
LOG $GRAY_COLOR "$(rm -rf "$zip_file")"
