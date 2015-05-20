#!/bin/bash

echo "$0 called"
date

BASEDIR=/home/centaur/photobox
SERVERDIR=$BASEDIR/server

# clear printer queue
cancel -a

# deactivate printing
rm $SERVERDIR/print.true
