#!/usr/bin/env bash

if [ -n "$DOCKER_SERVICES" ]; then
  for i in $(echo "$DOCKER_SERVICES" | sed 's/,/\n/g'); do
    echo "Trying to connect to $i"
    until nc -v -z -w 1 $(echo $i | sed 's/:/ /g'); do
      sleep 1
    done
    echo "Connected to $i!"
  done
fi

exec "$@"
