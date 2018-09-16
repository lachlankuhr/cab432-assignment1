// Helper function to get a reference to the map.
function getMap(theMap) {
    map = theMap;
}

// Helper function to get a reference to the initial markers.
function getMarkers(theMarkers) {
    markers = theMarkers;
}

// Set up the date range 
$(function() {
    $('input[name="daterange"]').daterangepicker({
        opens: 'right',
        locale: {
                format: 'DD/MM/YYYY'
                }
      }, function(start, end, label) {
          google.maps.event.trigger(map, 'bounds_changed');
    });
});

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

// Adds the events on the side bar for AJAX calls.
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

// Add event listens on load of the page
window.onload = function() {
    document.getElementById('searchBySimilar').addEventListener('click', function() {
        let artists = document.getElementById('simArt').innerHTML;
        $.ajax({
            type: 'GET',
            url: '/similar/?similar=' + artists,
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

    document.getElementById('singleArtistSubmit').addEventListener('click', function() {
        let artists = document.getElementById('singleArtistName').value;
        $.ajax({
            type: 'GET',
            url: '/similar/?similar=' + artists,
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

    document.getElementById('singleArtistName').addEventListener('input', function() {
        let artist = document.getElementById('singleArtistName').value;
        let suggestions = document.getElementById('artistsList');
        $.ajax({
            type: 'GET',
            url: '/predictions/?artist=' + artist,
            success: function(response) {
                suggestions.innerHTML = "";
                let artists = response.result;
                for (let i = 0; i < artists.length; i++) {
                    let option = `<option value="` + artists[i].name + `"></option>`;
                    suggestions.innerHTML = suggestions.innerHTML + option;
                }
            }
        });
    });


    $(document).ajaxStart(function(){
        $("#wait").css("display", "block");
    });

    $(document).ajaxComplete(function(){
        $("#wait").css("display", "none");
    });

}