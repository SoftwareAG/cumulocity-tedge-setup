#!/bin/sh
[ -f /app/tedge/tedge-ui-env ] && . /app/tedge/tedge-ui-env

if [ -z "$MONGO_HOST" ] ;  then
  echo "MONGO_HOST is not set, please set it in /app/tedge/tedge-ui" >&2
  exit 1
fi
node /app/tedge/server.js