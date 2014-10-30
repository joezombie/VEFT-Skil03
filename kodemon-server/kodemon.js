var dgram = require("dgram"),
	mongoose = require('mongoose'),
	Message = require('./models').Message;


var server = dgram.createSocket("udp4");

server.on("message", function(msg, rinfo){
	data = JSON.parse(msg);
	data.timestamp = new Date(data.timestamp * 1000);
  	console.log('got message from client: ');
  	var message = new Message(data);
  	message.save(function(err, b){
  		if(err){
  			console.log('Could not save to MongoDB', err);
  		} else {
			console.log('Message saved to MongoDB');
  		}
  	});
});

server.on('listening', function(){
  	console.log('Kodemon server listening on')
  	console.log('hostname: ' + server.address().address);
  	console.log('port: ' + server.address().port);
});

function connectMongo(){ 
  mongoose.connect('mongodb://localhost/kodemon', {keepAlive: 1});
  console.log('Connecting to mongodb');
};

mongoose.connection.on('disconnected', connectMongo);

connectMongo();

server.bind(4000)