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

// Initilaise map 
function generateMap(locations) {
    var myLatLng = {lat: 0, lng: 15};
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 3,
      center: myLatLng
    });
    // Get the map to client side
    getMap(map);
    let markers = [];
    // Add the markers to the map
    addMarkers(map, markers, locations);
    // Add the listener to update side bar as bounds change
    mapListener(map, markers);
    // Get the markers
    getMarkers(markers);

    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, map);

    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
}

// Add the markers to the map.
function addMarkers(map, markers, locations) {
    // Add each marker
    for (var i = 0; i < locations.length; i++) {
        if (locations[i].lat == null || locations[i].lng == null) {
            continue;
        }
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
        // Google Maps API
        let lat = map.getCenter().lat();
        let lng = map.getCenter().lng();
        $.ajax({
            type: 'GET',
            url: '/nearby/?lat=' + lat + '&lng=' + lng,
            success: function(response) {
                addMarkers(map, markers, response.locations);
                let events = response.events;
                for (let i = 0; i < events.length; i++) {
                    if (document.getElementById(events[i].id) == null) {
                        GenerateEventSidebar(events[i]);
                    }
                }
                google.maps.event.trigger(map, 'bounds_changed');
            }
        });
    });
}

