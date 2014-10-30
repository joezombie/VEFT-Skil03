var mongoose = require('mongoose');


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

});


var Message = mongoose.model('Message', messageSchema);

module.exports = {'Message': Message};