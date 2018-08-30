// Module for Songkick requests
// Requires
let fs = require('fs');
let nconf = require('nconf');
let HTTPError = require('node-http-error');
let async = require("async");
let request = require('request');
let _ = require("underscore");


// Config files
nconf.argv()
    .env()
    .file({ file: 'config.json' });

// Constructor
function Songkick(apiKey) {
}

/* 
* Load the artists for the username specified
* Loading is making the REST request
*/
loadTrackedArtists = function(username, callback) {
    request("http://api.songkick.com/api/3.0/users/" + username + "/artists/tracked.json?apikey=" + nconf.get("songkick.apikey") + "&per_page=all", function(error, response, body) {
    // Handle the error
    if (error) {
        return callback(error);
    }
    // Handle there being no such user
    if (response.statusCode == 404) {
        return callback(new NoSuchUserError());
    }
    // Handle the HTTP errors. 
    if (response.statusCode != 200) {
        return callback(new HTTPError(response.statusCode, response.statusMessage), null);
    }
    // Callback with the data 
    callback(null, JSON.parse(body), new Date());
    });
}
/*
* Load the artists events for a given artist
* Loading is making the REST request
*/ 
loadArtistEvents = function(artist, page, callback) {
    request("http://api.songkick.com/api/3.0/artists/" + artist.id + "/calendar.json?apikey=" + nconf.get("songkick.apikey") + "&per_page=50&page=" + page, function(error, response, body) {
        if (error) {
            return callback(error);
        }
        if (response.statusCode != 200) {
            return callback(new HTTPError(response.statusCode, response.statusMessage), null);
        }
        callback(null, JSON.parse(body), new Date());
    });
}

/*
* Gets the tracks artist array
*/
Songkick.prototype.getTrackedArtists = function(username, callback) {
    loadTrackedArtists(username, function(error, data) {
        if (error) {
            return callback(error);
        }

        var artists = data.resultsPage.results.artist;

        callback(null, artists);
    })
}

/*
* Gets an artist events. 
*/
Songkick.prototype.getArtistEvents = function(artist, callback) {
    let events = [];
    let page = 0;
    let perPage;
    let totalEntries;

    async.doWhilst(
        function(callback) {
          loadArtistEvents(artist, page + 1, function(error, data) {
            if (error) {
              return callback(error);
            }
    
            events = events.concat(data.resultsPage.results.event || []);
            page = data.resultsPage.page;
            perPage = data.resultsPage.perPage;
            totalEntries = data.resultsPage.totalEntries;
    
            callback();
          });
        },
        function() {
          return (totalEntries > page * perPage);
        },
        function(error) {
          callback(error, events);
        }
      );
}

/*
* Gets all the artists events for a user
* Design to be used in conjunction with a username
*/

Songkick.prototype.getArtistsEvents = function(artists, callback) {
    var _this = this;
  
    var events = [];
  
    async.eachLimit(artists, 10, function(artist, callback) {
      _this.getArtistEvents(artist, function(error, artistEvents) {
        if (error) {
          return callback(error);
        }
        events = events.concat(artistEvents);
        callback();
      });
    },
    function(error) {
      if (error) {
        return callback(error);
      }
      events = _.uniq(events, function(event) {
        return event.id;
      });
      events = _.sortBy(events, function(event) {
        return event.start.date;
      });
      callback(null, events);
    });
}

function NoSuchUserError(message) {
    Error.call(this);
    this.message = message;
}

module.exports = Songkick;