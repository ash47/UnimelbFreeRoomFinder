var http = require('http');
var https = require('https');
var querystring = require('querystring');

// Gets a given page
function get(page, callback) {
    // Request the page (this will have a link to rooms)
    var content = '';
    http.get(page, function(res) {
        res.on('data', function(chunk) {
            content += chunk;
        }).on('end', function() {
            // Run the callback
            callback(null, content);
        })
    }).setTimeout(10000, function() {
        // Parse an error to the callback
        callback(new Error('Request timed out!'));
    });
}

var cookie;

function request(options, callback, postData) {
    if(!options) {
        callback(new Error("Invalid argument 1 options"))
        return false
    }

    console.log('\n\n\nMaking a new request!');

    // Fill in missing info
    options.port = options.port || 443;
    options.path = options.path || "/";
    options.method = options.method || "POST";
    options.headers = options.headers || {};

    if(postData) {
        console.log('INCOING POST DATA!\N\N\N');
        // Convert from object to post data
        //postData = 'Post: '+postData;

        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = postData.length;
    }

    if(cookie) {
        options.headers['Cookie'] = cookie;
    }
    //options.headers.Cookie = cookie;

    var req = https.request(options, function(res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));

        cookie = res.headers['set-cookie'];
        if(cookie) {
            cookie = (cookie + "").split(";").shift();
            console.log("Got a cookie! "+cookie);
        }

        var content = '';
        res.on('data', function (chunk) {
            content += chunk;
        }).on('end', function() {
            callback(null, content);
        });
    });

    // Add post data
    if(postData) {
        req.write(postData);
        console.log('\n\n\nPost: '+postData);
    }

    // End the request
    req.end();
}

// Define exports
exports.get = get;
exports.request = request;
