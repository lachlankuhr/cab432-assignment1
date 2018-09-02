function getMap(theMap) {
    map = theMap;
}

function getMarkers(theMarkers) {
    markers = theMarkers;
}


$(document).on('click', '.button', function () {
    let regex = RegExp(/[0-9]+/);
    let eventId = regex.exec(this.id)[0];
    let artistId = regex.exec(this.id)[0] + 'Artist';
    let artist = document.getElementById(artistId).innerHTML;
    document.getElementById('simArt').innerHTML = "";

    $.ajax({
        type: 'GET',
        url: '/populate/?artist=' + encodeURI(artist),
        success: function(artists) {
            let str = "";
            $.each(artists, function(i, artist) {
                str = str + artist.name + ", ";
            })
            document.getElementById('simArt').innerHTML = str;
        }
    });
    $.ajax({
        type: 'GET',
        url: '/events/?eventId=' + encodeURI(eventId),
        success: function(event) {
            document.getElementById('modelTitle').innerHTML = event.displayName;
            document.getElementById('urlLink').href = event.uri;
        }
    });

});

function mapListener(map, markers) {
    map.addListener('bounds_changed', function() {
        console.log('Hi');
            let events = document.querySelectorAll('#sidebar > .event');
            for (var event = 0; event < events.length; event++) {
                events[event].style.display = "none";
            }
            for (var marker = 0; marker < markers.length; marker++) {
                if( map.getBounds().contains(markers[marker].getPosition()) ){
                    let inViewVenues = document.getElementsByClassName(markers[marker].venueId);
                    for (var venues = 0; venues < inViewVenues.length; venues++) {
                        inViewVenues[venues].style.display = "block";
                    }
                }
            }
            filterByDate();
        });
}

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

function addMarkers(map, markers, locations) {
    for (var i = 0; i < locations.length; i++) {
        var marker = new google.maps.Marker({
            position: {lat: locations[i].lat, lng: locations[i].lng},
            map: map,
            title: locations[i].city
        });
        marker.addListener('click', function() {
            console.log('Hello');
        });
        markers.push(marker);
        marker.venueId = locations[i].venueId;
    }
}

function CenterControl(controlDiv, map) {

    // Set CSS for the control border.
    var controlUI = document.createElement('div');
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.cursor = 'pointer';
    controlUI.style.marginBottom = '22px';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to recenter the map';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
    controlText.style.fontSize = '16px';
    controlText.style.lineHeight = '38px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = 'Center Map';
    controlUI.appendChild(controlText);

    // Setup the click event listeners: simply set the map to Chicago.
    controlUI.addEventListener('click', function() {
      map.setCenter(chicago);
    });

  }