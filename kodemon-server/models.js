var mongoose = require('mongoose'),
    elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: 'localhost:9200'
});


var setTags = function(tags){
    return tags.split(',') 
}

var getTags = function(tags){
    return tags.join(',')
}

var messageSchema = new mongoose.Schema({
    execution_time:  {type: Number, required: true},
    timestamp: {type: Date, required: true},
    token: {type: String, required: true},
    key: {type: String, required: true},
});

messageSchema.pre('save', function(next){
    next();
});

messageSchema.post('save', function(b) {
    client.index({
        index: b.key.toLowerCase(),
        type: 'message',
        id: String(b._id),
        body: b},
        function(error, response) {
            console.log(error);
            console.log(response);
    });
});




var Message = mongoose.model('Message', messageSchema);

module.exports = {'Message': Message};
