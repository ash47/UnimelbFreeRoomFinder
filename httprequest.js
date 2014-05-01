var http = require('http');

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

// Define exports
exports.get = get;
