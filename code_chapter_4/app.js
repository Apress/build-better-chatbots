var restify = require('restify');
var builder = require('botbuilder');
var request = require('request');
var search = require('./search');
var model = require ('./model');

// Setup Restify Server
var server = restify.createServer();
server.listen(3978, function () {
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
server.post('/api/messages', connector.listen());

LUIS_APPLICATION_ID = '84e62b56-2c91-478c-b382-320a2985720e';
LUIS_SUBSCRIPTION_KEY = '51ee504e1ac14572b84a07ce9e098dbe';
LUIS_URL = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/'+LUIS_APPLICATION_ID;

// Call LUIS API to get the intent of the user message
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
					    if (entities[productIterator].type =='products'){
                            products.push(entities[productIterator].entity);
                        }
					}

					session.send("Sure I will show you " + products.join(', '));

                    session.conversationData.products = products;
                    session.save();

                    search.searchByProduct(products, function (error, productResult) {
                        sendProductInformation(session, productResult);

                        if (session.message.source == 'facebook'){
                            sendColorSuggestionFB(session, productResult);
                        }else{
                            sendColorSuggestion(session, productResult);
                        }
                    });
				}else{
					session.send("Sure I will show you all the products!");
                    search.showAllProducts(products, function (error, productResult) {
                        sendProductInformation(session, productResult);
                    });
				}
			}else if (intent == 'location lookup') {
                // considering only first location
                var cities = [];

                if (entities.length > 0) {
                    for (var locationIterator = 0; locationIterator < entities.length; ++locationIterator) {
                        var entityObject = entities[locationIterator];
                        if (entityObject.type == 'builtin.geography.city') {
                            cities.push(entityObject.entity);
                        }
                    }
                }

                if (cities.length > 0) {
                    session.send('Let me look that up for you.')
                    sendStoreList(session, cities);
                } else {
                    sendCitySuggestions(session);
                }
            }else if (intent == 'greetings') {
                session.send("Hi! I can help you find products and locate our stores. What would you like me to do?");
			} else if (intent == 'color filter') {

			    var colors = [];
                for (var colorIterator in entities){
                    if (entities[colorIterator].type == 'color'){
                        colors.push(entities[colorIterator].entity);
                    }
                }
                var productsFromContext = session.conversationData.products;

                session.send("Sure I will show you " +
                    productsFromContext.join(', ') +
                    ' in ' +
                    colors.join(' '));

                search.searchByProductFilterByColor(
                    productsFromContext,
                    colors,
                    function (error, productResult) {
                        sendProductInformation(session, productResult);
                    }
                );

            }
		}else{
		    	session.send("I did not understand you. I am still learning! Can you rephrase?");
		}
	});
});

function sendProductInformation(session, products) {

    var message = new builder.Message(session);
    message.attachmentLayout(builder.AttachmentLayout.carousel);
    var cards = [];

    for (var productIterator = 0; productIterator < products.length; ++productIterator) {
        var product = products[productIterator];

        var heroCard = new builder.HeroCard(session);

        heroCard.title(product.product_name);
        heroCard.subtitle(product.brand);
        heroCard.text("Price is " + product.price);
        heroCard.images([builder.CardImage.create(session, product.image)]);
        heroCard.buttons([builder.CardAction.imBack(session, "i want to buy " + product.category, "Buy")]);

        cards.push(heroCard);

    }


    message.attachments(cards);
    session.send(message);
}

function sendColorSuggestion(session, products){
    var colors = [];

    for (var productIterator = 0; productIterator < products.length; ++productIterator) {
        var product = products[productIterator];
        if (colors.indexOf(color) == -1){
            colors.push(product.color);
        }
    }

    var message = new builder.Message(session);
    message.attachmentLayout(builder.AttachmentLayout.carousel);

    var heroCard = new builder.HeroCard(session);
    var buttons = [];

    for (var colorIteraror = 0; colorIteraror < colors.length; ++colorIteraror) {
        var color = colors[colorIteraror];

        // To make sure the buttons are not duplicated
        var button_text = "Do you have this in " + color;
        var button = builder.CardAction.imBack(session, button_text, color);

        buttons.push(button);

    }

    heroCard.title('Here are some colors I suggest.');
    heroCard.buttons(buttons);

    message.attachments([heroCard]);
    session.send(message);

}

function sendColorSuggestionFB(session, products){
    var colors = [];


    for (var productIterator = 0; productIterator < products.length; ++productIterator) {
        var product = products[productIterator];
        colors.push(product.color);
    }

    var message = new builder.Message(session);
    var quicReplies = [];

    for (var colorIteraror = 0; colorIteraror < 10 && colorIteraror < colors.length; ++colorIteraror) {
        var color = colors[colorIteraror];

        // To make sure the buttons are not duplicated

        var quickReply = {
            "content_type":"text",
            "title": color,
            "payload":"do you have this in " + color
        }
        quicReplies.push(quickReply)

    }

    console.log(quicReplies);

    message.sourceEvent({
        facebook: {
            text: 'Here are some colors I suggest.',
            quick_replies: quicReplies
        }
    })

    session.send(message);
}

function sendStoreList(session, cities){

    var message = new builder.Message(session);
    message.attachmentLayout(builder.AttachmentLayout.carousel);
    var cards = [];

    search.searchStoreByCity(cities, function(err, stores) {
        if (stores.length > 0){
            session.send('Sure we have got stores in '+ cities.join(', '));
            for (var storeIterator=0; storeIterator < stores.length; ++storeIterator){

                var store = stores[storeIterator];

                var heroCard = new builder.HeroCard(session);

                heroCard.title(store.city);
                heroCard.text(store.street);

                cards.push(heroCard);
            }

            message.attachments(cards);
            session.send(message);

        }else{
            session.send('Sorry we do not have any stores in '+ cities.join(', '));
        }
    });

}

function sendCitySuggestions(session) {
    session.send('No city found in your query to look up our stores! But these are the cities where our stores are most popular.');

    var cityList = [
        "London",
        "Bangkok",
        "Singapore",
        "New York",
        "Kuala Lumpur",
        "Hong Kong",
        "Dubai"
    ]

    var message = new builder.Message(session);
    message.attachmentLayout(builder.AttachmentLayout.carousel);

    var heroCard = new builder.HeroCard(session);
    var buttons = [];

    for (var cityIterator = 0; cityIterator < cityList.length; ++cityIterator) {
        var city = cityList[cityIterator];

        // To make sure the buttons are not duplicated
        var button_text = "Do you have stores in " + city + '?';
        var button = builder.CardAction.imBack(session, button_text, city);

        buttons.push(button);

    }

    heroCard.title('Cities');
    heroCard.buttons(buttons);

    message.attachments([heroCard]);
    session.send(message);

}


bot.on('error', function (data) {
    console.log(data);
})

bot.on('incoming', function (data) {
    model.saveIncomingMessage (data);
    console.log('--incomingmessage--')
})

bot.on('outgoing',function(data){
    model.saveSentMessage (data);
    console.log('--outgoing message--');
})