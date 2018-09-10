// Helper function to get a reference to the map.
function getMap(theMap) {
    map = theMap;
}

// Helper function to get a reference to the initial markers.
function getMarkers(theMarkers) {
    markers = theMarkers;
}

// Reset the event information modal so that it doesn't display old information 
// prior to finishing the AJAX request
function ResetEventModal() {
    document.getElementById('simArt').innerHTML = "";
    document.getElementById('urlLink').href = "";
    document.getElementById('urlLink').innerHTML = "";
    document.getElementById('modelTitle').innerHTML = "";
    document.getElementById('startDate').innerHTML = "";
    document.getElementById('venueLocation').innerHTML = "";
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
            $.each(artists, function(i, artist) {
                // To remove the last comma
                if (i == artists.length - 1) {
                    similiarArtists = similiarArtists + artist.name;
                } else {
                    similiarArtists = similiarArtists + artist.name + ",";
                }
            })
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

        }
    });

});

// Add event listener for the 'bounds_changed' event.
function mapListener(map, markers) {
    map.addListener('bounds_changed', function() {
            // Get all the events in the sidebar
            let events = document.querySelectorAll('#sidebar > .event');
            // Remove them all
            for (var event = 0; event < events.length; event++) {
                events[event].style.display = "none";
            }
            // Add back only the ones that are within the maps current bounding box
            for (var marker = 0; marker < markers.length; marker++) {
                if( map.getBounds().contains(markers[marker].getPosition()) ){ // check if MARKER within the map bounding box
                    let inViewVenues = document.getElementsByClassName(markers[marker].venueId); // find the events with the same venue location as the marker
                    for (var venues = 0; venues < inViewVenues.length; venues++) {
                        inViewVenues[venues].style.display = "block"; // display those markers
                    }
                }
            }
            // Filter by date
            filterByDate();
        });
}

// Filter by the date range input.
function filterByDate() {
    let start = $('#daterange').data('daterangepicker').startDate;
    let end = $('#daterange').data('daterangepicker').endDate;
    let events = document.querySelectorAll('#sidebar > .event');
    for (var event = 0; event < events.length; event++) {
        let date = document.getElementById(events[event].id + "Date").innerHTML;
        if (!moment(date).isBetween(start, end)) {
          events[event].style.display = "none";
        }
    }
}

// Add the markers to the map.
function addMarkers(map, markers, locations) {
    // Add each marker
    for (var i = 0; i < locations.length; i++) {
        var marker = new google.maps.Marker({
            position: {lat: locations[i].lat, lng: locations[i].lng},
            map: map,
            title: locations[i].city
        });
        marker.addListener('click', function() {
            // TODO (if time permits: add a information box about the venue
            // that appears on click and disappears after bounds change event)
        });
        markers.push(marker);
        marker.venueId = locations[i].venueId;
    }
}

// Add the search by area button to overlay with the map
function CenterControl(controlDiv, map) {
    // Copied from the Google Maps API documentation 
    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to find more events in the current map region.';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Find Events Here!';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago
    controlUI.addEventListener('click', function() {
        let lat = map.getCenter().lat();
        let lng = map.getCenter().lng();
        $.ajax({
            type: 'GET',
            url: '/nearby/?lat=' + lat + '&lng=' + lng,
            success: function(response) {
                console.log(response);
                addMarkers(map, markers, response.locations);
                let events = response.events;
                for (let i = 0; i < events.length; i++) {
                    GenerateEventSidebar(events[i]);
                }
                google.maps.event.trigger(map, 'bounds_changed');
            }
        });
    });
}
 // TODO: UPDATE THIS WHEN THE PUG MIXIN IS UPDATED. 
function GenerateEventSidebar(event) {
    let venueId = event.venue.id;
    let eventId = event.id;
    let dateId = eventId + 'Date';
    let buttonId = eventId + 'Button';
    let artistId = eventId + 'Artist';
    eventHtml = 
    `<div class="row event ` + venueId + `" id="` + eventId + `">
        <div class="col-12">
            <div class="row">
                <div class="col-7 artist" id="` + artistId + `">` +
                    event.performance[0].displayName + 
                `</div>
                <div class="col-5">` + event.type +  `</div>
            </div>
            <div class="row">` + event.location.city + `</div>
            <div class="row">
                <div class="date col-6" id="` + dateId + `">` + event.start.date + `</div>
                    <div class="col-6" style="float:right;">
                        <button class="btn btn-info btn-sm button" type="button" data-toggle="modal" data-target="#eventDetails" id="` + buttonId + `">More info</button>
                    </div>
                </div>
        </div>
    </div>`;
    $('#sidebar').append(eventHtml);
}

window.onload = function() {
    document.getElementById('searchBySimilar').addEventListener('click', function() {
        let artists = document.getElementById('simArt').innerHTML;
        console.log(artists);
        $.ajax({
            type: 'GET',
            url: '/similar/?similar=' + artists,
            success: function(response) {
                console.log(response);
                addMarkers(map, markers, response.locations);
                let events = response.events;
                for (let i = 0; i < events.length; i++) {
                    GenerateEventSidebar(events[i]);
                }
                google.maps.event.trigger(map, 'bounds_changed');
            }
        });
    });

    document.getElementById('singleArtistSubmit').addEventListener('click', function() {
        let artists = document.getElementById('singleArtistName').value;
        console.log(artists);
        $.ajax({
            type: 'GET',
            url: '/similar/?similar=' + artists,
            success: function(response) {
                console.log(response);
                addMarkers(map, markers, response.locations);
                let events = response.events;
                for (let i = 0; i < events.length; i++) {
                    GenerateEventSidebar(events[i]);
                }
                google.maps.event.trigger(map, 'bounds_changed');
            }
        });
    });
}