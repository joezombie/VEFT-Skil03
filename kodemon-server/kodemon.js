var dgram = require("dgram"),
    mongoose = require('mongoose'),
    Message = require('./models').Message,
    express = require('express'),
    elasticsearch = require('elasticsearch');


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
    console.log('Kodemon server listening on');
    console.log('hostname: ' + server.address().address);
    console.log('port: ' + server.address().port);
});

server.bind(4000)

function connectMongo(){ 
  mongoose.connect('mongodb://localhost/kodemon', {keepAlive: 1});
  console.log('Connecting to mongodb');
};

mongoose.connection.on('disconnected', connectMongo);

var elClient = new elasticsearch.Client({
  host: 'localhost:9200'
});

connectMongo();

app = express();

app.use('/', express.static('./public'));
app.use('/css/', express.static('./public/css'));
app.use('/js/', express.static('./public/js'));

app.get('/api/v1/messages', function(req, res){
    Message.find({}, function(err, messages){
        if(err){
            res.status(503).send('Unable to fetch messages');
        } else  {
            res.json(messages);
        }
    })
});


app.get('/api/v1/key/:key', function(req, res){
    var key = req.params.key;
    Message.find({key: key}, function(err, b){
        if(err){
            res.status(500).send('Try again later');
        }else if(!b){
            res.status(404).send('No entry found');
        } else {
            res.json(b);
        }
    });
});

app.listen(4001, function(){
    console.log('REST API ready');
});
