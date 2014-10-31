var dgram = require("dgram"),
    mongoose = require('mongoose'),
    Message = require('./models').Message,
    express = require('express'),
    bodyParser = require('body-parser'),
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
app.use( bodyParser.json() );
app.use('/', express.static('./public'));
app.use('/css/', express.static('./public/css'));
app.use('/js/', express.static('./public/js'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

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

// API: http://localhost:4001/api/v1/key/bytime
// return records for given keyvalue in time range provided in body
// BODY: 
// {      
//       "from": "2014-10-30T20:08:07.000Z",
//       "to": "2014-10-30T20:08:07.000Z",
//       "key": "test.py-test"
//   }
app.post('/api/v1/key/bytime', function(req, res){
    
    var search_from = req.body.from || "";
    var search_to   = req.body.to || "";
    var key         = req.body.key || "";
    
    console.log('search_from: ' + search_from);
    console.log('search_to: ' + search_to);
    console.log('key:' + key);
    

    elClient.search({
        "index" : key,
        "query" : {            
            "range" : {
                "timestamp" : {
                    "from" : search_from,
                    "to" : search_to
                }
            }
        }
    }, function(err, response){
            console.log(err);
            res.json(response);
    });
});



app.get('/api/v1/keys', function(req, res){  
    elClient.cat.indices({format:'json'},
        function(err, response){
            console.log(err);
            res.json(response);
        }
    );       
});

app.post('/api/v1/keys/messages', function(req, res){
    
    var key = req.body.key;    
    console.log('key:' + key);    

    var count;
    elClient.count({
        "index" : key,        
        "query" : {                 
            "key" : key        
        }
        }, function (error, response) {
            count = response.count;
            
            elClient.search({  
                "size" : count,      
                "index" : key,        
                "query" : {                 
                    "key" : key        
                }
            }, function(err, response){
                console.log(err);            
                res.json(response);
                });
             });
    
});

app.listen(4001, function(){
    console.log('REST API ready');
});