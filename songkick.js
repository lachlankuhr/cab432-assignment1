// Module for Songkick requests
// Requires
let HTTPError = require('node-http-error');
let async = require("async");
let request = require('request');
let _ = require("underscore");


// Constructor
// Contain the SongKick API key for exportation
function Songkick(apiKey) {
    Songkick.prototype.apiKey = apiKey;
}

/* 
* Load the artists for the username specified.
* Method requests for all the artists the user follows. 
* The data for this method is then passed to find the events for each artist. 
* @param username - The username of the SongKick user for which the followed artists are to be determined. 
* @param callback - The callback takes the parameters of error and data. 
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
    // Try to handle the received data 
    try {
        callback(null, JSON.parse(body), new Date());
    } catch (e) {
        callback(true);
    }
    });
}

/* 
* Gets the artist by provided an artist name. 
* The API returns a list of potential artists from the artist name provided. For simplicity and best results, the true artist is assumed to be the first artist in this list. 
* Useful for parsing user input of artist name. 
* Provides artist ID. 
* @param artistName - The name of the artist for which the artist ID (and other details) which to be determined. 
* @param callback - The callback takes the parameters of error and data. 
*/
getArtistByName = function(artistName, callback) {
    request("https://api.songkick.com/api/3.0/search/artists.json?apikey=" + Songkick.prototype.apiKey + "&query=" + encodeURI(artistName), function(error, response, body) {
    // Handle the error
    if (error) {
        return callback(error);
    }
    // Handle the HTTP errors. 
    if (response.statusCode != 200) {
        return callback(new HTTPError(response.statusCode, response.statusMessage), null);
    }
    try {
        if (JSON.parse(body).resultsPage.totalEntries != 0 && JSON.parse(body).resultsPage.status != "error") {
            let artist = JSON.parse(body).resultsPage.results.artist[0]; // take the first artist
            callback(null, artist);
        } else {
            console.log("No artist of that name could be found.")
            let err = true;
            callback(err);
        } 
    } catch (e) {
        callback(true);
    }
    });
}

/*
* Iterates through an array of artist names.  Returns the artist details for each artist name as an array. 
* The details include the artist ID. 
* @param artistsName - An array of artist names. 
* @param callback - The callback takes the parameters of error and data. 
*/
Songkick.prototype.getArtistsByName = function(artistsName, callback) {
    let artistArray = [];
    let counter = 0;
    _.each(artistsName, function(artistName) {
        getArtistByName(artistName, function(error, artist) {
            counter = counter + 1;
            if (error == null) {
                artistArray.push(artist);
            } 
            // Check to see when each artist has been processed.
            // Since getArtistByName is asynchronous, the order of  
            // artistArray might not (likely) match that of artistsName.
            if (counter == artistsName.length) {
                callback(null, artistArray);
            }
        })
    });

}

/*
* Load the artists events for a given artist. 
* Loading is making the REST request
* @param artist - The artist details.  These artists details must be obtained via the SongKick API in order to get the artist ID. 
* @param callback - The callback takes the parameters of error and data. 
*/ 
loadArtistEvents = function(artist, page, callback) {
    request("http://api.songkick.com/api/3.0/artists/" + artist.id + "/calendar.json?apikey=" + Songkick.prototype.apiKey + "&per_page=50&page=" + page, function(error, response, body) {
        // Handle the error
        if (error) {
            return callback(error);
        }
        // Handle the HTTP errors. 
        if (response.statusCode != 200) {
            return callback(new HTTPError(response.statusCode, response.statusMessage), null);
        }
        try {
            callback(null, JSON.parse(body), new Date());
        } catch (e) {
            callback(true);
        }
    });
}

/*
 * Load metro areas close to a {lat, long}. 
 * For simplicity and to reduce the number of locations, the first of the most nearby metro areas is returned. 
 * @param lat - The latitude. 
 * @param lngn - The longitude. 
 * @param callback - The callback takes the parameters of error and data. The callback will likely be loadEventsInMetroArea.
 */
Songkick.prototype.loadMetroArea = function(lat, lng, callback) {
    request("https://api.songkick.com/api/3.0/search/locations.json?location=geo:" + lat + "," + lng + "&apikey=" + Songkick.prototype.apiKey + "&per_page=50", function(error, response, body) {
        // Handle the error
        if (error) {
            return callback(error);
        }
        // Handle the HTTP errors. 
        if (response.statusCode != 200) {
            return callback(new HTTPError(response.statusCode, response.statusMessage), null);
        }
        // Try and parse the returned data
        try {
            let locationId;
            if (Object.keys(JSON.parse(body).resultsPage.results).length != 0) {
                locationId = JSON.parse(body).resultsPage.results.location[0].metroArea.id; // only take the first 
            }
            callback(null, locationId);
        } catch (e) {
            callback(true);
        }
    });
 }

 /*
 * Load the events happening in a metro area. 
 * Used as a callback for loadMetroArea.  Uses the location ID. 
 * @param locationId - the location ID obtained from calling loadMetroArea. 
 * @param callback - The callback takes the parameters of error and data. 
 */
Songkick.prototype.loadEventsInMetroArea = function(locationId, callback) {
    request("https://api.songkick.com/api/3.0/metro_areas/" + locationId + "/calendar.json?apikey=" + Songkick.prototype.apiKey + "&per_page=50", function(error, response, body) {
    // Handle the error
    if (error) {
        return callback(error);
    }
    // Handle the HTTP errors. 
    if (response.statusCode != 200) {
        return callback(new HTTPError(response.statusCode, response.statusMessage), null);
    }
    // Try and parse the returned data
    try {
        let eventsJson = JSON.parse(body).resultsPage.results.event;
        // Remove any events with a venue ID of null. 
        // TODO: Ask SongKick WHY they would do this.
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
        callback(null, locations, events);
    } catch (e) {
        callback(true);
    }
    });
 }

/*
* Gets the event details provided an event. 
* Method is used for provided additional details for a particular event in the information modal. 
* The event ID can be generated from loadArtistEvents, loadEventsInMetroArea, and eventsForArtist. 
* @param eventId - ID for the event. 
* @param callback - The callback takes the parameters of error and data. 
*/
Songkick.prototype.getEventDetails = function(eventId, callback) {
    request("https://api.songkick.com/api/3.0/events/" + eventId + ".json?apikey=" + Songkick.prototype.apiKey, function(error, response, body) {
        // Handle the error
        if (error) {
            return callback(error);
        }
        // Handle the HTTP error.
        if (response.statusCode != 200) {
            return callback(new HTTPError(response.statusCode, response.statusMessage), null);
        }
        try {
            callback(null, JSON.parse(body));
        } catch (e) {
            callback(true);
        }
    });
}

/*
* Gets the tracked artist array. 
* Processes artists array that is returned by loadTrackedArtists. 
*/
Songkick.prototype.getTrackedArtists = function(username, callback) {
    loadTrackedArtists(username, function(error, data) {
        // Try to process the data.
        try {
            var artists = data.resultsPage.results.artist;
            callback(null, artists);
        } catch (e) {
            callback(true);
        }
    })
}

/*
* Gets an artist events. 
* Processes the data into the required form. 
* @param callback - The callback takes the parameters of error and data. 
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
* Gets all the events for a an array of artists. 
* @param artists - An array of artist details.  Must have field of artist ID. 
* @param callback - The callback takes the parameters of error and data. 
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

// Generate error for no such user being found. 
function NoSuchUserError(message) {
    Error.call(this);
    this.message = message;
}

module.exports = Songkick;