var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var APPLICATION_ID = '5515aecd-c4a5-4653-9ece-8c37b2eddc74';
var APPLICATION_PASSWORD = 'bGyKhnsG7gxkQaa6oMxzmvf';
var connector = new builder.ChatConnector({
    appId: APPLICATION_ID,
    appPassword: APPLICATION_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages'  , connector.listen());

LUIS_APPLICATION_ID = '84e62b56-2c91-478c-b382-320a2985720e';
LUIS_SUBSCRIPTION_KEY = '51ee504e1ac14572b84a07ce9e098dbe';
LUIS_URL = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/'+LUIS_APPLICATION_ID;
function getIntentFromLuis(text, callback) {
	request.get({
		url: LUIS_URL,
		qs: {
			'subscription-key': LUIS_SUBSCRIPTION_KEY,
			'timezoneOffset':0,
			'verbose':true,
			'q': text
		},
		json: true
	}, function(error, response, data) {
		if(error) {
			callback(error);
		}else{
			callback(null, data);
		}
	});
}


// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
	getIntentFromLuis(session.message.text, function(error, luisData) {
		var intent = luisData.topScoringIntent.intent;
		var score = luisData.topScoringIntent.score;
		var entities = luisData.entities;
		if (score > 0.3 && intent != 'None'){
			if (intent == 'product lookup'){
				if(entities.length > 0){
					var products = [];
					for (var productIterator in entities){
						products.push(entities[productIterator].entity);
					}
					var message = "Sure I will show you " + products.join(', ');
					session.send(message);
				}else{
					session.send("Sure I will show you all the products!");
				}
			}else if (intent == 'location lookup'){
				// considering only first location
				if (entities.length > 0){
					var location = entities[0].entity;
			    	session.send("We have 10 stores across " + location);
				}else{
			    	session.send("We have 50 stores across the country.");
				}
			}
		}else{
		    	session.send("I did not understand you. I am still learning! Can you rephrase?");
		}
	});
});

