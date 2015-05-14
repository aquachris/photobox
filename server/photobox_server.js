// This file contains a primitive nodejs web server that reacts to the requests being 
// sent by the photobox HTML frontend. The web server runs on localhost:<PORT>
// 
// The server can currently deal with the following request types (see implementation for details):
// OPTIONS requests set CORS headers
// GET requests are used to communicate the printer state
// PUT requests trigger the DSLR to take a single photo
// POST requests are used to re-enable the printer
// DELETE requests reset the current image process

var PORT = 2000;
var PHOTOS_PER_PRINT = 4;
var BASEPATH = '/home/centaur/photobox/server';

var fs = require('fs');
var http = require('http');
var sys = require('sys');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var child;

var photosTaken = 0;
var snapshotsTaken = 0;
var printerEnabled = true;

var queryPrinterStatus = function() {
  console.log('getting printer status');
  
  // assemble command
  var shellCmd = 'lpstat -p Canon_SELPHY_CP800 | grep enabled';
  // execute command (synchronously)
  var ret;
  try {
    ret = execSync(shellCmd);
  } catch(e) {
    console.log("exception in queryPrinterStatus: "+ e + "\n");
  }
  if(!ret) {
    console.log("queryPrinter negative\n");
    printerEnabled = false;
  } else {
    console.log("queryPrinter positive\n");
    printerEnabled = true;
  }
  return printerEnabled;
};

var takeImage = function() {
  console.log('taking picture');

  // assemble command
  var shellCmd = BASEPATH+'/capture-image.sh '+(photosTaken+1)+'  >>capture-photo-log.txt 2>&1';
  // execute command
  child = exec(shellCmd, function(error, stdout, stderr) {
    if(stdout) {
      console.log(stdout + "\n");
    }
    if(stderr) {
      console.log("ERROR: " + stderr + "\n");
    }
    if(error !== null) {
      console.log("EXEC ERROR: " + error + "\n" + shellCmd);
    }
  });
  photosTaken++;
  if(photosTaken >= PHOTOS_PER_PRINT) {
    setTimeout(function() {
      console.log('process photos and print montage');
      processImages();
    }, 3000);
  }
};

var resetPrinter = function() {
  console.log('resetting printer state');
  
  // assemble command
  var shellCmd = BASEPATH+'/reset-printer.sh >>capture-photo-log.txt 2>&1';
  child = exec(shellCmd, function(error, stdout, stderr) {
    if(stdout) {
      console.log(stdout + "\n");
    }
    if(stderr) {
      console.log("ERROR: " + stderr + "\n");
    }
    if(error !== null) {
      console.log("EXEC ERROR: " + error + "\n" + shellCmd);
    }
  }
  printerEnabled = true;
};

var resetImageProcess = function() {
  console.log('resetting image process');
  
  // assemble command
  var shellCmd = BASEPATH+'/reset-images.sh >>capture-photo-log.txt 2>&1';
  child = exec(shellCmd, function(error, stdout, stderr) {
    if(stdout) {
      console.log(stdout + "\n");
    }
    if(stderr) {
      console.log("ERROR: " + stderr + "\n");
    }
    if(error !== null) {
      console.log("EXEC ERROR: " + error + "\n" + shellCmd);
    }
  });
  photosTaken = 0;
};

var processImages = function() {
  photosTaken = 0; 
  var shellCmd = BASEPATH+'/convert-files.sh >>convert-files-log.txt 2>&1';

  // execute the command
  child = exec(shellCmd, function(error, stdout, stderr) {
    if(stdout) {
      console.log(stdout + "\n");
    } 
    if(stderr) {
      console.log("ERROR: " + stderr + "\n");
    }
    if(error !== null) {
      console.log("EXEC ERROR: " + error + "\n" + shellCmd);
    }
  });
};

var server = http.createServer(function(req, res) {

  // handle the different request types:
  if(req.method == 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE'
    });
    res.end('OPTIONS request served');

  } else if(req.method == 'POST') {
    var body = '';
    req.on('data', function(data) {
      body += data;
      console.log('Partial body');
    });
    req.on('end', function() {
	resetPrinter();
    });
    res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});
    res.end('POST request served');

  } else if(req.method == 'PUT') {
    takeImage();
    res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});
    res.end('PUT request served');

  } else if(req.method == 'DELETE') {
    resetImageProcess();
    res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});
    res.end('DELETE request served');

  } else {
    console.log(queryPrinterStatus());
    var text = ''+printerEnabled; // "true" or "false" (String)
    res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
    res.end(text);
  }
});

// run the server
try {
  var host = 'localhost';
  server.listen(PORT, host);
  console.log('Listening at http://'+host+':'+PORT);
} catch(e) {
  console.log('caught exception');
  console.log(e);
}

