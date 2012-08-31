// Get results from locator
function locateQuery(text, wkid, maxLocations, callback) {
    // Max results
    if (!maxLocations) {
        maxLocations = 1;
    }
    if (!wkid) {
        wkid = 102100;
    }
    // Query object
    var queryContent = {
        "text": text,
        "outSR": wkid,
        "outFields": "*",
        "maxLocations": maxLocations,
        "f": "json"
    };
    // send request
    var requestHandle = esri.request({
        url: configOptions.locatorserviceurl + '/find',
        content: queryContent,
        callbackParamName: "callback",
        // on load
        load: function (response) {
            if (typeof callback === 'function') {
                // call callback function
                callback.call(this, response);
            }
        }
    });
}

// clear the locate graphic
function resetLocateLayer() {
    if (configOptions.locateLayer) {
        configOptions.locateLayer.clear();
    }
    configOptions.locateName = "";
    setSharing();
}

// hide auto complete results timeout
function resetHideACTimeout() {
    clearTimeout(configOptions.autocompleteTimer);
    configOptions.autocompleteTimer = setTimeout(hideAC, 6000);
}

// LOCATE
function locate() {
    var query = dojo.query('#address').attr('value')[0];
    if (query) {
        locateQuery(query, map.extent.spatialReference.wkid, 1, showResults);
        setSharing();
    } else {
        alertDialog(i18n.viewer.errors.noText);
    }
}

// SHOW AUTOCOMPLETE
function showAutoComplete(results) {
    configOptions.autocompleteResults = results;
    resetHideACTimeout();
    var aResults = '';
    var addressPosition = dojo.query('#address').parent('.iconInput')[0];
    var offset = dojo.position(addressPosition);
    var partialMatch = dojo.query('#address').attr('value');
    var regex = new RegExp('(' + partialMatch + ')', 'gi');
    var autoCompleteObj = dojo.query('#autoComplete');
    autoCompleteObj.style({
        'left': offset.x + 'px',
        'top': offset.y + 28 + 'px'
    });
    aResults += '<ul class="zebraStripes">';
    var i;
    for (i = 0; i < results.locations.length; ++i) {
        var layerClass = '';
        if (i % 2 === 0) {
            layerClass = '';
        } else {
            layerClass = 'stripe';
        }
        aResults += '<li data-index="' + i + '" tabindex="0" class="' + layerClass + '">' + results.locations[i].name.replace(regex, '<span>' + partialMatch + '</span>') + '</li>';
    }
    aResults += '</ul>';
    if (results.locations.length > 0) {
        if (autoCompleteObj[0]) {
            autoCompleteObj[0].innerHTML = aResults;
        }
        autoCompleteObj.style('display', 'block');
    } else {
        hideAC();
    }

}

function setMarker(point, address) {
    if (configOptions.pointGraphic) {
        // CREATE POINT MARKER
        var pointGraphic = new esri.symbol.PictureMarkerSymbol(configOptions.pointGraphic, 21, 29).setOffset(0, 12);
        var locationGraphic = new esri.Graphic(point, pointGraphic);
        // IF LOCATE RESULTS
        if (configOptions.locateLayer) {
            configOptions.locateLayer.clear();
            clearPopupValues();
            configOptions.customPopup.hide();
        } else {
            configOptions.locateLayer = new esri.layers.GraphicsLayer();
            dojo.connect(configOptions.locateLayer, "onClick",

            function (evt) {
                clearPopupValues();
                dojo.stopEvent(evt);
                var content = "<strong>" + evt.graphic.attributes.address + "</strong>";
                configOptions.customPopup.setContent(content);
                configOptions.customPopup.setTitle(i18n.viewer.search.location);
                configOptions.customPopup.show(evt.graphic.geometry);
            });
            map.addLayer(configOptions.locateLayer);
        }
        // graphic
        locationGraphic.setAttributes({
            "address": address
        });
        configOptions.locateLayer.add(locationGraphic);
    }
}

// SHOW RESULTS
function showResults(results, resultNumber) {
    // IF RESULT
    if (results.locations.length > 0) {
        // NUM RESULT VARIABLE
        var numResult = 0;
        // IF RESULT NUMBER
        if (resultNumber) {
            numResult = resultNumber;
        }
        // new extent
        var extent = new esri.geometry.Extent(results.locations[numResult].extent);
        // center of extent
        var point = extent.getCenter();
        // set marker
        configOptions.locatePoint[0] = point.x;
        configOptions.locatePoint[1] = point.y;
        // set point marker
        setMarker(point, results.locations[numResult].name);
        dojo.query('#address').attr('value', results.locations[numResult].name);
        configOptions.locateName = results.locations[numResult].name;
        // SET EXTENT CONVERTED TO WEB MERCATOR
        map.setExtent(extent);
    } else {
        alertDialog(i18n.viewer.errors.noLocation);
        resetLocateLayer();
        clearAddress(dojo.query('#address'));
    }
    hideAC();
}

// HIDE AUTO COMPLETE
function hideAC() {
    dojo.query('#autoComplete').style('display', 'none');
}

// CLEAR ADDRESS FUNCTION THAT REMOVES BUTTON AS WELL
function clearAddress(obj) {
    dojo.query(obj).attr('value', '');
    var iconReset = dojo.query(obj).prev('.iconClear');
    iconReset.removeClass('iconReset').attr('title', '');
}

// CHECKS TO SEE IF ADDRESS IS POPULATED
function checkAddressStatus(obj) {
    var cAVal = dojo.query(obj).attr('value')[0];
    var iconReset = dojo.query(obj).prev('.iconClear');
    if (cAVal !== '') {
        iconReset.addClass('iconReset').attr("title", i18n.viewer.search.clearLocation);
    } else {
        clearAddress(obj);
    }
}

// RESIZE MAP FUNCTION
function resizeMap() {
    //clear any existing resize timer
    clearTimeout(configOptions.mapTimer);
    //create new resize timer with delay of 500 milliseconds
    configOptions.mapTimer = setTimeout(function () {
        if (map) {
            var barHeight = 0,
                chartHeight = 0;
            // GET HEIGHT OF MENU BAR
            var menuBar = dojo.byId('topMenuBar');
            if (menuBar) {
                var menuPos = dojo.position(menuBar);
                barHeight = menuPos.h;
            }
            // GET HEIGHT OF MENU BAR
            var chartNode = dojo.byId('graphBar');
            if (chartNode) {
                var chartPos = dojo.position(chartNode);
                chartHeight = chartPos.h;
            }
            // GET HEIGHT OF WINDOW
            var vs = dojo.window.getBox();
            var windowHeight = vs.h;
            var node = dojo.byId('map');
            if (node) {
                dojo.style(node, {
                    "height": windowHeight - barHeight - chartHeight + 'px'
                });
            }
            // RESIZE
            map.resize();
            map.reposition();
            // update location of menus
            updateLeftMenuOffset('#shareMap', '#shareControls');
            updateLeftMenuOffset('#placesButton', '#placesMenu');
            updateRightMenuOffset('#layersButton', '#layersMenu');
            updateRightMenuOffset('#basemapButton', '#basemapMenu');
            updateRightMenuOffset('#legendButton', '#legendMenu');
            updateRightMenuOffset('socialButton', '#socialMenu');
        }
    }, 500);
}

// Toggle show/hide about map info
function toggleAboutMap(obj) {
    if (configOptions.aboutDialog) {
        if (!configOptions.aboutDialog.get('open')) {
            configOptions.aboutDialog.show();
            dojo.query(obj).addClass('barSelected');
        } else {
            configOptions.aboutDialog.hide();
            dojo.query(obj).removeClass('barSelected');
        }
    }
}

// SET TW LINK
function setTWLink(shLink) {
    if (shLink) {
        var fullLink;
        var w = 650;
        var h = 400;
        var left = (screen.width/2) - (w/2);
        var top = (screen.height/2) - (h/2);
        fullLink = 'https://twitter.com/intent/tweet?' + 'url=' + encodeURIComponent(shLink) + '&text=' + encodeURIComponent(configOptions.itemInfo.item.snippet) + '&hashtags=' + 'EsriSMT';
        window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
    }
}

// SET FB LINK
function setFBLink(fbLink) {
    if (fbLink) {
        var fullLink;
        var w = 650;
        var h = 360;
        var left = (screen.width/2)-(w/2);
        var top = (screen.height/2)-(h/2);
        fullLink = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(fbLink) + '&t=' + encodeURIComponent(configOptions.itemInfo.item.snippet);
        window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
    }
}

// RIGHT SIDE MENU BUTTONS
function rightSideMenuButtons() {
    var html = '<div id="menuListCon">';
    var node;
    if (configOptions.showLegendMenu && configOptions.layerInfos && configOptions.layerInfos.length > 0) {
        html += '<span tabindex="0" id="legendButton" data-menu="legend" class="barButton" title="' + i18n.viewer.buttons.legendTitle + '">' + i18n.viewer.buttons.legend + '<span class="arrow"></span></span>';
        // Social MENU TOGGLE
        dojo.query(document).delegate("#legendButton", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                toggleMenus('legend');
            }
        });
    }
    if (configOptions.showBasemapMenu) {
        html += '<span tabindex="0" id="basemapButton" data-menu="basemap" class="barButton" title="' + i18n.viewer.buttons.basemapTitle + '">' + i18n.viewer.buttons.basemap + '<span class="arrow"></span></span>';
        // Basemap MENU TOGGLE
        dojo.query(document).delegate("#basemapButton", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                toggleMenus('basemap');
            }
        });
        node = dojo.byId('basemapMenu');
        if (node) {
            node.innerHTML = '<div class="slideScroll"><div id="baseContainer"></div></div>';
        }
        // basemap gallery prepend to node
        if (configOptions.bmDijit) {
            dojo.place(configOptions.bmDijit.domNode, dojo.byId("baseContainer"), "first");
        }
    }
    if (configOptions.showLayersMenu) {
        html += '<span tabindex="0" id="layersButton" data-menu="layers" class="barButton" title="' + i18n.viewer.buttons.layersTitle + '">' + i18n.viewer.buttons.layers + '<span class="arrow"></span></span>';
        // Layers MENU TOGGLE
        dojo.query(document).delegate("#layersButton", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                toggleMenus('layers');
            }
        });
    }
    if (configOptions.showSocialMenu) {
        html += '<span tabindex="0" id="socialButton" data-menu="social" class="barButton" title="' + i18n.viewer.buttons.socialTitle + '">' + i18n.viewer.buttons.social + '<span class="arrow"></span></span>';
        // Social MENU TOGGLE
        dojo.query(document).delegate("#socialButton", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                toggleMenus('social');
            }
        });
    }
    html += '</div>';
    node = dojo.byId('menuList');
    if (node) {
        node.innerHTML = html;
    }
    // Show Default Menu
    if (configOptions.defaultMenu) {
        switch(configOptions.defaultMenu){
            case 'places':
                if(configOptions.showPlaces){
                    toggleMenus(configOptions.defaultMenu);
                }
                break;
            case 'basemap':
                if(configOptions.showBasemapMenu){
                    toggleMenus(configOptions.defaultMenu);
                }
                break;
            case 'layers':
                if(configOptions.showLayersMenu){
                    toggleMenus(configOptions.defaultMenu);
                }
                break;
            case 'social':
                if(configOptions.showSocialMenu){
                    toggleMenus(configOptions.defaultMenu);
                }
                break;
            case 'legend':
                if(configOptions.showLegendMenu){
                    toggleMenus(configOptions.defaultMenu);
                }
                break;
        }
    }
    // Show Menu Bar
    dojo.query('#topMenuBar').style('display', 'block');
}

// CONFIGURE SHARE MENU
function configureShareMenu() {
    if (configOptions.showShareMenu) {
        var node = dojo.query('#shareMap')[0];
        if (node) {
            node.innerHTML = '<span tabindex="0" id="shareIcon" data-menu="share" class="barButton" title="' + i18n.viewer.buttons.linkTitle + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.link + '<span class="arrow"></span></span></div><div class="clear">';
        }
        var html = '';
        html += '<div class="shareContainer">';
        html += '<div class="Pad">';
        html += '<h3>' + i18n.viewer.shareMenu.shareHeader + '</h3>';
        html += '<input id="inputShare" value="" type="text" class="mapInput inputSingle" size="20" readonly>';
        html += '<span tabindex="0" id="fbImage" title="' + i18n.viewer.shareMenu.facebookHeader + '"><span class="icon"></span>' + i18n.viewer.shareMenu.facebook + '</span><span tabindex="0" id="twImage" title="' + i18n.viewer.shareMenu.twitterHeader + '"><span class="icon"></span>' + i18n.viewer.shareMenu.twitter + '</span></div>';
        html += '<h3>' + i18n.viewer.shareMenu.instructionHeader + '</h3>';
        html += '<textarea rows="3" id="quickEmbedCode"></textarea>';
        if (configOptions.previewPage) {
            html += '<p id="embedOptions">' + i18n.viewer.shareMenu.preview + '</p>';
        }
        node = dojo.query('#shareControls')[0];
        if (node) {
            node.innerHTML = html;
        }
        // EMBED MODAL CLICK
        if (configOptions.previewPage) {
            // on click
            dojo.query(document).delegate("#embedOptions", "onclick,keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    var w = configOptions.previewSize.width;
                    var h = configOptions.previewSize.height;
                    var left = (screen.width/2) - (w/2);
                    var top = (screen.height/2) - (h/2);
                    window.open(configOptions.previewPage + configOptions.shareParams, 'embed', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
                }
            });
        }
        // SHARE MENU TOGGLE
        dojo.query(document).delegate("#shareIcon", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                toggleMenus('share');
            }
        });
        // Share Buttons
        dojo.query(document).delegate("#fbImage", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                setFBLink(configOptions.shareURL);
                return false;
            }
        });
        dojo.query(document).delegate("#twImage", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                setTWLink(configOptions.shareURL);
                return false;
            }
        });
    }
}

// SHOW SEARCH
function configureSearchBox() {
    if (configOptions.showSearchBox) {
        var html = '<div id="locateCon" class="iconInput">';
        html += '<div tabindex="0" id="submitAddress" class="iconSearch" title="' + i18n.viewer.search.placeholder + '"></div>';
        html += '<div tabindex="0" id="clearAddress" class="iconClear"></div>';
        html += '<input placeholder="' + i18n.viewer.search.placeholder + '" id="address" title="' + i18n.viewer.search.placeholder + '" value="' + configOptions.locateName + '" class="default" autocomplete="off" type="text" tabindex="1">';
        html += '</div>';
        var node = dojo.query('#locateBox')[0];
        if (node) {
            node.innerHTML = html;
        }
        // SEARCH BOX JAVASCRIPT
        dojo.query(document).delegate("#address", "onclick", function (event) {
            if (event.type === 'click') {
                var cAVal2 = dojo.query(this).attr('value');
                if (cAVal2 === '') {
                    clearAddress(this);
                }
                hideAC();
            }
        });
        dojo.query(document).delegate("#submitAddress", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                clearTimeout(configOptions.mapTimer);
                resetLocateLayer();
                locate();
                hideAC();
            }
        });
        // AUTO COMPLETE && ADDRESS SPECIFIC ACTION LISTENERS
        dojo.query(document).delegate('#address', "keyup", function (event) {
            var aquery = dojo.query(this).attr('value')[0];
            var alength = aquery.length;
            var lists;
            if (event.keyCode === 13 && dojo.query(this).attr('value')[0] !== '') {
                clearTimeout(configOptions.mapTimer);
                resetLocateLayer();
                locate();
                hideAC();
            } else if (event.keyCode === 38) {
                resetHideACTimeout();
                lists = dojo.query('#autoComplete li');
                var listsLen = lists.length;
                if (listsLen) {
                    lists[listsLen - 1].focus();
                }
            } else if (event.keyCode === 40) {
                resetHideACTimeout();
                lists = dojo.query('#autoComplete li');
                if (lists[0]) {
                    lists[0].focus();
                }
            } else if (alength >= 2) {
                clearTimeout(configOptions.autocompleteShowTimer);
                configOptions.autocompleteShowTimer = setTimeout(function () {
                    locateQuery(aquery, map.extent.spatialReference.wkid, 6, showAutoComplete);
                }, 300);
            } else {
                hideAC();
            }
            checkAddressStatus(this);
        });
        dojo.query(document).delegate("#autoComplete ul li", "onclick,keyup", function (event) {
            var liSize = dojo.query('#autoComplete ul li').length;
            var locTxt = dojo.query(this).text();
            var locNum = parseInt(dojo.query(this).attr('data-index')[0], 10);
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                dojo.query('#address').attr('value', locTxt);
                configOptions.locateName = locTxt;
                setSharing();
                showResults(configOptions.autocompleteResults, locNum);
                hideAC();
            } else if (event.type === 'keyup' && event.keyCode === 38) {
                resetHideACTimeout();
                newIndex = locNum - 1;
                if (newIndex < 0) {
                    newIndex = liSize - 1;
                }
                dojo.query('#autoComplete li')[newIndex].focus();
            } else if (event.type === 'keyup' && event.keyCode === 40) {
                resetHideACTimeout();
                newIndex = locNum + 1;
                if (newIndex >= liSize) {
                    newIndex = 0;
                }
                dojo.query('#autoComplete li')[newIndex].focus();
            }
        });
        dojo.query(document).delegate("#clearAddress", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                var obj = dojo.query(this).next('input');
                clearAddress(obj);
                resetLocateLayer();
                hideAC();
            }
        });
        // LOCATE
        if (configOptions.locateName) {
            checkAddressStatus('#address');
        }
        // LOGO CLICK
        dojo.query(document).delegate("#mapTitle", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                map.setExtent(configOptions.startExtent);
            }
        });
        dojo.query(document).delegate("#inputShare, #quickEmbedCode", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                dojo.query(this)[0].select();
            }
        });
    }
}

// SHOW ABOUT BUTTON IF URL IS SET
function configureAboutText() {
    if (configOptions.itemInfo.item.description && configOptions.showAboutDialog) {
        // INSERT HTML
        var node = dojo.byId('aboutMap');
        if (node) {
            node.innerHTML = '<span tabindex="0" class="barButton" id="aboutMap" title="' + i18n.viewer.buttons.aboutTitle + '"><span class="aboutInfo"></span>' + i18n.viewer.buttons.about + '</span>';
        }
        node = dojo.byId('aboutDialog');
        var html = '';
        html += '<div class="padContainer">';
        html += '<h2>' + configOptions.itemInfo.item.title + '</h2>';
        var widget = new dojox.form.Rating({
            numStars: 5,
            value: configOptions.itemInfo.item.avgRating
        }, null);
        html += '<div class="ratings">' + widget.domNode.outerHTML;
        html += ' (';
        // Ratings
        if (configOptions.itemInfo.item.numRatings) {
            var pluralRatings = i18n.viewer.itemInfo.ratingsLabel;
            if (configOptions.itemInfo.item.numRatings > 1) {
                pluralRatings = i18n.viewer.itemInfo.ratingsLabelPlural;
            }
            html += dojo.number.format(configOptions.itemInfo.item.numRatings) + ' ' + pluralRatings;
        }
        // comments
        if (configOptions.itemInfo.item.numComments) {
            if (configOptions.itemInfo.item.numRatings) {
                html += i18n.viewer.itemInfo.separator + ' ';
            }
            var pluralComments = i18n.viewer.itemInfo.commentsLabel;
            if (configOptions.itemInfo.item.numComments > 1) {
                pluralComments = i18n.viewer.itemInfo.commentsLabelPlural;
            }
            html += dojo.number.format(configOptions.itemInfo.item.numComments) + ' ' + pluralComments;
        }
        if ((configOptions.itemInfo.item.numRatings) || (configOptions.itemInfo.item.numComments)) {
            html += i18n.viewer.itemInfo.separator + ' ';
        }
        var pluralViews = i18n.viewer.itemInfo.viewsLabel;
        if (configOptions.itemInfo.item.numViews > 1) {
            pluralViews = i18n.viewer.itemInfo.viewsLabelPlural;
        }
        html += dojo.number.format(configOptions.itemInfo.item.numViews) + ' ' + pluralViews;
        // close container
        html += ')</div>';
        if (configOptions.itemInfo.item.thumbnail) {
            html += '<a tabindex="0" class="thumb" target="_blank" href="' + configOptions.portalUrl + 'home/item.html?id=' + configOptions.itemInfo.item.id + '"><img src="' + configOptions.sharingurl + '/' + configOptions.itemInfo.item.id + '/info/' + configOptions.itemInfo.item.thumbnail + '" alt="' + configOptions.itemInfo.item.title + '" title="' + configOptions.itemInfo.item.title + '" /></a>';
        }
        html += '<div class="desc">' + configOptions.itemInfo.item.description + '</div>';
        // vars
        var modifiedDate, modifiedLocalized;
        // modified date
        if (configOptions.itemInfo.item.modified) {
            // date object
            modifiedDate = new Date(configOptions.itemInfo.item.modified);
            // date format for locale
            modifiedLocalized = dojo.date.locale.format(modifiedDate, {
                selector: "date",
                datePattern: "MMM d, yyyy"
            });
        }
        if (modifiedLocalized) {
            html += '<div class="date">' + i18n.viewer.itemInfo.modifiedLabel + ' ' + modifiedLocalized + '. </div>';
        }
        html += '<div class="clear"></div>';
		if(configOptions.itemInfo.item.licenseInfo){
			html += '<h3>' + i18n.viewer.about.access + '</h3>';
			html += '<div class="license">' + configOptions.itemInfo.item.licenseInfo + '</div>';
		}
        html += '</div>';
        if (node) {
            node.innerHTML = html;
        }
        dojo.query(document).delegate("#aboutMap", "onclick,keyup", function (event) {
            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                this.blur();
                hideAllMenus();
                toggleAboutMap(this);
            }
        });
        var props = {
            style: "width:450px;",
            draggable: true,
            modal: false,
            showTitle: true,
            title: '<span class="aboutInfo"></span>' + i18n.viewer.about.title
        };
        configOptions.aboutDialog = new dijit.Dialog(props, dojo.byId('aboutDialog'));
        if (configOptions.showAboutDialogOnLoad) {
            configOptions.aboutDialog.show();
        }
    }
}

function createCustomSlider() {
    var node = dojo.byId('zoomSlider');
    if (node) {
        node.innerHTML = '<div id="customZoom"></div>';
    }
	
	console.log(configOptions.itemData.baseMap.baseMapLayers[0].layerObject.tileInfo);
	
	console.log(configOptions.itemData.baseMap.baseMapLayers[0]);
	
    var sliderMax = 18;
	var mapLevel = 9;
	if(map.getLevel() !== -1){
		mapLevel = map.getLevel();
	}
    if (map._params && map._params.lods) {
        sliderMax = map._params.lods.length - 1;
    }
    configOptions.mapZoomBar = new dijit.form.VerticalSlider({
        name: "slider",
        showButtons: true,
        value: mapLevel,
        minimum: 0,
        maximum: sliderMax,
        discreteValues: sliderMax,
        style: 'height:130px;',
        intermediateChanges: true,
        onChange: function (value) {
            var level = parseInt(value, 10);
            if (map.getLevel() !== level) {
                map.setLevel(level);
            }
        }
    }, "customZoom");
    dojo.connect(map, "onZoomEnd", function (evt) {
        configOptions.mapZoomBar.set("value", map.getLevel());
    });
}

// APPLICATION TITLE
function configureAppTitle() {
    document.title = configOptions.itemInfo.item.title;
    var node = dojo.byId('mapTitle');
    if (node) {
        node.innerHTML = configOptions.itemInfo.item.title;
        dojo.query(node).attr('title', i18n.viewer.general.mapTitle);
    }
}

function fixExtent() {
    map.setExtent(configOptions.startExtent);
    // set zoom level
    if (configOptions.level) {
        map.setLevel(parseInt(configOptions.level, 10));
    }
    if (configOptions.locatePoint[0] && configOptions.locatePoint[1]) {
        var point = new esri.geometry.Point([configOptions.locatePoint[0], configOptions.locatePoint[1]], new esri.SpatialReference({
            wkid: map.spatialReference.wkid
        }));
        if (point) {
            setMarker(point, configOptions.locateName);
        }
    }

}

// Configure
function configureUserInterface() {
    configureAppTitle();
    createCustomSlider();
    rightSideMenuButtons();
    configureShareMenu();
    configureSearchBox();
    configureAboutText();
    // short delay
    setTimeout(function () {
        fixExtent();
        setTimeout(function () {
            updateSocialLayers();
            dojo.connect(map, "onExtentChange", function (extent) {
                // update current extent
                configOptions.extent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
                // update sharing link
                setSharing();
                // hide auto complete
                hideAC();
                // reset refresh timer for social media
                resetSocialRefreshTimer();
            });
        }, 750);
        setSharing();
    }, 750);
}

// add menus to dom
function addSlideMenus() {
    var html = '';
    html += '<div id="dataMenuCon">';
    html += '<div data-menu="share" id="shareControls" class="slideMenu"></div>';
    html += '<div data-menu="autocomplete" id="autoComplete" class="slideMenu"></div>';
    html += '<div data-menu="places" id="placesMenu" class="slideMenu listMenu"></div>';
    html += '<div data-menu="basemap" id="basemapMenu" class="slideMenu"></div>';
    html += '<div data-menu="layers" id="layersMenu" class="slideMenu listMenu"></div>';
    html += '<div data-menu="social" id="socialMenu" class="slideMenu listMenu"></div>';
    html += '<div data-menu="legend" id="legendMenu" class="slideMenu"><div class="slideScroll"><div id="legendContent"></div></div></div>';
    html += '</div>';
    var node = dojo.query('#mapcon')[0];
    if (node) {
        dojo.place(html, node, "last");
    }
    dojo.query('#mapcon .slideMenu').style('display', 'none');
}

// webmap object returned. Create map data
function webmapReturned(response) {
    // webmap layers
    var layers = response.itemInfo.itemData.operationalLayers;
    // webmap
    map = response.map;
    // map connect functions
    dojo.connect(configOptions.customPopup, "onHide", clearPopupValues);
    dojo.connect(window, "onresize", resizeMap);
    // webmap item info
    configOptions.itemInfo = response.itemInfo;
    // webmap item data
    configOptions.itemData = response.itemInfo.itemData;
    // use places from agol bookmarks
    configOptions.bookmarks = response.itemInfo.itemData.bookmarks;
    // webmap presentation layer
    configOptions.presentation = response.itemInfo.itemData.presentation;
    // webmap operational layers
    configOptions.itemLayers = response.itemInfo.itemData.operationalLayers;
    // webmap basemap title by default
    configOptions.basemapTitle = response.itemInfo.itemData.baseMap.title;
    // create basemap gallery widget
    createBMGallery();
    // set up layer menu
    configureLayers();
    // set up places menu
    configurePlaces();
    // resize map
    resizeMap();
    // set up social media
    configureSocialMedia();
    // init UI
    configureUserInterface();
    // start extent
    setExtentValues();
}

// Info window popup creation
function configurePopup() {
    // popup dijit configuration
    configOptions.customPopup = new esri.dijit.Popup({
        offsetX: 3,
        fillSymbol: false,
        highlight: false,
        lineSymbol: false,
        marginLeft: 10,
        marginTop: 10,
        markerSymbol: false,
        offsetY: 3,
        zoomFactor: 4
    }, dojo.create("div"));
    // connects for popup
    dojo.connect(configOptions.customPopup, "maximize", hideAllMenus);
    dojo.connect(configOptions.customPopup, "onSelectionChange", overridePopupTitle);
    // popup theme
    dojo.addClass(configOptions.customPopup.domNode, "modernGrey");
}

// Create the map object for the template
function createWebMap() {
    // configure popup
    configurePopup();
    // create map deferred with options
    var mapDeferred = esri.arcgis.utils.createMap(configOptions.webmap, 'map', {
        mapOptions: {
            slider: false,
            wrapAround180: true,
            infoWindow: configOptions.customPopup,
            isScrollWheelZoom: true
        },
        bingMapsKey: configOptions.bingMapsKey,
        geometryServiceURL: configOptions.geometryserviceurl
    });
    // on successful response
    mapDeferred.addCallback(function (response) {
        webmapReturned(response);
    });
    // on error response
    mapDeferred.addErrback(function (error) {
        console.log(i18n.viewer.errors.createMap + ": ", dojo.toJson(error));
    });
}

// Initial function
function init() {
    // Set default values
    setConfigOptions();
    // add menus
    addSlideMenus();
    // Create Map
    createWebMap();
}

// On load of libraries
dojo.addOnLoad(function () {
    // set localization
    i18n = dojo.i18n.getLocalization("esriTemplate", "template");
    var requestHandle = esri.request({
        url: 'config/config.js',
        callbackParamName: "callback",
        // on load
        load: function (data) {
            // set plugin.configOptions to default config
            configOptions = data;
            //
            configUrlParams();
            // dojo ready
            setAppIdSettings(init);
        },
        // on error
        error: function (response) {
            alertDialog(i18n.viewer.errors.general + ': ' + response);
        }
    });
});