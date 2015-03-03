#!/bin/bash

# This script assembles the full montage picture using the downsized images.
# After assembling the montage, the cleanup script is called

echo "$0 called"
date

BASEDIR=/home/centaur/photobox
PHOTODIR=$BASEDIR/photos
SERVERDIR=$BASEDIR/server

FILE_EXISTS=0
while [ $FILE_EXISTS -eq 0 ]
do
	if [ -f $PHOTODIR/capt4_sm.jpg ]
	then
		FILE_EXISTS=1
	else
		echo "last photo does not exist yet, waiting ..."
		sleep 1
	fi
done

# pipe all the montage commands together for performance reasons
montage $PHOTODIR/capt[1-4]_sm.jpg -tile 2x2 -border 5 -bordercolor '#fff' -geometry +20+20 -background transparent miff:- | \
montage - -tile 1x1 -geometry +0+40 -background transparent miff:- | \
convert - -crop 1280x980+20+0 +repage miff:- | \
montage $PHOTODIR/banner.png - $PHOTODIR/empty.png -mode Concatenate -tile x1 -texture $PHOTODIR/symphony2.png $PHOTODIR/montage.jpg
# print the montage
lp -d Canon_SELPHY_CP800 $PHOTODIR/montage.jpg
# call the cleanup / archiving script
$SERVERDIR/cleanup.sh


# tile the 4 images together
#montage ../photos/capt[1-4]_sm.jpg -tile 2x2 -border 5 -bordercolor '#fff' -geometry +20+20 -background transparent ../montages/mont_p1.png
# add some space to the top and bottom
#montage ../montages/mont_p1.png -tile 1x1 -geometry +0+40 -background transparent ../montages/mont_p2.png
# cut away space to the left
#convert ../montages/mont_p2.png -crop 1280x980+20+0 +repage ../montages/mont_p3.png
# combine montage with banner and paint background underneath
#montage ../photos/banner.png  ../montages/mont_p3.png ../photos/empty.png -mode Concatenate -tile x1 -texture ../photos/symphony2.png ../montages/montage.png
# remove fragments
#rm ../montages/mont_p1.png ../montages/mont_p2.png ../montages/mont_p3.png
