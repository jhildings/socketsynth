var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(3000);

function handler (req, res) {
  
  var file = __dirname + '/index.html'
  if(req.url != '/') {
    file = __dirname + req.url;
  } 
  console.log(req.url);
  console.log(file);

  fs.readFile(file,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.writeHead(200);
      res.end(data);
    });
}

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

io.sockets.on('connection', function(socket) {
    socket.on('send_message', function(data) {
      data.message = data.frequency + "|" + data.voice;
      io.sockets.emit('get_message', data);
    });
});
