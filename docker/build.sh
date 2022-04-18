#!/bin/bash
set -e

if ! [[ -d ../logs/apache ]]; then
    mkdir -p ../logs/docker/apache
fi

if ! [[ -d ../logs/php ]]; then
    mkdir -p ../logs/docker/php
fi

docker-compose up -d --build

docker exec vgr_apache chown -R root:www-data /usr/local/apache2/logs
docker exec vgr_php chown -R root:www-data /usr/local/etc/logs
