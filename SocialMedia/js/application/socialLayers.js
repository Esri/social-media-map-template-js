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

    dojo.query(document).delegate("#YTkwinput", "keyup", function (event) {
        if (event.keyCode === 13) {
            changeYouTube();
        }
    });
    dojo.query(document).delegate("#TWkwinput", "keyup", function (event) {
        if (event.keyCode === 13) {
            changeTwitter();
        }
    });
    dojo.query(document).delegate("#FLkwinput", "keyup", function (event) {
        if (event.keyCode === 13) {
            changeFlickr();
        }
    });

    dojo.query(document).delegate("#ytSubmit", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            changeYouTube();
        }
    });

    dojo.query(document).delegate("#twSubmit", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            changeTwitter();
        }
    });

    dojo.query(document).delegate("#flSubmit", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            changeFlickr();
        }
    });
}

function clearDataPoints() {
    if (youtubeLayer) {
        youtubeLayer.clear();
    }
    if (twitterLayer) {
        twitterLayer.clear();
    }
    if (flickrLayer) {
        flickrLayer.clear();
    }
}

// change social media settings
function changeYouTube() {
    configOptions.youtubeSearch = dojo.query('#YTkwinput').attr('value')[0];
    configOptions.youtubeRange = dojo.query("#youtuberange").attr('value')[0];
    showLoading('YTLoad');
    dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']').addClass("checked cLoading");
    setSharing();
    youtubeLayer.clear();
    youtubeLayer.update({
        searchTerm: configOptions.youtubeSearch,
        range: configOptions.youtubeRange
    });
}

// changes twitter keywords and such
function changeTwitter() {
    configOptions.twitterSearch = dojo.query('#TWkwinput').attr('value')[0];
    dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']').addClass("checked cLoading");
    showLoading('TWLoad');
    setSharing();
    twitterLayer.clear();
    twitterLayer.update({
        searchTerm: configOptions.twitterSearch
    });
}

// changes flickr keywords and such
function changeFlickr() {
    configOptions.flickrSearch = dojo.query('#FLkwinput').attr('value')[0];
    configOptions.flickrRange = dojo.query("#flickrrange").attr('value')[0];
    showLoading('FLLoad');
    dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']').addClass("checked cLoading");
    setSharing();
    flickrLayer.clear();
    var updateObj = {
        searchTerm: configOptions.flickrSearch
    };
    if (configOptions.flickrRange) {
        updateObj.dateFrom = getFlickrDate('from');
        updateObj.dateTo = getFlickrDate('to');
    }
    flickrLayer.update(updateObj);
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
            var socialObject = false;
            // if more than 1
            if (total > 1) {
                pagString = '<span class="pageInfo">(' + dojo.number.format(current) + ' ' + i18n.viewer.general.of + ' ' + dojo.number.format(total) + ')</span>';
            }
            var ytID, twID, flID, usID = 'unassigned';
            if (configOptions.showYouTube) {
                ytID = configOptions.youtubeID;
            }
            if (configOptions.showTwitter) {
                twID = configOptions.twitterID;
            }
            if (configOptions.showFlickr) {
                flID = configOptions.flickrID;
            }
            // set social icon
            switch (graphic.attributes.smType) {
            case ytID:
                socialObject = {
                    title: configOptions.youtubeTitle,
                    legendIcon: configOptions.youtubeIcon
                };
                break;
            case twID:
                socialObject = socialObject = {
                    title: configOptions.twitterTitle,
                    legendIcon: configOptions.twitterIcon
                };
                break;
            case flID:
                socialObject = {
                    title: configOptions.flickrTitle,
                    legendIcon: configOptions.flickrIcon
                };
                break;
            }
            if (socialObject) {
                socialString = '<span title="' + socialObject.title + '" class="iconImg" style="background-image:url(' + socialObject.legendIcon + ');"></span>' + '<span class="titleInfo">' + socialObject.title + '</span>';
            }
        }
    }
    return socialString + pagString;
}

// overrides popup title for social media to add image
function overridePopupTitle() {
    configOptions.customPopup.setTitle(getSmPopupTitle());
}

// update social layers
function updateSocialLayers() {
    if (configOptions.showYouTube) {
        // if youtube cbox is checked
        var ytList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']');
        if (dojo.hasClass(ytList[0], "checked")) {
            ytList.addClass("cLoading");
            youtubeLayer.update({
                searchTerm: configOptions.youtubeSearch,
                range: configOptions.youtubeRange
            });
        }
    }
    // if twitter cbox is checked
    if (configOptions.showTwitter) {
        var twList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']');
        if (dojo.hasClass(twList[0], "checked")) {
            twList.addClass("cLoading");
            twitterLayer.update({
                searchTerm: configOptions.twitterSearch
            });
        }
    }
    if (configOptions.showFlickr) {
        // if flickr cbox is checked
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
    var ytID, twID, flID, usID = false;
    if (configOptions.showYouTube) {
        ytID = configOptions.youtubeID;
    }
    if (configOptions.showTwitter) {
        twID = configOptions.twitterID;
    }
    if (configOptions.showFlickr) {
        flID = configOptions.flickrID;
    }
    var layerList = dojo.query('#socialMenu li[data-layer="' + layerid + '"]');
    if (dojo.hasClass(layerList[0], 'checked')) {
        switch (layerid) {
        case ytID:
            configOptions.youtubeChecked = true;
            youtubeLayer.update({
                searchTerm: configOptions.youtubeSearch,
                range: configOptions.youtubeRange
            });
            break;
        case twID:
            configOptions.twitterChecked = true;
            twitterLayer.update({
                searchTerm: configOptions.twitterSearch
            });
            break;
        case flID:
            configOptions.flickrChecked = true;
            var updateObj = {
                searchTerm: configOptions.flickrSearch
            };
            if (configOptions.flickrRange) {
                updateObj.dateFrom = getFlickrDate('from');
                updateObj.dateTo = getFlickrDate('to');
            }
            flickrLayer.update(updateObj);
            break;
        }
    } else {
        switch (layerid) {
        case ytID:
            dojo.query('#YTLoad').style('display', 'none');
            youtubeLayer.clear();
            configOptions.youtubeChecked = false;
            break;
        case twID:
            dojo.query('#TWLoad').style('display', 'none');
            twitterLayer.clear();
            configOptions.twitterChecked = false;
            break;
        case flID:
            dojo.query('#FLLoad').style('display', 'none');
            flickrLayer.clear();
            configOptions.flickrChecked = false;
            break;
        }
    }
    setSharing();
}

// toggle heat/cluster
function showHeatLayer() {
    if (clusterLayer) {
        clusterLayer.setVisibility(false);
    }
    if (heatLayer) {
        heatLayer.setVisibility(true);
    } else {
        alertDialog(i18n.viewer.errors.heatmap);
    }
}

// shows clusters and hides heatmap
function showClusterLayer() {
    if (heatLayer) {
        heatLayer.setVisibility(false);
    }
    if (clusterLayer) {
        clusterLayer.setVisibility(true);
    }
}

// toggle display as clusters/heatmap
function toggleDisplayAs(obj) {
    dojo.query('#displayAs .mapButton').removeClass('buttonSelected');
    // data type variable
    var dataType = dojo.query(obj).attr('data-type')[0];
    if (dataType === 'heatmap' && isCanvasSupported()) {
        showHeatLayer();
        configOptions.socialDisplay = 'heatmap';
    } else {
        showClusterLayer();
        configOptions.socialDisplay = 'cluster';
    }
    configOptions.customPopup.hide();
    setSharing();
    // class
    dojo.query(obj).addClass('buttonSelected');
}

// heatmap / clusters toggle
function insertSMToggle() {
    if (isCanvasSupported()) {
        var clusterClass = '';
        var heatmapClass = '';
        var html = '';
        if (configOptions.socialDisplay === 'heatmap') {
            heatmapClass = 'buttonSelected';
        } else {
            clusterClass = 'buttonSelected';
        }
        html += '<div id="displayAs" class="displayAs">';
        html += '<span tabindex="0" data-type="cluster" class="mapButton clusterButton buttonLeft ' + clusterClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.cluster + '</span>';
        html += '<span tabindex="0" data-type="heatmap" class="mapButton heatButton buttonRight ' + heatmapClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.heatmap + '</span>';
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
    } else {
        configOptions.socialDisplay = 'cluster';
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
            html += '<p>' + obj.description;
            if (obj.searchTerm) {
                html += ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + obj.searchTerm + '</span>."';
            }
            html += '</p>';
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
    if (configOptions.showTwitter) {
        var twList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + ']');
        if (twitterLayer.dataPoints && dojo.hasClass(twList[0], "checked")) {
            dataPoints = dataPoints.concat(twitterLayer.dataPoints);
        }
    }
    if (configOptions.showYouTube) {
        var ytList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + ']');
        if (youtubeLayer.dataPoints && dojo.hasClass(ytList[0], "checked")) {
            dataPoints = dataPoints.concat(youtubeLayer.dataPoints);
        }
    }
    if (configOptions.showFlickr) {
        var flList = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + ']');
        if (flickrLayer.dataPoints && dojo.hasClass(flList[0], "checked")) {
            dataPoints = dataPoints.concat(flickrLayer.dataPoints);
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
            html += '<label for="FLkwinput">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input id="FLkwinput" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.flickrSearch + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="flickrrange">' + i18n.viewer.settings.fromThePast + '</label>';
            html += '<select id="flickrrange">';
            html += '<option value="today">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
            html += '<option value="this_week">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
            html += '<option value="this_month">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
            html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="flSubmit">&nbsp;</label>';
            html += '<span tabindex="0" id="flSubmit" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="FLLoad"></span>';
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
            html += '<label for="TWkwinput">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input id="TWkwinput" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.twitterSearch + '" />';
            html += '<a title="' + i18n.viewer.settings.twSearch + '" class="twInfo" href="' + location.protocol + '//support.twitter.com/articles/71577-how-to-use-advanced-twitter-search" target="_blank"></a>';
            html += '</li>';
            html += '<li>';
            html += '<label for="twSubmit">&nbsp;</label>';
            html += '<span tabindex="0" id="twSubmit" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="TWLoad"></span>';
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
            html += '<label for="YTkwinput">' + i18n.viewer.settings.usingThisKeyword + '</label>';
            html += '<input id="YTkwinput" class="mapInput inputSingle" type="text" size="20" value="' + configOptions.youtubeSearch + '" />';
            html += '</li>';
            html += '<li>';
            html += '<label for="youtuberange">' + i18n.viewer.settings.fromThePast + '</label>';
            html += '<select id="youtuberange">';
            html += '<option value="today">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
            html += '<option value="this_week">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
            html += '<option value="this_month">' + dojo.number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
            html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
            html += '</select>';
            html += '</li>';
            html += '<li>';
            html += '<label for="ytSubmit">&nbsp;</label>';
            html += '<span tabindex="0" class="mapSubmit" id="ytSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="YTLoad"></span>';
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
        dojo.query('#youtuberange').attr('value', configOptions.youtubeRange);
    }
    //	set select menu values
    if (configOptions.showFlickr) {
        dojo.query('#flickrrange').attr('value', configOptions.flickrRange);
    }
}

// Social Media
function configureSocialMedia() {
    // if canvas is supported
    if (isCanvasSupported()) {
        // set up heat layer
        heatLayer = new HeatmapLayer({
            "map": map,
            "domNodeId": "heatLayer",
            "opacity": 0.85
        });
        map.addLayer(heatLayer);
    }
    // set up cluster layer
    clusterLayer = new modules.ClusterLayer(null, {
        map: map,
        clusterImage: configOptions.clusterImage,
        clusterHoverImage: configOptions.clusterHoverImage
    });
    configOptions.layerInfos.push({
        defaultSymbol: true,
        title: i18n.viewer.social.menuTitle,
        layer: clusterLayer.featureLayer
    });
    // set default visible of the two
    if (configOptions.socialDisplay === 'heatmap' && isCanvasSupported()) {
        if (heatLayer) {
            heatLayer.setVisibility(true);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(false);
        }
    } else {
        if (heatLayer) {
            heatLayer.setVisibility(false);
        }
        if (clusterLayer) {
            clusterLayer.setVisibility(true);
        }
    }
    // append list container
    var node = dojo.byId('socialMenu');
    if (node) {
        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.social.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="socialList"></ul>';
    }
    // if flickr
    if (configOptions.showFlickr) {
        flickrLayer = new social.flickr({
            map: map,
            title: configOptions.flickrTitle,
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
        dojo.connect(flickrLayer, 'onUpdate', function () {
            updateDataPoints();
        });
        dojo.connect(flickrLayer, 'onClear', function () {
            updateDataPoints();
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.flickrID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(flickrLayer, 'onUpdateEnd', function () {
            var totalCount = flickrLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.flickrID + ']'), dojo.query('#FLLoad'));
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
    }
    // if twitter
    if (configOptions.showTwitter) {
        twitterLayer = new social.twitter({
            map: map,
            title: configOptions.twitterTitle,
            id: configOptions.twitterID,
            searchTerm: configOptions.twitterSearch,
            symbolUrl: configOptions.twitterSymbol.url,
            symbolHeight: configOptions.twitterSymbol.height,
            symbolWidth: configOptions.twitterSymbol.width,
            popupWidth: configOptions.popupWidth,
            popupHeight: configOptions.popupHeight
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
        dojo.connect(twitterLayer, 'onClear', function () {
            updateDataPoints();
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.twitterID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(twitterLayer, 'onUpdateEnd', function () {
            var totalCount = twitterLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.twitterID + ']'), dojo.query('#TWLoad'));
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
    }
    // if youtube
    if (configOptions.showYouTube) {
        youtubeLayer = new social.youtube({
            map: map,
            title: configOptions.youtubeTitle,
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
        dojo.connect(youtubeLayer, 'onClear', function () {
            updateDataPoints();
            var node = dojo.query('#socialMenu .layer[data-layer=' + configOptions.youtubeID + '] .count')[0];
            if (node) {
                node.innerHTML = '';
            }
        });
        dojo.connect(youtubeLayer, 'onUpdateEnd', function () {
            var totalCount = youtubeLayer.getStats().geoPoints;
            hideLoading(dojo.query('#socialMenu ul li[data-layer=' + configOptions.youtubeID + ']'), dojo.query('#YTLoad'));
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
    }
    insertSMToggle();
    insertSettingsHTML();
    configureSettingsUI();

    // onclick connect
    dojo.connect(clusterLayer.featureLayer, "onClick",

    function (evt) {
        dojo.stopEvent(evt);
        var arr = [];
        var query = new esri.tasks.Query();
        query.geometry = evt.graphic.attributes.extent;
        if (configOptions.showTwitter) {
            arr.push(twitterLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        if (configOptions.showFlickr) {
            arr.push(flickrLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        if (configOptions.showYouTube) {
            arr.push(youtubeLayer.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
        }
        configOptions.customPopup.setFeatures(arr);
        configOptions.customPopup.show(evt.mapPoint);
        configOptions.customPopup.resize(configOptions.popupWidth, configOptions.popupHeight);
        overridePopupTitle();
        hideAllMenus();
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