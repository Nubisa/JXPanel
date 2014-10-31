#!/bin/sh

sudo apt-get -y install build-essential unzip gcc g++ libpam0g-dev automake autoconf git zip
sudo apt-get install -y --reinstall zlibc zlib1g zlib1g-dev
sudo apt-get install -y openssl*