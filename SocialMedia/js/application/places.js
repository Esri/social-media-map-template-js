// create places item
function createPlacesListItem(i) {
    // default vars //
    var html = '';
    // list html
    html += '<li data-index="' + i + '" class="layer placesItem sharedItem checked">';
    html += '<span tabindex="0" class="placesIcon placesClick"></span><span class="title placesClick">' + configOptions.bookmarks[i].name.replace(/[\-_]/g, " ") + '</span>';
    html += '</li>';
    // insert list item
    var node = dojo.byId('placesList');
    if (node) {
        dojo.place(html, node, "last");
    }
    zebraStripe(dojo.query('#placesList li.layer'));
}

// zoom to location: zooms map to location point
function zoomToLocation(x, y, IPAccuracy) {
    var lod = 16;
    // set point
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(x, y));
    // zoom and center
    map.centerAndZoom(pt, lod);
}

// geolocation error
function geoLocateMapError(error) {
    console.log(error);
}

// geolocate function: sets map location to users location
function geoLocateMap(position) {
    if (position) {
        var latitude = position.coords.latitude;
        var longitude = position.coords.longitude;
        var IPAccuracy = position.coords.accuracy;
        zoomToLocation(longitude, latitude, IPAccuracy);
    }
}

// geolocate item
function createGeolocateItem() {
    var html = '<li tabindex="0" title="' + i18n.viewer.places.myLocationTitle + '" id="geoLocate" class="layer placesItem"><span class="placesIcon"></span><span class="title">' + i18n.viewer.places.myLocation + '</span></li>';
    var node = dojo.byId('placesList');
    if (node) {
        dojo.place(html, node, "last");
    }
}

// configure places
function placesOnClick() {
    // places click
    dojo.query(document).delegate("#placesList .placesClick", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            objIndex = dojo.query(this).parent().attr('data-index');
            if (objIndex !== -1) {
                // create extent
                var newExtent = new esri.geometry.Extent(configOptions.bookmarks[objIndex].extent);
                // set extent
                map.setExtent(newExtent);
            }

        }
    });
    // geolocate click
    dojo.query(document).delegate("#geoLocate .title, #geoLocate .placesIcon", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            navigator.geolocation.getCurrentPosition(geoLocateMap, geoLocateMapError, {
                maximumAge: 3000,
                timeout: 5000,
                enableHighAccuracy: true
            });
        }
    });
    // places click
    dojo.query(document).delegate("#placesButton", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleMenus('places');
        }
    });
}

// configure places
function configurePlaces() {
    // if places
    if (configOptions.showPlaces) {
        // insert places button
        var node = dojo.byId('placesCon');
        if (node) {
            node.innerHTML = '<span tabindex="0" id="placesButton" class="barButton" data-menu="places" title="' + i18n.viewer.places.placesTitle + '">' + i18n.viewer.places.places + '<span class="arrow"></span></span>';
        }
        // create list
        node = dojo.byId('placesMenu');
        if (node) {
            node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.places.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="placesList"></ul>';
        }
        // if geolocation
        if (configOptions.showGeolocation && navigator.geolocation) {
            createGeolocateItem();
        }
        // if share object
        if (configOptions.bookmarks && configOptions.bookmarks.length) {
            for (i = 0; i < configOptions.bookmarks.length; i++) {
                createPlacesListItem(i);
            }
        }
        // set on clicks
        placesOnClick();
        zebraStripe(dojo.query('#placesList li.layer'));
    }
}