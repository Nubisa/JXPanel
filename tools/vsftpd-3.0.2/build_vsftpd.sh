mkdir build_$1
make
mv vsftpd build_$1/
cp _vsftpd.conf build_$1/vsftpd.conf
cp _vsftpd_users build_$1/vsftpd_users
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


