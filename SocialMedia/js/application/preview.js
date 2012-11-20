// resize map function
function resizeMapPreview() {
    //clear any existing resize timer
    clearTimeout(configOptions.previewTimer);
    //create new resize timer with delay of 500 milliseconds
    configOptions.previewTimer = setTimeout(function () {
        map.resize();
        map.reposition();
        setTimeout(function () {
            if (configOptions.startExtent) {
                map.setExtent(configOptions.startExtent);
            }
        }, 500);
    }, 500);
}

// Handle the map size variables
function mapSize(mSize, width, height) {
    dojo.query('#previewContainer .embedSizing li').removeClass('selected');
    switch (mSize) {
    case 'small':
        configOptions.embedWidth = configOptions.embedSizes.small.width;
        configOptions.embedHeight = configOptions.embedSizes.small.height;
        dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        dojo.query('#embedSmall').addClass('selected');
        break;
    case 'medium':
        configOptions.embedWidth = configOptions.embedSizes.medium.width;
        configOptions.embedHeight = configOptions.embedSizes.medium.height;
        dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        dojo.query('#embedMedium').addClass('selected');
        break;
    case 'large':
        configOptions.embedWidth = configOptions.embedSizes.large.width;
        configOptions.embedHeight = configOptions.embedSizes.large.height;
        dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        dojo.query('#embedLarge').addClass('selected');
        break;
    case 'resize':
        configOptions.embedWidth = width;
        configOptions.embedHeight = height;
        dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        dojo.query('#embedCustom').addClass('selected');
        break;
    case 'input':
        configOptions.embedWidth = width;
        configOptions.embedHeight = height;
        dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        dojo.query('#embedCustom').addClass('selected');
        break;
    default:
        configOptions.embedWidth = dojo.query('#inputWidth').attr('value')[0];
        configOptions.embedHeight = dojo.query('#inputHeight').attr('value')[0];
        if (isNaN(configOptions.embedWidth)) {
            alertDialog(i18n.viewer.errors.integersOnly);
            configOptions.embedWidth = configOptions.embedSizes.medium.width;
            dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        }
        if (isNaN(configOptions.embedHeight)) {
            alertDialog(i18n.viewer.errors.integersOnly);
            configOptions.embedHeight = configOptions.embedSizes.medium.height;
            dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        }
        if (configOptions.embedSizes.minimum.width && configOptions.embedWidth < configOptions.embedSizes.minimum.width) {
            configOptions.embedWidth = configOptions.embedSizes.minimum.width;
            alertDialog(i18n.viewer.preview.minWidth + ' ' + configOptions.embedWidth);
            dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        } else if (configOptions.embedSizes.minimum.height && configOptions.embedHeight < configOptions.embedSizes.minimum.height) {
            configOptions.embedHeight = configOptions.embedSizes.minimum.height;
            alertDialog(i18n.viewer.preview.minHeight + ' ' + configOptions.embedHeight);
            dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        } else if (configOptions.embedSizes.maximum.width && configOptions.embedWidth > configOptions.embedSizes.maximum.width) {
            configOptions.embedWidth = configOptions.embedSizes.maximum.width;
            alertDialog(i18n.viewer.preview.maxWidth + ' ' + configOptions.embedWidth);
            dojo.query('#inputWidth').attr('value', configOptions.embedWidth);
        } else if (configOptions.embedSizes.maximum.height && configOptions.embedHeight > configOptions.embedSizes.maximum.height) {
            configOptions.embedHeight = configOptions.embedSizes.maximum.height;
            alertDialog(i18n.viewer.preview.maxHeight + ' ' + configOptions.embedHeight);
            dojo.query('#inputHeight').attr('value', configOptions.embedHeight);
        }
        dojo.query('#embedCustom').addClass('selected');
    }
    dojo.query('#map, #mapPreviewResize').style({
        'width': configOptions.embedWidth + 'px',
        'height': configOptions.embedHeight + 'px'
    });
    resizeMapPreview();
    setSharing(true);
}

// configure embed
function configureEmbed() {
    // overwite from url values
    setConfigOptions();
    configOptions.embedWidth = configOptions.embedSizes.medium.width;
    configOptions.embedHeight = configOptions.embedSizes.medium.height;
    var html = '';
    html += '<h2>' + i18n.viewer.preview.customize + '</h2>';
    html += '<table id="embedArea"><tbody><tr><td>';
    html += '<ul class="embedSizing">';
    html += '<li tabindex="0" class="item" id="embedSmall"><span class="itemIcon"></span>' + i18n.viewer.preview.small + '</li>';
    html += '<li tabindex="0" class="item selected" id="embedMedium"><span class="itemIcon"></span>' + i18n.viewer.preview.medium + '</li>';
    html += '<li tabindex="0" class="item" id="embedLarge"><span class="itemIcon"></span>' + i18n.viewer.preview.large + '</li>';
    html += '<li tabindex="0" class="item" id="embedCustom"><span class="itemIcon"></span>' + i18n.viewer.preview.custom + '';
    html += '<ul>';
    html += '<li><input placeholder="Width" autocomplete="off" id="inputWidth" value="' + configOptions.embedSizes.medium.width + '" type="text" class="mapInput inputSingle" size="10"></li>';
    html += '<li><input placeholder="Height" autocomplete="off" id="inputHeight" value="' + configOptions.embedSizes.medium.height + '" type="text" class="mapInput inputSingle" size="10"></li>';
    html += '</ul>';
    html += '</li>';
    html += '</ul></td><td>';
    html += '<div id="mapPreviewResize"><div id="map" dir="ltr" class="mapLoading"></div></div>';
    html += '</div></td></tr></tbody></table>';
    html += '<h2>' + i18n.viewer.preview.embed + '</h2>';
    html += '<div class="instruction">' + i18n.viewer.preview.instruction + '</div>';
    html += '<div class="textAreaCon">';
    html += '<textarea id="inputEmbed" value="" class="" size="30" rows="5" readonly></textarea>';
    html += '</div>';
    var node = dojo.byId('previewContainer');
    if (node) {
        node.innerHTML = html;
    }
    // create map deferred with options
    var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap, 'map', {
        mapOptions: {
            slider: false,
            wrapAround180: true,
            logo: false,
            isScrollWheelZoom: true
        }
    });
    // on successful response
    mapDeferred.addCallback(function (response) {
        map = response.map;
        // init basemap gallery hidden
        createBMGallery();
        // disable panning
        map.disableMapNavigation();
        // start extent
        setExtentValues();
        map.setExtent(configOptions.startExtent);
    });
    // on error response
    mapDeferred.addErrback(function (error) {
        console.log(i18n.viewer.errors.createMap + ": ", dojo.toJson(error));
    });
    // Embed Radio Buttons
    dojo.query(document).delegate("#embedSmall", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            mapSize('small');
        }
    });
    dojo.query(document).delegate("#embedMedium", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            mapSize('medium');
        }
    });
    dojo.query(document).delegate("#embedLarge", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            mapSize('large');
        }
    });
    dojo.query(document).delegate("#embedCustom", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            mapSize('custom');
        }
    });
    // listener for custom map size key up - height
    dojo.connect(dojo.byId('inputHeight'), "onchange", function (event) {
        mapSize('custom');
    });
    // listener for custom map size key up - width
    dojo.connect(dojo.byId('inputWidth'), "onchange", function (event) {
        mapSize('custom');
    });
    // input select all
    dojo.query(document).delegate("#inputEmbed", "onclick", function (event) {
        dojo.query(this)[0].select();
    });
    // resizable
    var handle = new dojox.layout.ResizeHandle({
        targetId: "mapPreviewResize",
        constrainMax: true,
        dir: configOptions.dir,
        textDir: configOptions.dir,
        minWidth: configOptions.embedSizes.minimum.width,
        minHeight: configOptions.embedSizes.minimum.height,
        maxHeight: configOptions.embedSizes.maximum.height,
        maxWidth: configOptions.embedSizes.maximum.width
    }).placeAt("mapPreviewResize");


    dojo.subscribe("/dojo/resize/stop", function (inst) {
        setTimeout(function () {
            dojo.query('#map').style('opacity', "1");
            dojo.query(this).removeClass('resizing');
            mapSize('resize', inst.targetDomNode.clientWidth, inst.targetDomNode.clientHeight);
        }, 750);
    });

    dojo.subscribe("/dojo/resize/start", function (inst) {
        dojo.query('#map').style('opacity', "0");
        dojo.query(this).addClass('resizing');
    });

    // set initial embed code
    setSharing(true);
}

// on load of libraries
dojo.addOnLoad(function () {
    // set localization
    i18n = dojo.i18n.getLocalization("esriTemplate", "template");
    setConfigOptions();
    // dojo ready
    setAppIdSettings(configureEmbed);
});