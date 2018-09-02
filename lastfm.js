const LastFM = require('last-fm')

function LastFm(apikey) {
    LastFm.prototype.apiKey = apikey;
}

LastFm.prototype.getSimilarArtists = function(artist, callback) {
    const last = new LastFM(LastFm.prototype.apiKey);
    last.artistSimilar({'name': artist}, (err, data) => {
        callback(err, data);
    })
}

module.exports = LastFm;