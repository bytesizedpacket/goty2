#!/bin/sh

echo "Now starting goty2 server on port 3000..."

DIR="$( cd "$( dirname "$0" )" && pwd )"
cd ${DIR}

git pull
npm install .
npm run-script server
