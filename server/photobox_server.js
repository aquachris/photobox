var PHOTOS_PER_PRINT = 4;
var BASEPATH = '/home/centaur/photobox/server';

var fs = require('fs');
var http = require('http');
var sys = require('sys');
var exec = require('child_process').exec;
var child;

var photosTaken = 0;
var snapshotsTaken = 0;

var takeImage = function() {
  console.log('taking picture');

  // assemble command
  var shellCmd = BASEPATH+'/capture-image.sh '+(photosTaken+1)+'  >>capture-photo-log.txt 2>&1';
  // execute command
  child = exec(shellCmd, function(error, stdout, stderr) {
    if(stdout) {
      sys.print(stdout + "\n");
    }
    if(stderr) {
      sys.print("ERROR: " + stderr + "\n");
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

var resetImageProcess = function() {
  console.log('resetting image process');
  
  // assemble command
  var shellCmd = BASEPATH+'/reset-images.sh >>capture-photo-log.txt 2>&1';
  child = exec(shellCmd, function(error, stdout, stderr) {
    if(stdout) {
      sys.print(stdout + "\n");
    }
    if(stderr) {
      sys.print("ERROR: " + stderr + "\n");
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
      sys.print(stdout + "\n");
    } 
    if(stderr) {
      sys.print("ERROR: " + stderr + "\n");
    }
    if(error !== null) {
      console.log("EXEC ERROR: " + error + "\n" + shellCmd);
    }
  });
};

var server = http.createServer(function(req, res) {
  var regex = /^data:.+\/(.+);base64,(.*)$/;
  
  // handle three different request methods:
  // OPTIONS, POST and GET (GET also serves as catch-all)
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
      snapshotsTaken++;
      var imgData = JSON.parse(body).imageData;
      var matches = imgData.match(regex);
      var ext = matches[1];
      var data = matches[2];
      var buffer = new Buffer(data, 'base64');
      fs.writeFileSync('snapshot_'+snapshotsTaken+'.'+ext, buffer);
      if(snapshotsTaken >= 4) {
        processImages();
      }
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
    var html = '<html><head></head><body>200: Ok</body></html>';
    res.writeHead(200, {'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*'});
    res.end('GET request served');
  }
});

// run the server
try {
  var port = 2000;
  var host = 'localhost';
  server.listen(port, host);
  console.log('Listening at http://'+host+':'+port);
} catch(e) {
  console.log('caught exception');
  console.log(e);
}

