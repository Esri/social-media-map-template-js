function toggleSettingsContent() {
    var node = dojo.query('#collapseIcon')[0];
    var panel = dojo.query('#settingsDialog .dijitDialogPaneContent');
    dojo.toggleClass(node, "iconDown");
    if (dojo.hasClass(node, "iconDown")) {
        panel.style('display', 'none');
    } else {
        panel.style('display', 'block');
    }
}

// return date object for flickr dateFrom and dateTo
function getFlickrDate(type) {
    var todate = new Date();
    todate = dojo.date.add(todate, "minute", - 5);
    var fromdate;
    switch (configOptions.flickrRange.toLowerCase()) {
    case "today":
        if (type === 'to') {
            return todate;
        } else {
            fromdate = dojo.date.add(todate, "day", - 1);
            return fromdate;
        }
        break;
    case "this_week":
        if (type === 'to') {
            return todate;
        } else {
            fromdate = dojo.date.add(todate, "week", - 1);
            return fromdate;
        }
        break;
    case "this_month":
        if (type === 'to') {
            return todate;
        } else {
            fromdate = dojo.date.add(todate, "month", - 1);
            return fromdate;
        }
        break;
    case "all_time":
        return false;
    default:
        return false;
    }
}

function smLayerChange(event) {
    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
        var id = dojo.query(this).attr('data-id')[0];
        var layer = getSocialLayer(id);
        if (layer) {
            layer.change();
        }
    }
}

// settings panel ui
function configureSettingsUI() {
    var props = {
        style: "width: 400px",
        draggable: true,
        showTitle: true,
        title: i18n.viewer.settings.title
    };
    // new dijit.Dialog(
    configOptions.settingsDialog = new dijit.Dialog(props, dojo.byId('settingsDialog'));
    var node = dojo.query('#settingsDialog .dijitDialogTitle')[0];
    if (node) {
        node.innerHTML = '<div id="collapseIcon"></div><span class="configIcon"></span><span id="settingsTitle">' + i18n.viewer.settings.title + '</span>';
    }

    // Settings Menu Config
    dojo.query(document).delegate("#cfgMenu .mapButton", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            dojo.query('#cfgMenu .mapButton').removeClass('buttonSelected');
            dojo.query(this).addClass('buttonSelected');
            var id = dojo.query(this).attr('data-layer')[0];
            var panelObj = dojo.query('#settingsDialog .cfgPanel[data-layer=' + id + ']');
            dojo.query("#settingsDialog .cfgPanel").style('display', 'none');
            panelObj.style('display', 'block');
        }
    });

    dojo.query(document).delegate("#collapseIcon", "click", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleSettingsContent();
        }
    });

    dojo.query(document).delegate("#socialList li:not(.cLoading) .toggle", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleChecked(this);
            var changeMapVal = dojo.query(this).parent('li').attr('data-layer')[0];
            toggleMapLayerSM(changeMapVal);
        }
    });

    dojo.query(document).delegate("#settingsDialog .dijitDialogTitleBar", "dblclick", function (event) {
        toggleSettingsContent();
    });

    for (var i = 0; i < configOptions.socialLayers.length; i++) {
        dojo.query(document).delegate('#' + configOptions.socialLayers[i].options.id + '_input', "keyup", smLayerChange);
        dojo.query(document).delegate('#' + configOptions.socialLayers[i].options.id + '_submit', "onclick,keyup", smLayerChange);
    }
}

function clearDataPoints() {
    for (var i = 0; i < configOptions.socialLayers.length; i++) {
        configOptions.socialLayers[i].clear();
    }
}

function getSocialLayer(id) {
    for (var i = 0; i < configOptions.socialLayers.length; i++) {
        if (configOptions.socialLayers[i].options.id === id) {
            return configOptions.socialLayers[i];
        }
    }
    return false;
}

// gets string for social media popup title
function getSmPopupTitle() {
    var graphic = configOptions.customPopup.getSelectedFeature();
    var socialString = '';
    var pagString = '';
    if (graphic) {
        if (graphic.attributes.smType) {
            var total = configOptions.customPopup.count;
            var current = configOptions.customPopup.selectedIndex + 1;
            var socialObject;
            // if more than 1
            if (total > 1) {
                pagString = '<span class="pageInfo">(' + dojo.number.format(current) + ' ' + i18n.viewer.general.of + ' ' + dojo.number.format(total) + ')</span>';
            }
            var layer = getSocialLayer(graphic.attributes.smType);
            if (layer) {
                socialObject = {
                    title: layer.options.title,
                    legendIcon: layer.options.legendIcon
                };
            }
            if (socialObject) {
                socialString = '<span title="' + socialObject.title + '" class="iconImg" style="background-image:url(' + socialObject.legendIcon + ');"></span>' + '<span class="titleInfo">' + socialObject.title + '</span>';
            }
        }
    }
    configOptions.activeFeature = graphic;
    return socialString + pagString;
}

// overrides popup title for social media to add image
function overridePopupTitle() {
    hideAllMenus();
    configOptions.customPopup.setTitle(getSmPopupTitle());
    if(typeof addReportInAppButton === 'function') {
        addReportInAppButton();
    }
}

// update social layers
function updateSocialLayers() {
    for (var i = 0; i < configOptions.socialLayers.length; i++) {
        configOptions.socialLayers[i].newQuery();
    }
}

// reset social refresh timer
function resetSocialRefreshTimer() {
    clearTimeout(configOptions.autoRefreshTimer);
    configOptions.autoRefreshTimer = setTimeout(function () {
        updateSocialLayers();
    }, 4000);
}

// toggle social media layer on and off
function toggleMapLayerSM(layerid) {
    clearTimeout(configOptions.autoRefreshTimer);
    var layer = getSocialLayer(layerid);
    var layerList = dojo.query('#socialMenu li[data-layer="' + layerid + '"]');
    if (dojo.hasClass(layerList[0], 'checked')) {
        layer.newQuery(true);
    } else {
        dojo.query('#' + layerid + '_load').style('display', 'none');
        layer.clear();
    }
    setSharing();
}

// display points
function pointDisplay(display) {
    var i;
    switch (display) {
    case 'heatmap':
        if (clusterLayer) {
            clusterLayer.setVisibility(false);
        }
        if (heatLayer) {
            heatLayer.setVisibility(true);
        }
        if (configOptions.socialLayers) {
            for (i = 0; i < configOptions.socialLayers.length; i++) {
                configOptions.socialLayers[i].hide();
            }
        }
        configOptions.socialDisplay = 'heatmap';
        break;
    case 'cluster':
        if (heatLayer) {
            heatLayer.setVisibility(false);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(true);
        }
        if (configOptions.socialLayers) {
            for (i = 0; i < configOptions.socialLayers.length; i++) {
                configOptions.socialLayers[i].hide();
            }
        }
        configOptions.socialDisplay = 'cluster';
        break;
    default:
        if (heatLayer) {
            heatLayer.setVisibility(false);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(false);
        }
        if (configOptions.socialLayers) {
            for (i = 0; i < configOptions.socialLayers.length; i++) {
                configOptions.socialLayers[i].show();
            }
        }
        configOptions.socialDisplay = 'point';
    }
}

// toggle display as clusters/heatmap
function toggleDisplayAs(obj) {
    dojo.query('#displayAs .mapButton').removeClass('buttonSelected');
    // data type variable
    var dataType = dojo.query(obj).attr('data-type')[0];
    if (dataType === 'heatmap' && isCanvasSupported()) {
        pointDisplay('heatmap');
    } else if (dataType === 'cluster') {
        pointDisplay('cluster');
    } else {
        pointDisplay('point');
    }
    configOptions.customPopup.hide();
    setSharing();
    // class
    dojo.query(obj).addClass('buttonSelected');
}

// heatmap / clusters toggle
function insertSMToggle() {
    if (configOptions.showDisplaySwitch) {
        var clusterClass = '';
        var heatmapClass = '';
        var pointClass = '';
        var clusterButton = 'buttonMiddle ';
        var html = '';
        if(!isCanvasSupported()){
            clusterButton = 'buttonBottom ';
            if(configOptions.socialDisplay === 'heatmap'){
                configOptions.socialDisplay = 'point';
            }
        }
        if (configOptions.socialDisplay === 'heatmap') {
            heatmapClass = 'buttonSelected';
        } else if (configOptions.socialDisplay === 'cluster') {
            clusterClass = 'buttonSelected';
        } else {
            pointClass = 'buttonSelected';
        }
        html += '<div id="displayAs" class="displayAs">';
        html += '<div class="displayAsText">' + i18n.viewer.buttons.displayAs + '</div>';
        html += '<div tabindex="0" title="' + i18n.viewer.buttons.point + '" data-type="point" class="mapButton pointButton buttonTop ' + pointClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.point + '</div>';
        html += '<div tabindex="0" title="' + i18n.viewer.buttons.cluster + '" data-type="cluster" class="mapButton clusterButton ' + clusterButton + clusterClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.cluster + '</div>';
        if(isCanvasSupported()){
            html += '<div tabindex="0" title="' + i18n.viewer.buttons.heatmap + '" data-type="heatmap" class="mapButton heatButton buttonBottom ' + heatmapClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.heatmap + '</div>';
        }
        html += '</div>';
        var node = dojo.byId('socialMenu');
        if (node) {
            dojo.place(html, node, "last");
        }
        dojo.query(document).delegate("#displayAs .mapButton", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                toggleDisplayAs(this);
            }
        });
    }
}

// insert social media list item
function insertSMItem(obj) {
    if (obj) {
        // layer default class
        var layerClass = 'layer';
        var key;
        // if layer is checked
        if (obj.visible) {
            // set class to checked
            layerClass = 'layer checked';
        }
        // compose html list string
        var html = '';
        html += '<li data-layer="' + obj.uniqueID + '" class="' + layerClass + '">';
        html += '<div class="cover"></div>';
        if (obj.showSocialSettings) {
            html += ' <span tabindex="0" class="cBconfig" title="' + obj.title + ' ' + i18n.viewer.layer.searchSettings + '"></span>';
        }
        if (obj.description) {
            html += '<span tabindex="0" class="cBinfo" title="' + i18n.viewer.layer.information + '"></span>';
        }
        html += '<span tabindex="0" class="toggle cBox"></span>';
        html += '<span tabindex="0" class="toggle cBicon"><img alt="' + obj.title + '" title="' + obj.title + '" width="16" height="16" src="' + obj.legendIcon + '" /></span>';
        html += '<span tabindex="0" class="toggle cBtitle">' + obj.title + '<span class="count"></span></span>';
        html += '<div class="clear"></div>';
        if (obj.description) {
            html += '<div title="' + i18n.viewer.general.close + '" class="infoHidden">';
            html += '<div class="ihClose"></div>';
            html += '<div>' + obj.description;
            html += '<span class="filtered">';
            if (obj.searchTerm) {
                html += ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + obj.searchTerm + '</span>."';
            }
            html += '</span>';
            html += '</div>';
            html += '</div>';
        }
        html += '</li>';
        // insert html
        var node = dojo.byId('socialList');
        if (node) {
            dojo.place(html, node, "last");
        }
    }
}

// update heat map
function updateDataPoints() {
    var dataPoints = [];
    for (var i = 0; i < configOptions.socialLayers.length; i++) {
        var list = dojo.query('#socialMenu .layer[data-layer=' + configOptions.socialLayers[i].options.id + ']');
        if (list[0] && configOptions.socialLayers[i].dataPoints && dojo.hasClass(list[0], "checked")) {
            dataPoints = dataPoints.concat(configOptions.socialLayers[i].dataPoints);
        }
    }
    if (heatLayer) {
        heatLayer.setData(dataPoints);
    }
    if (clusterLayer) {
        clusterLayer.setData(dataPoints);
    }
}


// insert settings panel html
function insertSettingsHTML() {
    var html = '';
    html += '<div class="padContainer">';
    html += '<div class="cfgMenu" id="cfgMenu"></div>';
    html += '<div class="Pad ">';
    html += '<div class="clear"></div>';
    if (configOptions.showFlickr) {
        if (configOptions.showFlickrConfig) {
            html += '<div class="cfgPanel" data-layer="' + configOptions.flickrID + '">';
            html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + configOptions.flickrTitle + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="' + configOptions.flickrID + '_input' + '">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input data-id="' + configOptions.flickrID + '" id="' + configOptions.flickrID + '_input' + '" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.flickrSearch + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="' + configOptions.flickrID + '_range">' + i18n.viewer.settings.fromThePast + '</label>';
            html += '<select id="' + configOptions.flickrID + '_range">';
            html += '<option value="today">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
            html += '<option value="this_week">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
            html += '<option value="this_month">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
            html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="' + configOptions.flickrID + '_submit' + '">&nbsp;</label>';
            html += '<span data-id="' + configOptions.flickrID + '" tabindex="0" id="' + configOptions.flickrID + '_submit' + '" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + configOptions.flickrID + '_load' + '"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (configOptions.showTwitter) {
        if (configOptions.showTwitterConfig) {
            html += '<div class="cfgPanel" data-layer="' + configOptions.twitterID + '">';
            html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + configOptions.twitterTitle + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="' + configOptions.twitterID + '_input' + '">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input data-id="' + configOptions.twitterID + '" id="' + configOptions.twitterID + '_input' + '" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.twitterSearch + '" />';
            html += '<a title="' + i18n.viewer.settings.twSearch + '" class="twInfo" href="' + location.protocol + '//support.twitter.com/articles/71577-how-to-use-advanced-twitter-search" target="_blank"></a>';
            html += '</li>';
            html += '<li>';
            html += '<label for="' + configOptions.twitterID + '_submit' + '">&nbsp;</label>';
            html += '<span data-id="' + configOptions.twitterID + '" tabindex="0" id="' + configOptions.twitterID + '_submit' + '" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + configOptions.twitterID + '_load' + '"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    if (configOptions.showYouTube) {
        if (configOptions.showYouTubeConfig) {
            html += '<div class="cfgPanel" data-layer="' + configOptions.youtubeID + '">';
            html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + configOptions.youtubeTitle + ':</strong></div>';
            html += '<ul class="formStyle">';
            html += '<li>';
            html += '<label for="' + configOptions.youtubeID + '_input' + '">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input data-id="' + configOptions.youtubeID + '" id="' + configOptions.youtubeID + '_input' + '" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.youtubeSearch + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="' + configOptions.youtubeID + '_range' + '">' + i18n.viewer.settings.fromThePast + '</label>';
            html += '<select id="' + configOptions.youtubeID + '_range' + '">';
            html += '<option value="today">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
            html += '<option value="this_week">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
            html += '<option value="this_month">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
            html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="' + configOptions.youtubeID + '_submit' + '">&nbsp;</label>';
            html += '<span data-id="' + configOptions.youtubeID + '" tabindex="0" class="mapSubmit" id="' + configOptions.youtubeID + '_submit' + '">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + configOptions.youtubeID + '_load' + '"></span>';
            html += '</li>';
            html += '</ul>';
            html += '</div>';
        }
    }
    html += '</div>';
    html += '</div>';
    var node = dojo.byId('settingsDialog');
    if (node) {
        node.innerHTML = html;
    }
    //	set select menu values
    if (configOptions.showYouTube) {
        dojo.query('#' + configOptions.youtubeID + '_range').attr('value', configOptions.youtubeRange);
    }
    //	set select menu values
    if (configOptions.showFlickr) {
        dojo.query('#' + configOptions.flickrID + '_range').attr('value', configOptions.flickrRange);
    }
}

// Social Media
function configureSocialMedia() {
    // if canvas is supported
    if (isCanvasSupported()) {
        // set up heat layer
        heatLayer = new HeatmapLayer({
            config: {
                "useLocalMaximum": true
            },
            id: "heatLayer",
            map: map,
            domNodeId: "heatLayer",
            opacity: 0.85
        });
        map.addLayer(heatLayer);
    }
    // set up cluster layer
    clusterLayer = new modules.ClusterLayer(null, {
        map: map,
        id: "clusterLayer",
        label: i18n.viewer.buttons.cluster,
        clusterImage: configOptions.clusterImage,
        clusterHoverImage: configOptions.clusterHoverImage
    });
    configOptions.layerInfos.push({
        defaultSymbol: true,
        title: i18n.viewer.social.menuTitle,
        layer: clusterLayer.featureLayer
    });
    // append list container
    var node = dojo.byId('socialMenu');
    if (node) {
        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.social.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="socialList"></ul>';
    }
    // if flickr
    if (configOptions.showFlickr) {
        var flickrLayer = new social.flickr({
            map: map,
            title: configOptions.flickrTitle,
            legendIcon: configOptions.flickrIcon,
            id: configOptions.flickrID,
            searchTerm: configOptions.flickrSearch,
            symbolUrl: configOptions.flickrSymbol.url,
            symbolHeight: configOptions.flickrSymbol.height,
            symbolWidth: configOptions.flickrSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight,
            dateFrom: getFlickrDate('from'),
            dateTo: getFlickrDate('to'),
            apiKey: configOptions.flickrKey
        });
        configOptions.layerInfos.push({
            defaultSymbol: true,
            title: configOptions.flickrTitle,
            layer: flickrLayer.featureLayer
        });
        clusterLayer.featureLayer.renderer.addValue({
            value: configOptions.flickrID,
            symbol: new esri.symbol.PictureMarkerSymbol({
                "url": configOptions.flickrSymbol.url,
                "height": configOptions.flickrSymbol.height,
                "width": configOptions.flickrSymbol.width,
                "type": "esriPMS"
            }),
            label: configOptions.flickrTitle
        });
        dojo.connect(flickrLayer.featureLayer, 'onClick', function () {
            overridePopupTitle();
        });
        dojo.connect(flickrLayer, 'onUpdate', function () {
            updateDataPoints();
        });
        dojo.connect(flickrLayer, 'onClear', function () {
            updateDataPoints();
            configOptions.flickrChecked = false;
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(flickrLayer, 'onUpdateEnd', function () {
            var totalCount = flickrLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.flickrID + ']'), dojo.query('#' + configOptions.flickrID + '_load'));
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .keyword')[0];
            if (node) {
                node.innerHTML = configOptions.flickrSearch;
            }
            var textCount = '';
            if (totalCount) {
                textCount = ' (' + totalCount + ')' || '';
            }
            node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .count')[0];
            if (node) {
                node.innerHTML = textCount;
            }
        });
        flickrLayer.newQuery = function (enable) {
            if (enable) {
                configOptions.flickrChecked = true;
            }
            var flList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']');
            if (dojo.hasClass(flList[0], "checked")) {
                flList.addClass("cLoading");
                var updateObj = {
                    searchTerm: configOptions.flickrSearch
                };
                if (configOptions.flickrRange) {
                    updateObj.dateFrom = getFlickrDate('from');
                    updateObj.dateTo = getFlickrDate('to');
                }
                flickrLayer.update(updateObj);
            }
        };
        flickrLayer.change = function () {
            configOptions.flickrSearch = dojo.query('#' + configOptions.flickrID + '_input').attr('value')[0];
            configOptions.flickrRange = dojo.query('#' + configOptions.flickrID + '_range').attr('value')[0];
            showLoading(configOptions.flickrID + '_load');
            dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']').addClass("checked cLoading");
            setSharing();
            var html = '';
            if (configOptions.flickrSearch) {
                html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + configOptions.flickrSearch + '</span>."';
            }
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .filtered')[0];
            if (node) {
                node.innerHTML = html;
            }
            flickrLayer.clear();
            var updateObj = {
                searchTerm: configOptions.flickrSearch
            };
            if (configOptions.flickrRange) {
                updateObj.dateFrom = getFlickrDate('from');
                updateObj.dateTo = getFlickrDate('to');
            }
            flickrLayer.update(updateObj);
        };
        // insert html
        insertSMItem({
            visible: configOptions.flickrChecked,
            uniqueID: configOptions.flickrID,
            title: configOptions.flickrTitle,
            showSocialSettings: configOptions.showFlickrConfig,
            legendIcon: configOptions.flickrIcon,
            description: configOptions.flickrDescription,
            searchTerm: configOptions.flickrSearch
        });
        configOptions.socialLayers.push(flickrLayer);
    }
    // if panoramio
    if (configOptions.showPanoramio) {
        var panoramioLayer = new social.panoramio({
            map: map,
            title: configOptions.panoramioTitle,
            legendIcon: configOptions.panoramioIcon,
            id: configOptions.panoramioID,
            symbolUrl: configOptions.panoramioSymbol.url,
            symbolHeight: configOptions.panoramioSymbol.height,
            symbolWidth: configOptions.panoramioSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight
        });
        configOptions.layerInfos.push({
            defaultSymbol: true,
            title: configOptions.panoramioTitle,
            layer: panoramioLayer.featureLayer
        });
        clusterLayer.featureLayer.renderer.addValue({
            value: configOptions.panoramioID,
            symbol: new esri.symbol.PictureMarkerSymbol({
                "url": configOptions.panoramioSymbol.url,
                "height": configOptions.panoramioSymbol.height,
                "width": configOptions.panoramioSymbol.width,
                "type": "esriPMS"
            }),
            label: configOptions.panoramioTitle
        });
        dojo.connect(panoramioLayer.featureLayer, 'onClick', function () {
            overridePopupTitle();
        });
        dojo.connect(panoramioLayer, 'onUpdate', function () {
            updateDataPoints();
        });
        dojo.connect(panoramioLayer, 'onClear', function () {
            updateDataPoints();
            configOptions.panoramioChecked = false;
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.panoramioID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(panoramioLayer, 'onUpdateEnd', function () {
            var totalCount = panoramioLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.panoramioID + ']'), dojo.query('#' + configOptions.panoramioID + '_load'));
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.panoramioID + '] .keyword')[0];
            if (node) {
                node.innerHTML = configOptions.panoramioSearch;
            }
            var textCount = '';
            if (totalCount) {
                textCount = ' (' + totalCount + ')' || '';
            }
            node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.panoramioID + '] .count')[0];
            if (node) {
                node.innerHTML = textCount;
            }
        });
        panoramioLayer.newQuery = function (enable) {
            if (enable) {
                configOptions.panoramioChecked = true;
            }
            var prList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.panoramioID + ']');
            if (dojo.hasClass(prList[0], "checked")) {
                prList.addClass("cLoading");
                panoramioLayer.update();
            }
        };
        panoramioLayer.change = function () {};
        // insert html
        insertSMItem({
            visible: configOptions.panoramioChecked,
            uniqueID: configOptions.panoramioID,
            title: configOptions.panoramioTitle,
            showSocialSettings: false,
            legendIcon: configOptions.panoramioIcon,
            description: configOptions.panoramioDescription
        });
        configOptions.socialLayers.push(panoramioLayer);
    }
    // if twitter
    if (configOptions.showTwitter) {
        var twitterLayer = new social.twitter({
            map: map,
            title: configOptions.twitterTitle,
            legendIcon: configOptions.twitterIcon,
            id: configOptions.twitterID,
            searchTerm: configOptions.twitterSearch,
            symbolUrl: configOptions.twitterSymbol.url,
            symbolHeight: configOptions.twitterSymbol.height,
            symbolWidth: configOptions.twitterSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight
        });
        configOptions.layerInfos.push({
            defaultSymbol: true,
            title: configOptions.twitterTitle,
            layer: twitterLayer.featureLayer
        });
        clusterLayer.featureLayer.renderer.addValue({
            value: configOptions.twitterID,
            symbol: new esri.symbol.PictureMarkerSymbol({
                "url": configOptions.twitterSymbol.url,
                "height": configOptions.twitterSymbol.height,
                "width": configOptions.twitterSymbol.width,
                "type": "esriPMS"
            }),
            label: configOptions.twitterTitle
        });
        dojo.connect(twitterLayer, 'onUpdate', function () {
            updateDataPoints();
        });
        dojo.connect(twitterLayer.featureLayer, 'onClick', function () {
            overridePopupTitle();
        });
        dojo.connect(twitterLayer, 'onClear', function () {
            updateDataPoints();
            configOptions.twitterChecked = false;
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(twitterLayer, 'onUpdateEnd', function () {
            var totalCount = twitterLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.twitterID + ']'), dojo.query('#' + configOptions.twitterID + '_load'));
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .keyword')[0];
            if (node) {
                node.innerHTML = configOptions.twitterSearch;
            }
            var textCount = '';
            if (totalCount) {
                textCount = ' (' + totalCount + ')' || '';
            }
            node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .count')[0];
            if (node) {
                node.innerHTML = textCount;
            }
        });
        twitterLayer.newQuery = function (enable) {
            if (enable) {
                configOptions.twitterChecked = true;
            }
            var twList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']');
            if (dojo.hasClass(twList[0], "checked")) {
                twList.addClass("cLoading");
                twitterLayer.update({
                    searchTerm: configOptions.twitterSearch
                });
            }
        };
        twitterLayer.change = function () {
            configOptions.twitterSearch = dojo.query('#' + configOptions.twitterID + '_input').attr('value')[0];
            dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']').addClass("checked cLoading");
            showLoading(configOptions.twitterID + '_load');
            setSharing();
            var html = '';
            if (configOptions.twitterSearch) {
                html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + configOptions.twitterSearch + '</span>."';
            }
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .filtered')[0];
            if (node) {
                node.innerHTML = html;
            }
            twitterLayer.clear();
            twitterLayer.update({
                searchTerm: configOptions.twitterSearch
            });
        };
        // insert html
        insertSMItem({
            visible: configOptions.twitterChecked,
            uniqueID: configOptions.twitterID,
            title: configOptions.twitterTitle,
            showSocialSettings: configOptions.showTwitterConfig,
            legendIcon: configOptions.twitterIcon,
            description: configOptions.twitterDescription,
            searchTerm: configOptions.twitterSearch
        });
        configOptions.socialLayers.push(twitterLayer);
    }
    // if youtube
    if (configOptions.showYouTube) {
        var youtubeLayer = new social.youtube({
            map: map,
            title: configOptions.youtubeTitle,
            legendIcon: configOptions.youtubeIcon,
            id: configOptions.youtubeID,
            key: configOptions.youtubeKey,
            searchTerm: configOptions.youtubeSearch,
            symbolUrl: configOptions.youtubeSymbol.url,
            symbolHeight: configOptions.youtubeSymbol.height,
            symbolWidth: configOptions.youtubeSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight,
            range: configOptions.youtubeRange
        });
        configOptions.layerInfos.push({
            defaultSymbol: true,
            title: configOptions.youtubeTitle,
            layer: youtubeLayer.featureLayer
        });
        clusterLayer.featureLayer.renderer.addValue({
            value: configOptions.youtubeID,
            symbol: new esri.symbol.PictureMarkerSymbol({
                "url": configOptions.youtubeSymbol.url,
                "height": configOptions.youtubeSymbol.height,
                "width": configOptions.youtubeSymbol.width,
                "type": "esriPMS"
            }),
            label: configOptions.youtubeTitle
        });
        dojo.connect(youtubeLayer, 'onUpdate', function () {
            updateDataPoints();
        });
        dojo.connect(youtubeLayer.featureLayer, 'onClick', function () {
            overridePopupTitle();
        });
        dojo.connect(youtubeLayer, 'onClear', function () {
            updateDataPoints();
            configOptions.youtubeChecked = false;
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(youtubeLayer, 'onUpdateEnd', function () {
            var totalCount = youtubeLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.youtubeID + ']'), dojo.query('#' + configOptions.youtubeID + '_load'));
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .keyword')[0];
            if (node) {
                node.innerHTML = configOptions.youtubeSearch;
            }
            var textCount = '';
            if (totalCount) {
                textCount = ' (' + totalCount + ')' || '';
            }
            node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .count')[0];
            if (node) {
                node.innerHTML = textCount;
            }
        });
        youtubeLayer.newQuery = function (enable) {
            if (enable) {
                configOptions.youtubeChecked = true;
            }
            // if youtube cbox is checked
            var ytList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']');
            if (dojo.hasClass(ytList[0], "checked")) {
                ytList.addClass("cLoading");
                youtubeLayer.update({
                    searchTerm: configOptions.youtubeSearch,
                    range: configOptions.youtubeRange
                });
            }
        };
        youtubeLayer.change = function () {
            configOptions.youtubeSearch = dojo.query('#' + configOptions.youtubeID + '_input').attr('value')[0];
            configOptions.youtubeRange = dojo.query('#' + configOptions.youtubeID + '_range').attr('value')[0];
            showLoading(configOptions.youtubeID + '_load');
            dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']').addClass("checked cLoading");
            setSharing();
            var html = '';
            if (configOptions.youtubeSearch) {
                html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + configOptions.youtubeSearch + '</span>."';
            }
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .filtered')[0];
            if (node) {
                node.innerHTML = html;
            }
            youtubeLayer.clear();
            youtubeLayer.update({
                searchTerm: configOptions.youtubeSearch,
                range: configOptions.youtubeRange
            });
        };
        // insert html
        insertSMItem({
            visible: configOptions.youtubeChecked,
            uniqueID: configOptions.youtubeID,
            title: configOptions.youtubeTitle,
            showSocialSettings: configOptions.showYouTubeConfig,
            legendIcon: configOptions.youtubeIcon,
            description: configOptions.youtubeDescription,
            searchTerm: configOptions.youtubeSearch
        });
        configOptions.socialLayers.push(youtubeLayer);
    }
    // if ushahidi
    if (configOptions.showUshahidi) {
        var ushahidiLayer = new social.ushahidi({
            map: map,
            title: configOptions.ushahidiTitle,
            legendIcon: configOptions.ushahidiIcon,
            id: configOptions.ushahidiID,
            url: configOptions.ushahidiUrl,
            symbolUrl: configOptions.ushahidiSymbol.url,
            symbolHeight: configOptions.ushahidiSymbol.height,
            symbolWidth: configOptions.ushahidiSymbol.width,
            popup: configOptions.customPopup,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight
        });
        configOptions.layerInfos.push({
            defaultSymbol: true,
            title: configOptions.ushahidiTitle,
            layer: ushahidiLayer.featureLayer
        });
        clusterLayer.featureLayer.renderer.addValue({
            value: configOptions.ushahidiID,
            symbol: new esri.symbol.PictureMarkerSymbol({
                "url": configOptions.ushahidiSymbol.url,
                "height": configOptions.ushahidiSymbol.height,
                "width": configOptions.ushahidiSymbol.width,
                "type": "esriPMS"
            }),
            label: configOptions.ushahidiTitle
        });
        dojo.connect(ushahidiLayer, 'onUpdate', function () {
            updateDataPoints();
        });
        dojo.connect(ushahidiLayer.featureLayer, 'onClick', function () {
            overridePopupTitle();
        });
        dojo.connect(ushahidiLayer, 'onClear', function () {
            updateDataPoints();
            configOptions.ushahidiChecked = false;
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.ushahidiID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(ushahidiLayer, 'onUpdateEnd', function () {
            var totalCount = ushahidiLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.ushahidiID + ']'), dojo.query('#' + configOptions.panoramioID + '_load'));
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.ushahidiID + '] .keyword')[0];
            if (node) {
                node.innerHTML = configOptions.ushahidiSearch;
            }
            var textCount = '';
            if (totalCount) {
                textCount = ' (' + totalCount + ')' || '';
            }
            node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.ushahidiID + '] .count')[0];
            if (node) {
                node.innerHTML = textCount;
            }
        });
        ushahidiLayer.newQuery = function (enable) {
            if (enable) {
                configOptions.ushahidiChecked = true;
            }
            var uhList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.ushahidiID + ']');
            if (dojo.hasClass(uhList[0], "checked")) {
                uhList.addClass("cLoading");
                ushahidiLayer.update();
            }
        };
        ushahidiLayer.change = function () {};
        // insert html
        insertSMItem({
            visible: configOptions.ushahidiChecked,
            uniqueID: configOptions.ushahidiID,
            title: configOptions.ushahidiTitle,
            showSocialSettings: false,
            legendIcon: configOptions.ushahidiIcon,
            description: configOptions.ushahidiDescription
        });
        configOptions.socialLayers.push(ushahidiLayer);
    }
    insertSMToggle();
    insertSettingsHTML();
    configureSettingsUI();
    // set default visible of the two
    if (configOptions.socialDisplay === 'heatmap' && isCanvasSupported()) {
        pointDisplay('heatmap');
    } else if (configOptions.socialDisplay === 'cluster') {
        pointDisplay('cluster');
    } else {
        pointDisplay('point');
    }
    // onclick connect
    dojo.connect(clusterLayer.featureLayer, "onClick",function (evt) {
        dojo.stopEvent(evt);
        var arr = [];
        var query = new esri.tasks.Query();
        query.geometry = evt.graphic.attributes.extent;
        for (var i = 0; i < configOptions.socialLayers.length; i++) {
            arr.push(configOptions.socialLayers[i].featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        configOptions.customPopup.setFeatures(arr);
        configOptions.customPopup.show(evt.mapPoint);
        configOptions.customPopup.resize(configOptions.popupWidth, configOptions.popupHeight);
        overridePopupTitle();
    });

    // zebra stripe layers
    zebraStripe(dojo.query('#socialList li.layer'));

    // settings menu generator
    var settingsCount = dojo.query('#socialList li.layer .cBconfig').length;
    if (settingsCount > -1) {
        dojo.forEach(dojo.query('#socialList li.layer .cBconfig'), function (entry, i) {
            var parent = dojo.query(entry).parent('li');
            var settingsID = dojo.query(parent).attr('data-layer');
            var settingsClass = getButtonClass(i + 1, settingsCount);
            var settingsSource = dojo.query(parent).children('.cBicon').children('img').attr('src');
            var settingsTitle = dojo.query(parent).children('.cBtitle').text();
            var node = dojo.byId('cfgMenu');
            if (node) {
                var html = '<span tabindex="0" data-layer="' + settingsID + '" class="mapButton ' + settingsClass + '" title="' + settingsTitle + '"><img width="16" height="16" src="' + settingsSource + '" /></span>';
                dojo.place(html, node, "last");
            }
        });
    }
}