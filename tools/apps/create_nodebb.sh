#!/bin/sh

rm -rf NodeBB
git clone -b v0.5.3 https://github.com/NodeBB/NodeBB.git NodeBB
cd NodeBB
jx install
cp -r ../nodebb-extra/* ./
cd ..
zip -r -9 nodebb.zip NodeBB
rm -rf NodeBB