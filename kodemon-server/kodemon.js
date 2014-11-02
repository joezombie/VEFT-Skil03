var dgram = require("dgram"),
    mongoose = require('mongoose'),
    Message = require('./models').Message,
    express = require('express'),
    bodyParser = require('body-parser'),
    elasticsearch = require('elasticsearch'),
    ejs = require('elastic.js');


var server = dgram.createSocket("udp4");

server.on("message", function(msg, rinfo){
    data = JSON.parse(msg);
    data.timestamp = new Date(data.timestamp * 1000);
    data.key = data.key.substring(data.key.lastIndexOf('\\')+1);
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

app.get('/api/v1/key/:key', function(req, res){
    var key = req.params.key;
    elClient.count({
        index: key
    }, function (err, response) {
      if(err){
            res.status(500).send('Something went wrong');
            console.log(err);
        }else {
            elClient.search({
                index : key,
                size : response.count,
                body : ejs.Request()
                        .query(ejs.MatchAllQuery())
                        .sort('timestamp', 'asc')
            }, function(err, response){
                if(err){
                    res.status(500).send('Something went wrong');
                    console.log(err);
                }else {                   
                    responseArr = [];
                    for (var i = 0, len = response.hits.hits.length; i < len; i++) {
                        responseArr.push(response.hits.hits[i]._source);
                    }
                    res.json(responseArr);  
                }
            });
        }
    });
});

app.get('/api/v1/key/:key/from/:from/take/:take', function(req, res){
    var key = req.params.key;
    var from = parseInt(req.params.from);
    var take = parseInt(req.params.take);

    if(isNaN(from) || isNaN(take)){
        res.status(400).send('Incorrect request');
    } else {
        elClient.search({
            index : key,
            size : take,
            from : from,
            body : ejs.Request()
                    .query(ejs.MatchAllQuery())
                    .sort('timestamp', 'asc')
        }, function(err, response){
            if(err){
                res.status(500).send('Something went wrong');
                console.log(err);
            }else {                   
                responseArr = [];
                for (var i = 0, len = response.hits.hits.length; i < len; i++) {
                    responseArr.push(response.hits.hits[i]._source);
                }
                res.json(responseArr);  
            }
        });
        
    }
});

app.get('/api/v1/key/:key/count', function(req, res){
    var key = req.params.key;

    elClient.count({
        "index" : key
    }, function(err, response){
        if(err){
            res.status(500).send('Something went wrong');
            console.log(err);
        }else {  
            res.json(response.count);   
        }   
    });
});

app.get('/api/v1/key/:key/getlast/:lastNr', function(req, res){
    var key = req.params.key;
    var lastNr = parseInt(req.params.lastNr);
    
    if(isNaN(lastNr)){
        res.status(400).send('Incorrect request');
    } else {
        elClient.search({
                index : key,
                size : lastNr,
                body : ejs.Request().sort('timestamp', 'desc')
            }, 
            function(err, response){
                if(err){
                    res.status(500).send('Something went wrong');
                    console.log(err);
                }else {                   
                    responseArr = [];
                    for (var i = 0, len = response.hits.hits.length; i < len; i++) {
                        responseArr.push(response.hits.hits[i]._source);
                    }
                    res.json(responseArr);  
                }
            }
        );
    }
    
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
        if(err){
            res.status(500).send('Something went wrong');
            console.log(err);
        }else {                   
            responseArr = [];
            for (var i = 0, len = response.hits.hits.length; i < len; i++) {
                responseArr.push(response.hits.hits[i]._source);
            }
            res.json(responseArr);  
        }
    });
});



app.get('/api/v1/keys', function(req, res){  
    elClient.cat.indices({format:'json'},
        function(err, response){
            if(err){
                console.log(err);
                res.status(500).send('Something went wrong ');
            }else {
                responseArr = [];
                for (var i = 0, len = response.length; i < len; i++) {
                    responseArr.push(response[i].index);
                }
                res.json(responseArr.sort());
            }
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
                    if(err != null){
                        console.log(err);            
                    }
                    var result = [];            
                    for (var i = 0, len = response.hits.hits.length; i < len; i++) {                    
                        result.push(response.hits.hits[i]._source);
                    }

                    res.json(result);
                });
             });
    
});


/* API: http://localhost:4001/api/v1/keys/timerange
* return records for given keyvalue in time range provided in body
* BODY: 
* {      
*       "from": "2014-10-30T20:08:07.000Z",
*       "to": "2014-10-30T20:08:07.000Z",
*       "key": "test.py-test"
*   }
*/
/**
 * Represents a book.
 * @constructor
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */
 
app.post('/api/v1/keys/timerange', function(req, res){
    
    var search_from = req.body.from || "";
    var search_to   = req.body.to || "";
    var key         = req.body.key || "";
    
    console.log('search_from: ' + search_from);
    console.log('search_to: ' + search_to);
    console.log('key:' + key);
    
    if(search_from != "" && search_to != "" && key != "")
    {

        elClient.search({
            index : key,
            body : ejs.Request().query(
                 ejs.RangeQuery('timestamp')
                .from(search_from)
                .to(search_to))
                .sort('timestamp', 'desc')        
        }, function(err, response){
                if(err != null){
                    console.log('TimeRangeError: ' + err);
                }
                var result = [];            
                    for (var i = 0, len = response.hits.hits.length; i < len; i++) {                    
                        result.push(response.hits.hits[i]._source);
                    }

                res.json(result);
        });
    }else{
        res.json(null);
    }
    
});

app.listen(4001, function(){
    console.log('REST API ready');
});

/** This is a description of the foo function. */
function foo() {
}