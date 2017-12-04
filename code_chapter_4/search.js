var request = require('request');

function searchByProduct(categories, callback){

    var options = {
        method: 'POST',
        url: 'http://7m299rv0cn.algolia.net/1/indexes/products/query',
        headers: {
            'x-algolia-application-id': '7M299RV0CN',
            'x-algolia-api-key': '5e3422fe5d9733c5dd8f6da9868f6f5c'
        },
        body: '{ "params": "query=' + categories.join(' ') + '&restrictSearchableAttributes=category" }'
    };

    request(options, function (error, response, body) {
        if (error){
            callback(error);
        }else{
            var bodyJson = JSON.parse(body);
            callback(null, bodyJson.hits);
        }
    });

}



function searchByProductFilterByColor(categories, colors, callback){

    for (var i=0; i< colors.length; ++i){
        colors[i] = 'color:'+colors[i]
    }

    var filterQuery = colors.join(' OR ');

    var options = {
        method: 'POST',
        url: 'http://7m299rv0cn.algolia.net/1/indexes/products/query',
        headers: {
            'x-algolia-application-id': '7M299RV0CN',
            'x-algolia-api-key': '5e3422fe5d9733c5dd8f6da9868f6f5c'
        },
        body: '{ "params": "query=' + categories.join(' ') + '&filters='+ filterQuery +'&restrictSearchableAttributes=category" }'
    };

    request(options, function (error, response, body) {
        if (error){
            callback(error);
        }else{
            var bodyJson = JSON.parse(body);
            callback(null, bodyJson.hits);
        }
    });

}


function showAllProducts(categories, callback){

    var options = {
        method: 'POST',
        url: 'http://7m299rv0cn.algolia.net/1/indexes/products/query',
        headers: {
            'x-algolia-application-id': '7M299RV0CN',
            'x-algolia-api-key': '5e3422fe5d9733c5dd8f6da9868f6f5c'
        },
        body: '{ "params": "query=&hitsPerPage=10" }'
    };

    request(options, function (error, response, body) {
        if (error){
            callback(error);
        }else{
            var bodyJson = JSON.parse(body);
            callback(null, bodyJson.hits);
        }
    });

}

function searchStoreByCity(cities, callback){

    var options = {
        method: 'POST',
        url: 'http://7m299rv0cn.algolia.net/1/indexes/store_locations/query',
        headers: {
            'x-algolia-application-id': '7M299RV0CN',
            'x-algolia-api-key': '5e3422fe5d9733c5dd8f6da9868f6f5c'
        },
        body: '{ "params": "query=' + cities.join(' ') + '&restrictSearchableAttributes=city" }'
    };

    request(options, function (error, response, body) {
        if (error){
            callback(error);
        }else{
            var bodyJson = JSON.parse(body);
            callback(null, bodyJson.hits);
        }
    });

}


module.exports = {
    searchByProduct: searchByProduct,
    showAllProducts: showAllProducts,
    searchByProductFilterByColor:searchByProductFilterByColor,
    searchStoreByCity: searchStoreByCity
};