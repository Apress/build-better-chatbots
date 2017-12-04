var mongoose = require ('mongoose');
var schema = mongoose.Schema;
mongoose.connect('mongodb://localhost:27017/test');

var BOT_NAME = 'shop_assistant'

var messageSchema = new mongoose.Schema({
    from: String,
    to: String,
    createdTime: Date,
    source: String,
    payloadObject: schema.Types.Mixed
});

var messageModel = mongoose.model('Messages', messageSchema);

function saveSentMessage (payload) {
    var sentMessage = new messageModel ({
        from: BOT_NAME,
        to: payload.address.user.id,
        createdTime: new Date(),
        source: payload.source,
        payloadObject: payload
    });
    sentMessage.save(function(err){
        if (err) {
            console.log (`Error saving message: Message to ${payload.user.id}`);
        } else {
            console.log (`Message saved successfully`);
        }
    });
}

function saveIncomingMessage (payload) {
    var sentMessage = new messageModel ({
        from: payload.address.user.id,
        to: BOT_NAME,
        createdTime: new Date(),
        source: payload.source,
        payloadObject: payload
    });
    sentMessage.save(function(err){
        if (err) {
            console.log (`Error saving message: Message from ${payload.user.id}`);
        } else {
            console.log (`Message saved successfully`);
        }
    });
}

function saveToDB () {
    var m = new messageModel({
        from:'Rashid',
        to:'Kishore',
        createdTime: new Date(),
        source:'yellowmessenger',
        payloadObject: {}
    });
    m.save(function(err,message) {
        var id = message._id;
        messageModel.findOne({_id:id}).exec().then(d => {
            console.log (d);
        });
        // console.log (JSON.stringify(message));
    });
}

function checkContinue () {
    messageModel.find({}).exec().then(d => {
        console.log (d.length);
    });
}

checkContinue();

module.exports = {
    saveSentMessage: saveSentMessage,
    saveIncomingMessage: saveIncomingMessage
};
