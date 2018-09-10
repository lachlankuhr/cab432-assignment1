// Module for Songkick requests
// Requires
let HTTPError = require('node-http-error');
let async = require("async");
let request = require('request');
let _ = require("underscore");


// Constructor
function Songkick(apiKey) {
    Songkick.prototype.apiKey = apiKey;
}

/* 
* Load the artists for the username specified
* Loading is making the REST request
*/
loadTrackedArtists = function(username, callback) {
    request("http://api.songkick.com/api/3.0/users/" + username + "/artists/tracked.json?apikey=" + Songkick.prototype.apiKey + "&per_page=all", function(error, response, body) {
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

getArtistByName = function(artistName, callback) {
    request("https://api.songkick.com/api/3.0/search/artists.json?apikey=" + "8AtK550RMQAmwyC8" + "&query=" + encodeURI(artistName), function(error, response, body) {
        if (JSON.parse(body).resultsPage.totalEntries != 0 && JSON.parse(body).resultsPage.status != "error") {
            let artist = JSON.parse(body).resultsPage.results.artist[0];
            callback(null, artist);
        } else {
            console.log("No artist of that name could be found.")
            let err = true;
            callback(err);
        } 
    });
}

Songkick.prototype.getArtistsByName = function(artistsName, callback) {
    let artistArray = [];
    let counter = 0;
    _.each(artistsName, function(artistName) {
        getArtistByName(artistName, function(error, artist) {
            counter = counter + 1;
            if (error == null) {
                artistArray.push(artist);
            } 
            if (counter == artistsName.length) {
                callback(null, artistArray);
            }
        })
    });

}

/*
* Load the artists events for a given artist
* Loading is making the REST request
*/ 
loadArtistEvents = function(artist, page, callback) {
    request("http://api.songkick.com/api/3.0/artists/" + artist.id + "/calendar.json?apikey=" + Songkick.prototype.apiKey + "&per_page=50&page=" + page, function(error, response, body) {
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
 * Load metro areas close to a {lat, long}. 
 */
Songkick.prototype.loadMetroArea = function(lat, lng, callback) {
    request("https://api.songkick.com/api/3.0/search/locations.json?location=geo:" + lat + "," + lng + "&apikey=" + Songkick.prototype.apiKey + "&per_page=50", function(error, response, body) {
        let locationId;
        console.log(Object.keys(JSON.parse(body).resultsPage.results).length);
        console.log(Object.keys(JSON.parse(body).resultsPage.results).length == 0);
        if (Object.keys(JSON.parse(body).resultsPage.results).length != 0) {
            locationId = JSON.parse(body).resultsPage.results.location[0].metroArea.id;
        }
        
        console.log(locationId);
        callback(error, locationId);
    });
 }

 /*
 * Load the events happening in a metro area.
 */
Songkick.prototype.loadEventsInMetroArea = function(locationId, callback) {
    request("https://api.songkick.com/api/3.0/metro_areas/" + locationId + "/calendar.json?apikey=" + Songkick.prototype.apiKey + "&per_page=50", function(error, response, body) {
        let eventsJson = JSON.parse(body).resultsPage.results.event;
        // GET RID OF ANY EVENTS WITH A VENUE ID OF NULL
        // FUCKING SONGKICK!! WWHYYYY???????????????????????????
        let events = _.filter(eventsJson, function(event) {
            return event.venue.id != null;
        });
        
        let locations = _.chain(events)
            .map(function(event) {
                let location = event.location;
                location.venueId = event.venue.id;
                return location;
            }).filter(function(location) {
                return location.venueId != null;
            }).uniq(function(location) {
                return location.city;
            })
            .sortBy(function(location) {
                return location.city;
            }).value();
        callback(error, locations, events);
    });
 }

/*
* Gets the event details
*/
Songkick.prototype.getEventDetails = function(eventId, callback) {
    request("https://api.songkick.com/api/3.0/events/" + eventId + ".json?apikey=" + Songkick.prototype.apiKey, function(error, response, body) {
        if (error) {
            return callback(error);
        }
        if (response.statusCode != 200) {
            return callback(new HTTPError(response.statusCode, response.statusMessage), null);
        }
        callback(null, JSON.parse(body));
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