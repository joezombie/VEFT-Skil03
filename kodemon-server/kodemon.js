var dgram = require("dgram");

var server = dgram.createSocket("udp4");

server.on("message", function(msg, rinfo){
	data = JSON.parse(msg);
	data.timestamp = new Date(data.timestamp * 1000);
  	console.log('got message from client: ');
  	console.log(data);
});

server.on('listening', function(){
  	console.log('Kodemon server listening on')
  	console.log('hostname: ' + server.address().address);
  	console.log('port: ' + server.address().port);
});

server.bind(4000)