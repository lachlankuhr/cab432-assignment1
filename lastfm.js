// Using a wrapper
const LastFM = require('last-fm');

// Constructor
// Contain the SongKick API key for exportation
function LastFm(apikey) {
    LastFm.prototype.apiKey = apikey;
}

/* 
* Finds similar artists to the specified artist.
* @param artist - The artist name. 
* @param callback - The callback takes the parameters of error and data. 
*/
LastFm.prototype.getSimilarArtists = function(artist, callback) {
    const last = new LastFM(LastFm.prototype.apiKey);
    last.artistSimilar({'name': artist}, (err, data) => {
        if (err) {
            return callback(true);
        } else {
            callback(err, data);
        }
    });
}

/* 
* Load the artist details. 
* Useful for finding descriptions + images.  
* @param artist - The artist name . 
* @param callback - The callback takes the parameters of error and data. 
*/
LastFm.prototype.getArtists = function(artist, callback) {
    const last = new LastFM(LastFm.prototype.apiKey);
    last.artistSearch({'q': artist, 'limit' : 5}, (err, data) => {
        // Check server side processing okay
        if (err) {
            return callback(true);
        } else {
            callback(null, data);
        }
    });
}

module.exports = LastFm;