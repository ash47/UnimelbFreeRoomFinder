// Easily make http requests
var httpRequest = require('./httprequest.js');

// Jquery like parser for HTML
var cheerio = require('cheerio');

// For writing files
var fs = require('fs');

// The root of the building finder
var buildingRoot = 'http://le.unimelb.edu.au/';

// This page contains all the buildings we can query for info
var buildingDir = 'http://le.unimelb.edu.au/room/room-search.html';

// The root to place all files into
var staticDir = 'static/';

// Where to place building info
var buildingFileDir = 'buildings/';

// List of buildings left to cache
var toCache = [];

httpRequest.get(buildingDir, function(err, content) {
    if(err) throw err;

    // Process the pages content
    var $ = cheerio.load(content);

    // Loop over the building list
    $("#building_select fieldset .col-2 label select option").each(function() {
        // Used to grab data
        var link = $(this);

        var name = link.html();
        var dir = link.attr('value');

        // Stop invalid buildings
        if(name == '-------- Building name --------') return;

        // Add room to precache stack
        toCache.push({
            name: name,
            dir: dir
        });
    });

    // Start caching buildings
    cacheBuildings();
});

// Caches any buldings left in the toCache array
function cacheBuildings() {
    if(toCache.length <= 0) {
        return;
    }

    // Grab a building to cache
    var building = toCache.pop();

    // Tell the user what is going on
    console.log('\nCaching '+building.name+'...');

    // Request the building's page
    httpRequest.get(buildingRoot+building.dir, function(err, content) {
        if(err) throw err;

        // Process the pages content
        var $ = cheerio.load(content);

        // List of rooms
        var rooms = {};

        // Grab info on this building
        var buildInfo = $('#main-content .col-4.first ul');

        // Make sure it's on parkville campus
        if($(':nth-child(1)', buildInfo).text().indexOf('Parkville') == -1) {
            console.log(building.name+' is not on parkville campus!');
            cacheBuildings();
            return;
        }

        // Grab the building number
        var bnt = $('li', buildInfo).text();
        var buildingNumber = parseInt(bnt.substring(bnt.indexOf(':')+2));

        // Loop over each row in the table
        $('.data.col-6.first.sortable tbody tr').each(function() {
            // Grab header info
            var roomHead = $("th", this);
            var roomHeadData = roomHead.html();

            // Name and type of room
            var roomHeadName = $("a", roomHead).html();
            var roomSort = $("small a", roomHead).html();
            var subName = null;

            if(roomHeadName) {
                // Check if there is a specifc room name
                var posa = roomHeadData.indexOf('<br>');
                if(posa != -1) {
                    var posb = roomHeadData.indexOf('<br>', posa+1);
                    if(posb != -1) {
                        // Grab the subname
                        subName = roomHeadData.substring(posa+4, posb).replace(/\s+/g, ' ').substring(1);

                        // Check for a false positive
                        if(subName.indexOf('PDF') != -1) {
                            subName = null;
                        }
                    }
                }
            } else {
                roomHeadName = roomHead.text();
            }

            // Remove white space
            roomHeadName = roomHeadName.replace(/\s+/g, ' ');

            var roomNumber = roomHeadName.substring(roomHeadName.indexOf('-')+1);
            if(!roomNumber) roomNumber = roomHeadName;

            var fields = [];

            $('td', this).each(function() {
                var td = $(this);

                // Grab the data in this entry
                var data = td.html();

                var res = td.text();
                if(data.indexOf('/includes/images/tick.png') != -1) {
                    // Room has a feature
                    res = true;
                } else if(res == '-') {
                    // Room does not have a feature
                    res = false;
                } else if(data.indexOf('img') != -1) {
                    // Image of room
                    res = $('img', td).attr('src');
                }

                // Store this data
                fields.push(res);
            });

            // Create a room
            var room = {
                name: roomHeadName,
                fields: fields
            }

            // Add optional fields
            if(roomSort) room.sort = roomSort;
            if(subName) room.sub = subName;
            if(roomNumber) room.sub = subName;

            // Store the room
            rooms[roomNumber] = room;
        });

        // Store this building
        fs.writeFile(staticDir+buildingFileDir+buildingNumber+'.json', JSON.stringify(rooms), function (err) {
            if (err) throw err;
            console.log('Saved '+building.name+'!');
        });

        // Continue caching
        cacheBuildings();
    });
}
