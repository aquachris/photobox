#!/bin/bash

echo "$0 called"
date

BASEDIR=/home/centaur/photobox
SERVERDIR=$BASEDIR/server

# activate printing
touch $SERVERDIR/print.true
