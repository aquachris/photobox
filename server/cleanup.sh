#!/bin/bash

echo "$0 called"
date

# This script cleans up after the montage has been assembled by
# creating a new archive folder and moving all montage pictures there.
# This includes both the full shots and the completed montage.

BASEDIR=/home/centaur/photobox
PHOTODIR=$BASEDIR/photos
ARCHDIR=$PHOTODIR/archive

PREVDIR=`exec ls $ARCHDIR | sed -e 's/[0-9]+//' | sort -n | tail -1`
PREVDIR=$((10#$PREVDIR))
CURDIR=`exec printf %05d $((PREVDIR + 1))`

# create the new folder
mkdir $ARCHDIR/$CURDIR
# delete the downsized image versions
rm $PHOTODIR/capt*_sm.jpg
# move the images to the new folder
mv $PHOTODIR/capt*.jpg $ARCHDIR/$CURDIR
mv $PHOTODIR/montage.jpg $ARCHDIR/$CURDIR/$CURDIR.jpg

# backup the files on the USB stick if it is available
if [ -d /automnt/usb-stick/photos ]
	then cp -r $ARCHDIR/$CURDIR /automnt/usb-stick/photos
	else echo "USB stick not available"
fi
