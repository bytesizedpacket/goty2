#!/bin/sh

# This script is for my webserver
# It will automatically deploy the client

npm run-script build
rm -rf /srv/*
mv dist/* /srv/

./host-server.sh
