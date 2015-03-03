// CONSTANTS
// Limit for how many photos may be printed without maintenance
var PRINT_LIMIT = 1;
// number of pictures for each print
var PICS_PER_PRINT = 4;
// Switch DSLR is active yes/no (set to false for simulation)
var DSLR_ACTIVE = true;

// element handles for container elements
var videoCt, btnIndicatorCt, instructionsCt, instructionsInnerCt;
// number of pictures taken
var numPicsTaken = 0;
// number of prints since last maintenance
var numPrints = 0;
// element handles for dynamically created elements
var video;
// getUserMedia stream handle
var stream;
// instruction screens
var currentInstructionScreen = 0;
var instructionLoopTimeout = null;
var instructionScreens = [{
	timeout: 5000,
	style: 'font-size: 3em',
	html: '<p>Hallo!</p>'
}, {
	timeout: 4000,
	style: 'font-size: 1.8em',
	html: "<p>Bereit für's Foto?</p>"
}, {
	timeout: 10000,
	style: 'font-size: 1.2em',
	html: '<p>Dann los:</p><p class="list">1. Roten Knopf drücken</p><p class="list">2. Auf Position gehen</p><p class="list">3. Lächeln!</p>'
}];

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

	btnIndicatorCt = document.getElementById('btn-indicator-ct');
	btnIndicatorCt.classList.add('hidden');
	
	// create and add video element 
	video = document.createElement('video');
	video.setAttribute('autoplay','');
	video.classList.add('stream');
	videoCt.appendChild(video);

	// create and add video overlay
	videoOverlay = document.createElement('div');
	videoOverlay.classList.add('video-overlay');
	videoCt.appendChild(videoOverlay);
	
	//video.addEventListener('click', togglePause);
	//video.addEventListener('click', takeSnapshot);

	// reset instructions containers
	instructionsCt = null;
	instructionsInnerCt = null;
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
 * Modify the video and pretend to take a snapshot
 */
var fakeSnapshot = function() {
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
		if(video && video.src) {
			video.play();
		}
	}, 2000);
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
 * Send a PUT request to trigger a photo being taken by the DSLR
 */ 
var triggerPhoto = function() {
	if(!DSLR_ACTIVE) {
		return;
	}
	$.ajax({
		url: 'http://localhost:2000',
		type: 'PUT'
	});
};

var addText = function(html, style) {
	if(instructionsCt === null) {
		instructionsCt = document.createElement('div');
		instructionsCt.classList.add('instructions');
		document.body.appendChild(instructionsCt);
		instructionsInnerCt = document.createElement('div');
		instructionsCt.appendChild(instructionsInnerCt);
	}
	if(style) {
		instructionsInnerCt.setAttribute('style', style);
	}
	instructionsInnerCt.innerHTML = html;
	//var paragraph = document.createElement('p');
	//paragraph.innerHTML = html;
	//instructionsInnerCt.appendChild(paragraph);
};

var removeText = function() {
	if(instructionsCt !== null) {
		document.body.removeChild(instructionsCt);
	}
	instructionsCt = null;
	instructionsInnerCt = null;
};

var showNextInstructionScreen = function() {
	var cur;
	removeText();
	cur = instructionScreens[currentInstructionScreen];
	addText(cur.html, cur.style);
	instructionLoopTimeout = setTimeout(showNextInstructionScreen, cur.timeout);
	currentInstructionScreen++;
	if(currentInstructionScreen >= instructionScreens.length) {
		currentInstructionScreen = 0;
	}

};

var stopInstructionLoop = function() {
	clearTimeout(instructionLoopTimeout);
	removeText();
	hideBtnIndicator();
	currentInstructionScreen = 0;
};

var startInstructionLoop = function() {
	if(numPrints >= PRINT_LIMIT) {
		console.log('maintenance required');
		showMaintenanceMessage();
		return;
	}
	console.log("starting instruction loop");
	showNextInstructionScreen();
	showBtnIndicator();
	document.body.addEventListener('click', startPictureProcess);
};

var hideBtnIndicator = function() {
	btnIndicatorCt.classList.add('hidden');
};

var showBtnIndicator = function() {
	btnIndicatorCt.classList.remove('hidden');
};

var showMaintenanceMessage = function() {
	removeText();
	hideBtnIndicator();
	addText('<p class="maintenance">Drucker muss neu befüllt werden.</p>');
	document.body.addEventListener('click', onMaintenanceMouseClick);
};

var onMaintenanceMouseClick = function(e) {
	// middle mouse button resets printed pages and reinits
	if(e.button === 1) {
		document.body.removeEventListener('click', onMaintenanceMouseClick);
		console.log('print status reset');
		numPrints = 0;
		startInstructionLoop();
	} 
	e.preventDefault();
};

var showPrintWaitScreen = function() {
	numPrints++;
	removeText();
	setTimeout(function() {
		addText('<p>Schon vorbei!</p>', 'font-size: 2em;');
	}, 2000);
	setTimeout(function() {
		removeText();
		addText('<p>Druckt ...</p><p class="loading"></p>');
	}, 7000);
	setTimeout(function() {
		removeText();
		addText('Der Ausdruck kommt auf der linken Seite aus der Box.');
	}, 25000);
	setTimeout(function() {
		removeText();
		startInstructionLoop();
	}, 30000);
};

var startPictureProcess = function(e) {
	if(e && e.button === 0) {
		console.log('starting picture process');
		stopInstructionLoop();
		document.body.removeEventListener('click', startPictureProcess);
		numPicsTaken = 0;
		takeNextPicture();
	} else if(e) {
		console.log('ignoring button press: ' + e.button);
	} else {
		console.log('ERROR: startPictureProcess called without event');
	}
};

var takeNextPicture = function() {
	var extraTime = numPicsTaken === 0 ? 2000 : 0;
	removeText();
	if(numPicsTaken === 0) {
		requestCamera();
	}
	addText('<p class="pic">Bild '+(numPicsTaken+1)+'</p>');
	setTimeout(function() {
		removeText();
	}, 1500+extraTime);
	setTimeout(function() {
		addText('<p class="pic">3</pic>');
	}, 2000+extraTime);
	setTimeout(function() {
		removeText();
		addText('<p class="pic">2</p>');
	}, 3000+extraTime);
	setTimeout(function() {
		removeText()
		addText('<p class="pic">1</p>');
		triggerPhoto();
	}, 4000+extraTime);
	setTimeout(function() {
		fakeSnapshot();
		//triggerPhoto();
		removeText();
	}, 5000+extraTime);
	setTimeout(function() {
		numPicsTaken++;
		if(numPicsTaken < PICS_PER_PRINT) {
			takeNextPicture();
		} else {
			stopCamera();
			showPrintWaitScreen();
		}
	}, 8000+extraTime);
};

/**
 * Execute program when page is ready
 */
document.addEventListener('DOMContentLoaded', function() {
	init();
	startInstructionLoop();
});
