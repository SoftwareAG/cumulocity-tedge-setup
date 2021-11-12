var express = require('express'),
    app = express(),
    http = require('http'),
    socketIO = require('socket.io'),
    server, io;

app.get('/', function (req, res) {
res.sendFile(__dirname + '/index.html');
});

server = http.Server(app);
const port = 5000;
server.listen(port);
console.log(`Listen on port: ${port}`);

io = socketIO(server);

io.on('connection', function (socket) {
  socket.emit('greeting-from-server', {
      greeting: 'Hello Client'
  });
  socket.on('greeting-from-client', function (message) {
    console.log(message);
  });
});