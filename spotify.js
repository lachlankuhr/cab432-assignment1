let SpotifyWebApi = require('spotify-web-api-node');

// Constructor
function Spotify(client, secret) {
    Spotify.prototype.client = client;
    Spotify.prototype.secret = secret;
}
 
// credentials are optional
var spotifyApi = new SpotifyWebApi({
  clientId: Spotify.prototype.client,
  clientSecret: Spotify.prototype.secret
});

Spotify.prototype.getArtistByName = function(artistName) {
    spotifyApi.searchArtists(artistName)
    .then(function(data) {
        console.log(data.body);
    }, function(err) {
        console.log(err);
    });
}

module.exports = Spotify;