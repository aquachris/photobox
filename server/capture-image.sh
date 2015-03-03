#!/bin/bash

# This script triggers the DSLR to take a picture and put it in the photos folder.
# Afterwards, the photo will be downsized for montage assembly.

echo "$0 called"
date

BASEDIR=/home/centaur/photobox
PHOTODIR=$BASEDIR/photos

gphoto2 --capture-image-and-download --force-overwrite --filename=$PHOTODIR/capt$1.jpg
convert $PHOTODIR/capt$1.jpg -resize 600x400 $PHOTODIR/capt${1}_sm.jpg

