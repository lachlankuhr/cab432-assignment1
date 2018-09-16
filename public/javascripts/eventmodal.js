// Reset the event information modal so that it doesn't display old information 
// prior to finishing the AJAX request
function ResetEventModal() {
    document.getElementById('artistPicture').src = "";
    document.getElementById('simArt').innerHTML = "Loading...";
    document.getElementById('urlLink').href = "Loading...";
    document.getElementById('urlLink').innerHTML = "Loading...";
    document.getElementById('modelTitle').innerHTML = "Loading...";
    document.getElementById('startDate').innerHTML = "Loading...";
    document.getElementById('venueLocation').innerHTML = "Loading...";
}

// AJAX for event information.
// Saves having a page refresh which delivers a large payload and is served in
// quite a large amount of time.
// Opens a modal.
$(document).on('click', '.button', function () {
    // TODO (if time permits): improve the below logic 
    let regex = RegExp(/[0-9]+/);
    // Now find the event ID by regex
    let eventId = regex.exec(this.id)[0]; 
    let artistId = regex.exec(this.id)[0] + 'Artist';
    let artist = document.getElementById(artistId).innerHTML;

    // Reset the modal so it doesn't display old information
    ResetEventModal();
    
    // Get the similar artists by calling the LastFM API.
    $.ajax({
        type: 'GET',
        url: '/populate/?artist=' + encodeURI(artist),
        success: function(artists) {
            let similiarArtists = "";
            try {
                $.each(artists, function(i, artist) {
                    // To remove the last comma
                    if (i == artists.length - 1) {
                        similiarArtists = similiarArtists + artist.name;
                    } else {
                        similiarArtists = similiarArtists + artist.name + ",";
                    }
                });
            } catch (e) {
                similiarArtists = "Couldn't find similar artists.";
            }
            if (artists.length == 0) {
                similiarArtists = "Couldn't find similar artists.";
            }
            
            document.getElementById('simArt').innerHTML = similiarArtists;
        }
    });

    // Get the event details by calling SongKick API.
    $.ajax({
        type: 'GET',
        url: '/events/?eventId=' + encodeURI(eventId),
        success: function(event) {
            // Title
            document.getElementById('modelTitle').innerHTML = event.displayName;

            // Start date and time:
            document.getElementById('startDate').innerHTML = event.start.date;

            // Venue location: 
            document.getElementById('venueLocation').innerHTML = event.location.city;

            // Event link
            document.getElementById('urlLink').href = event.uri;
            document.getElementById('urlLink').innerHTML = event.uri;

            try {
                let picture = event.artistDetails.images[event.artistDetails.images.length - 1];
                document.getElementById('artistPicture').src = picture;
            } catch (e) {
                document.getElementById('artistPicture').src = '#';
            }
        }
    });

});