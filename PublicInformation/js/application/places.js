// CREATE PLACES ITEM
function createPlacesListItem(i) {
    // DEFAULT VARS //
    var html = '';
    // LIST HTML
    html += '<li data-index="' + i + '" class="layer placesItem sharedItem checked">';
    html += '<span class="placesIcon placesClick"></span><span class="title placesClick">' + configOptions.bookmarks[i].name.replace(/[\-_]/g, " ") + '</span>';
    html += '</li>';
    // INSERT LIST ITEM
    var node = dojo.byId('placesList');
    if (node) {
        dojo.place(html, node, "last");
    }
    zebraStripe(dojo.query('#placesList li.layer'));
}

// ZOOM TO LOCATION: ZOOMS MAP TO LOCATION POINT
function zoomToLocation(x, y, IPAccuracy) {
    var lod = 16;
    // set point
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(x, y));
    // zoom and center
    map.centerAndZoom(pt, lod);
}

// GEOLOCATION ERROR
function geoLocateMapError(error) {
    console.log(error);
}

// GEOLOCATE FUNCTION: SETS MAP LOCATION TO USERS LOCATION
function geoLocateMap(position) {
    if (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var IPAccuracy = position.coords.accuracy;
        zoomToLocation(longitude, latitude, IPAccuracy);
    }
}

// GEOLOCATE ITEM
function createGeolocateItem() {
    var html = '<li title="' + i18n.viewer.places.myLocationTitle + '" id="geoLocate" class="layer placesItem"><span class="placesIcon"></span><span class="title">' + i18n.viewer.places.myLocation + '</span></li>';
    var node = dojo.byId('placesList');
    if (node) {
        dojo.place(html, node, "last");
    }
}

// CONFIGURE PLACES
function placesOnClick() {
    // PLACES CLICK
    dojo.query(document).delegate("#placesList .placesClick", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            objIndex = dojo.query(this).parent().attr('data-index');
            if (objIndex !== -1) {
                // CREATE EXTENT
                var newExtent = new esri.geometry.Extent(configOptions.bookmarks[objIndex].extent);
                // SET EXTENT
                map.setExtent(newExtent);
            }

        }
    });
    // GEOLOCATE CLICK
    dojo.query(document).delegate("#geoLocate .title, #geoLocate .placesIcon", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            navigator.geolocation.getCurrentPosition(geoLocateMap, geoLocateMapError, {
                maximumAge: 3000,
                timeout: 5000,
                enableHighAccuracy: true
            });
        }
    });
    // PLACES CLICK
    dojo.query(document).delegate("#placesButton", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleMenus('places');
        }
    });
}

// CONFIGURE PLACES
function configurePlaces() {
    // IF PLACES
    if (configOptions.showPlaces) {
        // INSERT PLACES BUTTON
        var node = dojo.byId('placesCon');
        if (node) {
            node.innerHTML = '<span id="placesButton" class="barButton" data-menu="places" title="' + i18n.viewer.places.placesTitle + '">' + i18n.viewer.places.places + '<span class="arrow"></span></span>';
        }
        // CREATE LIST
        node = dojo.byId('placesMenu');
        if (node) {
            node.innerHTML = '<ul class="zebraStripes" id="placesList"></ul>';
        }
        // IF GEOLOCATION
        if (configOptions.showGeolocation && navigator.geolocation) {
            createGeolocateItem();
        }
        // IF SHARE OBJECT
        if (configOptions.bookmarks && configOptions.bookmarks.length) {
            for (i = 0; i < configOptions.bookmarks.length; i++) {
                createPlacesListItem(i);
            }
        }
        // SET ON CLICKS
        placesOnClick();
        zebraStripe(dojo.query('#placesList li.layer'));
    }
}
// END