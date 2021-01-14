#!/bin/sh

echo "Now starting goty2 client on port 8080..."

DIR="$( cd "$( dirname "$0" )" && pwd )"
cd ${DIR}

npm install .
npm run-script start
