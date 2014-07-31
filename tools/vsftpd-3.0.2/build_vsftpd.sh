#!/bin/sh
rm -rf build_$1
mkdir build_$1
make
mv vsftpd build_$1/
cp _vsftpd.conf build_$1/vsftpd.conf
cp _vsftpd_users build_$1/vsftpd_users
chdir build_$1
mkdir ftp_root
chown -R root:root ftp_root
chmod 755 ftp_root
chmod a-w ftp_root
mkdir log
chown -R root:root log
cd ..
make clean

echo ""
echo ""
echo "!!!!!"
echo "enter <cat build_vsftpd.sh> to see add user etc."
echo ""
echo "RUN (under build_$1) using <sudo ./vsftpd ./vsftpd.conf>"

# CREATE GROUP
# sudo addgroup jxman

# REMOVE USER
# deluser iuser

# CREATE USER
# sudo useradd -g jxman -d /nginx/www/iuser -M -s /sbin/nologin iuser
# 
# SET PASSWORD
# echo "iuser:password" | sudo chpasswd -c SHA256


