var dgram = require("dgram");

var server = dgram.createSocket("udp4");

server.on("message", function(msg, rinfo){
  console.log('got message from client: ' + msg);
});

server.on('listening', function(){
  console.log('Kodemon server listening on')
  console.log('hostname: ' + server.address().address);
  console.log('port: ' + server.address().port);
});

server.bind(4000)