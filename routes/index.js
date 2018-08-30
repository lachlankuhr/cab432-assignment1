// Requires
let express = require('express');
var url = require('url');
let router = express.Router();
let Songkick = require('./../songkick.js');
let fs = require('fs');
let nconf = require('nconf');
var _ = require("underscore");


// Config files
nconf.argv()
    .env()
    .file({ file: 'config.json' });

/* GET home page. */
router.get('/', function(request, response, next) {
  // Get the username from the browser
  let username = request.query.username == '' ? '' : request.query.username;
  let songkick = new Songkick(nconf.get("songkick.apikey"));

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
          return event.location;
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
});


module.exports = router;
