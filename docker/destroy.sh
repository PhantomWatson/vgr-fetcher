#!/bin/bash
set -e

docker-compose down --volumes
docker rmi vgr_apache vgr_php
