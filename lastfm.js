const LastFM = require('last-fm');

function LastFm(apikey) {
    LastFm.prototype.apiKey = apikey;
}

LastFm.prototype.getSimilarArtists = function(artist, callback) {
    const last = new LastFM(LastFm.prototype.apiKey);
    last.artistSimilar({'name': artist}, (err, data) => {
        callback(err, data);
    });
}

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