// Requires
let express = require('express');
var url = require('url');
let router = express.Router();
let Songkick = require('./../songkick.js');
let LastFm = require('./../lastfm.js');
let nconf = require('nconf');
var _ = require("underscore");


// Config files
nconf.argv()
    .env()
    .file({ file: 'config.json' });

router.get('/predictions', function(request, response, next) {
  try {
    let artist = request.query.artist;
    if (artist != null) {
      var lf = new LastFm(nconf.get('last.fm.apikey'));
      lf.getArtists(artist, function(error, data) {
        response.send(data);
      });
    } else {
      response.send('Error.')
    }
  } catch (e) {
    response.send('Error.')
  }
});

router.get('/similar', function(request, response, next) {
  try {
    let similar = request.query.similar;
    if (similar != null) {
      let artists = similar.split(',');
      let songkick = new Songkick(nconf.get("songkick.apikey"));
      songkick.getArtistsByName(artists, function(error, artistArray) {
        songkick.getArtistsEvents(artistArray, function(error, events) {
          events = _.filter(events, function(event) {
              return event.venue.id != null;
          });
          // Just get the only artist
          // Avoids festivals where the main act might not be the
          // artist that is typed in
          if (artists.length == 1) {
            artistName = artistArray[0].displayName;
            events = _.filter(events, function(event) {
              return event.performance[0].displayName = artistName;
            });
          }
          let locations = _.chain(events)
          .map(function(event) {
            let location = event.location;
            location.venueId = event.venue.id;
            return location;
          }).uniq(function(location) {
            return location.city;
          })
          .sortBy(function(location) {
            return location.city;
          }).value();
          let data = {'locations' : locations, 'events' : events};
          response.send(data);
        });
      });
    } else {
      response.send('Error.');
    }
  } catch (e) { 
    response.send('Error.');
  }
});

// Get the nearby events
// For use in AJAX calls 
router.get('/nearby', function(request, response, next) {
  try {
    let lat = request.query.lat;
    let lng = request.query.lng;
    if (lat != null && lng != null) {
      let songkick = new Songkick(nconf.get("songkick.apikey"));
      songkick.loadMetroArea(lat, lng, function(error, locationId) {
        if (!error) {
          songkick.loadEventsInMetroArea(locationId, function(error, locations, events) {
            if (!error) {
              let nearby = {'locations' : locations, 'events' : events};
              response.send(nearby);
            } else {
              response.status(500).send("Couldn't find nearby events.");
            }
          });
        } else {
          response.status(500).send("Couldn't find nearby events.");
        }
      });
    } else {
      response.send('Error.');
    }
  } catch (e) {
    response.send('Error.');
  }
  
});

// Get event details for a particular event
// For use in AJAX calls 
router.get('/events', function(request, response, next) {
  try {
    let eventId = request.query.eventId;
    if (eventId != null) {
      let songkick = new Songkick(nconf.get("songkick.apikey"));
      var lf = new LastFm(nconf.get('last.fm.apikey'));
      songkick.getEventDetails(eventId, function(error, data) {
          if (!error) {
            let event = data.resultsPage.results.event;
            lf.getArtists(event.performance[0].displayName, function(err, artist) {
              if (!error) {
                try {
                  event.artistDetails = artist.result[0];
                  response.send(event);
                } catch (e) {
                  response.send("Error.");
                }
              }
            });
          }
      });
    } else {
      response.send('Error.');
    }
  } catch (e) {
    response.send('Error.');
  }
});

// Get the similar artists for a particular artist 
// For use in AJAX calls 
router.get('/populate', function(request, response, next) {
   try { 
    let artist = request.query.artist;
    if (artist != null) {
      var lf = new LastFm(nconf.get('last.fm.apikey'));
      lf.getSimilarArtists(artist, function (err, data) {
        if (data === undefined) {
          response.send("Error.");
        } else {
          let artists = data.artist;
          // Trim the data before sending to client side.
          if (artists.length > 15) {
            artists.length = 15;
          } 
          response.send(artists);
        }
      });
    } else {
      response.send('Error.');
    }
  } catch (e) {
     response.send('Error.');
  }
});

/* GET home page. */
router.get('/', function(request, response, next) {
  try {
    // Get the username from the browser
    let username = request.query.username == undefined ? '' : request.query.username;
    let songkick = new Songkick(nconf.get("songkick.apikey"));
    // Just render the page without doing anything server side
    if (username == '') {
      response.render("index", {
        artists: 0,
        events: 0,
        locations: 0,
        countries: 0,
        google: {
          maps: {
            apikey: nconf.get("google.maps.apikey")
          }
        }
      });
      return 0;
    }

    songkick.getTrackedArtists(username, function(error, artists) {
      songkick.getArtistsEvents(artists, function(error, events) {
        events.forEach(function(event) {
          event.isFestival = event.type === "Festival";

          let performances = _.partition(event.performance, function(performance) {
            return _.some(artists, function(artist) {
              return artist.id === performance.artist.id;
            });
          });

          event.performance = performances[0];
          event.performanceByOtherArtists = performances[1];
        });

        var locations = _.chain(events)
          .map(function(event) {
            let location = event.location;
            location.venueId = event.venue.id;
            return location;
          }).uniq(function(location) {
            return location.city;
          })
          .sortBy(function(location) {
            return location.city;
          }).value();

        var countries = _.chain(locations)
          .map(function(location) {
            var cityParts = location.city.split(", ");
            return cityParts[cityParts.length - 1];
          })
          .uniq()
          .sortBy()
          .value();

        response.render("index", {
          artists: artists,
          events: events,
          locations: locations,
          countries: countries,
          google: {
            maps: {
              apikey: nconf.get("google.maps.apikey")
            }
          }
        });
      });
    });
  } catch (e) {
    // Just render the bare bones page 
    response.render("index", {
      artists: 0,
      events: 0,
      locations: 0,
      countries: 0,
      google: {
        maps: {
          apikey: nconf.get("google.maps.apikey")
        }
      }
    });
  }
});


module.exports = router;
