#!/bin/bash
set -e
source  /root/env/django/bin/activate

PROJECT_HOME=/root/projects/spadger/
cd ${PROJECT_HOME}/src

LOGFILE=${PROJECT_HOME}/logs/django.log
LOGDIR=$(dirname $LOGFILE)
NUM_WORKERS=2
# user/group to run as
USER=root
GROUP=root

test -d $LOGDIR || mkdir -p $LOGDIR
exec gunicorn -w $NUM_WORKERS -b 0.0.0.0:8000 spadger.wsgi:application --user=$USER --group=$GROUP

