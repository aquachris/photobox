// element handles for container elements
var videoCt, btnIndicatorCt, instructionsCt, instructionsInnerCt;
// element handles for dynamically created elements
var video;
// getUserMedia stream handle
var stream;

/**
 * Initialize getUserMedia
 */
var init = function(videoId) {
	// check for getUserMedia support
	navigator.getUserMedia = navigator.getUserMedia ||	
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia ||
		navigator.msGetUserMedia;
	
	if(!navigator.getUserMedia) {
		console.error("Browser does not support getUserMedia");
	} else {
		console.log("Browser support for getUserMedia found");
	}
	
	// get container element handles
	videoCt = document.getElementById('video-ct');
	videoCt.classList.add('hidden');

	// create and add video element 
	video = document.createElement('video');
	video.setAttribute('autoplay','');
	video.classList.add('stream');
	videoCt.appendChild(video);

	video.addEventListener('click', togglePause);
	requestCamera();
};

/**
 * Put camera feed into video element
 */
var requestCamera = function() {
	// make camera container visible
	videoCt.classList.remove('hidden');
	// request camera
	var constraints = { video: true };
	var successCallback = function(localMediaStream) {
		stream = localMediaStream;
		video.src = window.URL.createObjectURL(stream);
		console.log("stream started");
	};
	var errorCallback = function(err) {
		console.error("getUserMedia error: ", err);
	};
	navigator.getUserMedia(constraints, successCallback, errorCallback);
};

/**
 * Stops and releases the stream
 */
var stopCamera = function() {
	if(video) {
		video.pause();
		if(stream) {
			stream.stop();
		}
		video.src = '';
		console.log('stream stopped');
	}
	videoCt.classList.add('hidden');
};

/**
 * Pause / Unpause video stream
 */ 
var togglePause = function() {
	video.paused ? video.play() : video.pause();
};

/** 
 * Take a still of the video stream
 */ 
var takeSnapshot = function() {
	console.log('taking snapshot');
	
	// suspend click listener
	video.removeEventListener('click', takeSnapshot);
	// pause video
	video.pause();
	
	// do an animation ("white out") to show that something is happening
	var brightness = 1;
	var saturate = 1;
	var incrementing = true;
	var interval = setInterval(function() {
		if(incrementing) {
			brightness += 1;
		} else {
			brightness -= 1;
		}
		if(brightness >= 6) {
			incrementing = false;
		} 
		if(brightness <= 1) {
			brightness = 1;
			incrementing = true;
			clearInterval(interval);
		}
		saturate = (5 - (brightness-1)) * 0.2;
		video.style['filter'] = 'brightness('+brightness+') saturate('+saturate+')';
		video.style['-webkit-filter'] = 'brightness('+brightness+') saturate('+saturate+')';
	}, 20);
	
	setTimeout(function() {
		// create and add snapshot element 
		var snapshot = document.createElement('canvas');
		snapshot.width = 300; //video.videoWidth;
		snapshot.height = 200; //video.videoHeight;
		snapshot.classList.add('snapshot');
		snapshot.getContext('2d').drawImage(video, 0, 0, 300, 200);
		snapshotCt.appendChild(snapshot);
		
		// send image to server
		postSnapshot(snapshot);

		// increment snapshot counter
		snapshotsTaken++;
		if(snapshotsTaken >= 4) {
			while(snapshotCt.firstChild) {
				snapshotCt.removeChild(snapshotCt.firstChild);
			}
			snapshotsTaken = 0;
		}
		
		// re-add click listener
		video.addEventListener('click', takeSnapshot);
		// restart video
		video.play();
	}, 500);
};

var postSnapshot = function(canvas) {
	// get base64 encoded png
	var imgData = canvas.toDataURL('img/jpg');
	// remove descriptor from beginning (TODO: necessary?)
	//imgData = imgData.replace('data:image/png;base64,', '');
	// JSON-encode
	var postData = JSON.stringify({imageData: imgData});
	// send post request
	$.ajax({
		url: 'http://localhost:2000',
		type: 'POST',
		data: postData,
		contentType: 'application/json'
	});
};

/**
 * Execute program when page is ready
 */
init();
