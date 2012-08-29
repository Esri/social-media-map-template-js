// Set false url param strings to false
function setFalseValues(obj) {
    // for each key
    for (var key in obj) {
        // if not a prototype
        if (obj.hasOwnProperty(key)) {
            // if is a false value string
            if (typeof obj[key] === 'string' && (obj[key].toLowerCase() === 'false' || obj[key].toLowerCase() === 'null' || obj[key].toLowerCase() === 'undefined')) {
                // set to false bool type
                obj[key] = false;
            }
            // if it's a true string
            else if (typeof obj[key] === 'string' && obj[key].toLowerCase() === 'true') {
                obj[key] = true;
            }
        }
    }
    // return object
    return obj;
}

// set application configuration settings
function setAppIdSettings(callback) {
    if (configOptions.appid) {
        var requestHandle = esri.request({
            url: configOptions.sharingurl + "/" + configOptions.appid + "/data",
            content: {
                f: "json"
            },
            callbackParamName: "callback",
            // on load
            load: function (response) {
                // check for false value strings
                var appSettings = setFalseValues(response.values);
                // set other config options from app id
                dojo.mixin(configOptions, appSettings);
                // callback function
                if (typeof callback === 'function') {
                    // call callback function
                    callback.call(this);
                }
            },
            // on error
            error: function (response) {
                var error = response.message;
                // show error dialog
                var dialog = new dijit.Dialog({
                    title: i18n.viewer.errors.general,
                    content: '<div class="padContainer">' + error + '</div>'
                });
                dialog.show();
            }
        });
    } else {
        // callback function
        if (typeof callback === 'function') {
            // call callback function
            callback.call(this);
        }
    }
}

// get URL params
function configUrlParams() {
    // set url object
    urlObject = esri.urlToObject(document.location.href);
    // make sure it's an object
    urlObject.query = urlObject.query || {};
    // check for false value strings
    urlObject.query = setFalseValues(urlObject.query);
    // mix in settings
    dojo.mixin(configOptions, urlObject.query);
}

// SET SHARING
function setSharing(isPreviewPage) {
    // parameters to share
    var urlParams = ['webmap', 'basemap', 'extent', 'locateName', 'layers', 'youtubeSearch', 'youtubeRange', 'youtubeChecked', 'twitterSearch', 'twitterChecked', 'flickrSearch', 'flickrRange', 'flickrChecked', 'socialDistance', 'socialPoint', 'socialDisplay', 'locatePoint'];
    if (urlParams) {
        configOptions.shareParams = '';
        // for each parameter
        for (var i = 0; i < urlParams.length; i++) {
            // if it's set in configOptions
            if (configOptions.hasOwnProperty(urlParams[i]) && configOptions[urlParams[i]].toString() !== '') {
                // if it's the first param
                if (i === 0) {
                    configOptions.shareParams = '?';
                } else {
                    configOptions.shareParams += '&';
                }
                // show it
                configOptions.shareParams += urlParams[i] + '=' + encodeURIComponent(configOptions[urlParams[i]].toString());
            }
        }
        // Sharing url
        configOptions.shareURL = urlObject.path + configOptions.shareParams;
        // quick embed width
        var embedWidth = configOptions.embedWidth || configOptions.embedSizes.medium.width;
        var embedHeight = configOptions.embedHeight || configOptions.embedSizes.medium.height;
        // iframe code
        configOptions.embedURL = '<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="' + embedWidth + '" height="' + embedHeight + '" align="center" src="' + configOptions.shareURL + '"></iframe>';
        // preview page
        if (isPreviewPage) {
            // set iframe
            dojo.query('#inputEmbed').attr('value', configOptions.embedURL);
        } else {
            // Quick embed code
            dojo.query('#quickEmbedCode').attr('value', configOptions.embedURL);
            // sharing url
            dojo.query('#inputShare').attr('value', configOptions.shareURL);
        }
    }
}

// set defaults for config
function setDefaultConfigOptions() {
    configOptions.templateVersion = "3.00";
    if (!configOptions.portalUrl) {
        configOptions.portalUrl = location.protocol + '//' + location.host + "/";
    }
    if (!configOptions.proxyUrl) {
        configOptions.proxyUrl = location.protocol + '//' + location.host + "/sharing/proxy";
    }
    if (!configOptions.sharingurl) {
        configOptions.sharingurl = location.protocol + '//' + location.host + "/sharing/rest/content/items";
    }
    if (!configOptions.locateName) {
        configOptions.locateName = "";
    }
    configOptions.locatorserviceurl = location.protocol + '//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
    configOptions.popupWidth = 375;
    configOptions.popupHeight = 200;
    configOptions.previewSize = {
        "width": 900,
        "height": 750
    };
    configOptions.embedSizes = {
        "small": {
            width: 480,
            height: 360
        },
        "medium": {
            width: 700,
            height: 525
        },
        "large": {
            width: 940,
            height: 705
        },
        "maximum": {
            width: 1900,
            height: 1200
        },
        "minimum": {
            width: 350,
            height: 250
        }
    };
    configOptions.socialSliderValues = [{
        "label": i18n.viewer.distanceSlider.local,
        "id": "local", // url param, don't localize
        "values": {
            "yt": 50,
            "tw": 50,
            "fl": 50
        }
    }, {
        "label": i18n.viewer.distanceSlider.regional,
        "id": "regional", // url param, don't localize
        "values": {
            "yt": 300,
            "tw": 300,
            "fl": 300
        }
    }, {
        "label": i18n.viewer.distanceSlider.national,
        "id": "national", // url param, don't localize
        "values": {
            "yt": 600,
            "tw": 600,
            "fl": 600
        }
    }];
    configOptions.flickrID = "flickr";
    configOptions.flickrTitle = i18n.viewer.flickr.title;
    configOptions.flickrDescription = i18n.viewer.flickr.description;
    configOptions.flickrIcon = "images/social/flickr16x16.png";
    configOptions.flickrSymbol = {
        "url": "images/map/flickr25x30.png",
        "width": "18.75",
        "height": "22.5"
    };
    configOptions.twitterID = "twitter";
    configOptions.twitterTitle = i18n.viewer.twitter.title;
    configOptions.twitterDescription = i18n.viewer.twitter.description;
    configOptions.twitterIcon = "images/social/twitter16x16.png";
    configOptions.twitterSymbol = {
        "url": "images/map/twitter25x30.png",
        "width": "18.75",
        "height": "22.5"
    };
    configOptions.youtubeID = "youtube";
    configOptions.youtubeTitle = i18n.viewer.youtube.title;
    configOptions.youtubeDescription = i18n.viewer.youtube.description;
    configOptions.youtubeIcon = "images/social/youtube16x16.png";
    configOptions.youtubeSymbol = {
        "url": "images/map/youtube25x30.png",
        "width": "18.75",
        "height": "22.5"
    };
    if (configOptions.socialPoint) {
        configOptions.socialPoint = configOptions.socialPoint.split(',');
    } else {
        configOptions.socialPoint = [];
    }
    if (configOptions.layers) {
        configOptions.layers = configOptions.layers.split(',');
    } else {
        configOptions.layers = [];
    }
    if (configOptions.locatePoint) {
        configOptions.locatePoint = configOptions.locatePoint.split(',');
    } else {
        configOptions.locatePoint = [];
    }
    if (window.dojoConfig.locale && window.dojoConfig.locale.indexOf("ar") !== -1) {
        //right now checking for Arabic only, to generalize for all RTL languages
        configOptions.isRightToLeft = true; // configOptions.isRightToLeft property setting to true when the locale is 'ar'
    }
    var dirNode = dojo.query('html');
    if (configOptions.isRightToLeft) {
        dirNode.attr("dir", "rtl");
        dirNode.addClass('esriRtl');
    } else {
        dirNode.attr("dir", "ltr");
        dirNode.addClass('esriLtr');
    }
    // socialDistance
    configOptions.socialSliderCurrent = 1;
    if (configOptions.socialSliderValues) {
        for (var i = 0; i < configOptions.socialSliderValues.length; i++) {
            if (configOptions.socialDistance.toLowerCase() === configOptions.socialSliderValues[i].id) {
                configOptions.socialSliderCurrent = i;
            }
        }
    }
}

// make sure config options are correct
function validateConfig() {
    // Set geometry to HTTPS if protocol is used
    if (configOptions.geometryserviceurl && location.protocol === "https:") {
        configOptions.geometryserviceurl = configOptions.geometryserviceurl.replace('http:', 'https:');
    }
    // https locator url
    if (configOptions.locatorserviceurl && location.protocol === "https:") {
        configOptions.locatorserviceurl = configOptions.locatorserviceurl.replace('http:', 'https:');
    }
    // https sharing url
    if (configOptions.sharingurl && location.protocol === "https:") {
        configOptions.sharingurl = configOptions.sharingurl.replace('http:', 'https:');
    }
    // https portal url
    if (configOptions.portalUrl && location.protocol === "https:") {
        configOptions.portalUrl = configOptions.portalUrl.replace('http:', 'https:');
    }
    // set defaults
    esri.arcgis.utils.arcgisUrl = configOptions.sharingurl;
    esri.config.defaults.geometryService = new esri.tasks.GeometryService(configOptions.geometryserviceurl);
    esri.config.defaults.io.proxyUrl = configOptions.proxyUrl;
    esri.config.defaults.io.corsEnabledServers = [location.protocol + '//' + location.host];
    esri.config.defaults.io.alwaysUseProxy = false;
}

// Canvas detection
function isCanvasSupported() {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
}

// Alert box
function alertDialog(text) {
    if (configOptions.alertDialog) {
        configOptions.alertDialog.destroy();
    }
    if (configOptions.alertCloseConnect) {
        dojo.disconnect(configOptions.alertCloseConnect);
    }
    var html = '';
    html += '<div class="padContainer">';
    html += '<div>';
    html += text;
    html += '</div>';
    html += '<div class="buttons">';
    html += '<span id="closeAlert" tabindex="0" class="mapSubmit">' + i18n.viewer.general.ok + '</span>';
    html += '</div>';
    html += '</div>';
    var props = {
        style: "width: 350px",
        draggable: true,
        modal: false,
        showTitle: true,
        title: i18n.viewer.errors.general,
        content: html
    };
    configOptions.alertDialog = new dijit.Dialog(props, dojo.byId('alertDialog'));
    configOptions.alertDialog.show();
    configOptions.alertCloseConnect = dojo.query(document).delegate("#closeAlert", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            configOptions.alertDialog.hide();
        }
    });
}

// zebra stripe css object
function zebraStripe(obj) {
    obj.removeClass("stripe");
    obj.filter(":nth-child(2)").addClass("stripe");
}

// return correct button class
function getButtonClass(i, size) {
    if ((i === 1) && (i === size)) {
        return 'buttonSingle';
    } else {
        switch (i) {
        case 1:
            return 'buttonLeft';
        case size:
            return 'buttonRight';
        default:
            return 'buttonCenter';
        }
    }
}

// create the basemap gallery when active
function createBMGallery() {
    var basemapGroup = false;
    if (!configOptions.useArcGISOnlineBasemaps) {
        basemapGroup = {
            title: configOptions.basemapGroupTitle,
            owner: configOptions.basemapGroupOwner
        };
    }
    // basemap gallery
    configOptions.bmDijit = new esri.dijit.BasemapGallery({
        showArcGISBasemaps: configOptions.useArcGISOnlineBasemaps,
        bingMapsKey: configOptions.bingMapsKey,
        basemapsGroup: basemapGroup,
        map: map
    }, dojo.create("div"));
    // start it up
    configOptions.bmDijit.startup();
    // on error
    dojo.connect(configOptions.bmDijit, "onError", function (msg) {
        console.log(msg);
    });
    // on change
    dojo.connect(configOptions.bmDijit, "onSelectionChange", baseMapChanged);
    // on initial load
    dojo.connect(configOptions.bmDijit, "onLoad", function () {
        dojo.query('#map').removeClass('mapLoading');
        selectCurrentBasemap();
    });
}

// Gets current basemap ID by its title
function getBasemapIdTitle(title) {
    var bmArray = configOptions.bmDijit.basemaps;
    if (bmArray) {
        for (var i = 0; i < bmArray.length; i++) {
            if (bmArray[i].title === title) {
                return bmArray[i].id;
            }
        }
    }
    return false;
}

// Gets current basemap id by its Item ID on arcgisonline
function getBasemapId(itemId) {
    var bmArray = configOptions.bmDijit.basemaps;
    if (bmArray) {
        for (var i = 0; i < bmArray.length; i++) {
            if (bmArray[i].itemId === itemId) {
                return bmArray[i].id;
            }
        }
    }
    return false;
}

// Selects a basemap by its title
function selectCurrentBasemap() {
    var bmid;
    if (configOptions.basemap) {
        bmid = getBasemapId(configOptions.basemap);
        if (bmid) {
            configOptions.bmDijit.select(bmid);
        }
    } else {
        bmid = getBasemapIdTitle(configOptions.basemapTitle);
        if (bmid) {
            configOptions.bmDijit.select(bmid);
        }
    }
}

// on change of basemap, update selected basemap global variable
function baseMapChanged() {
    // get currently selected basemap
    var basemap = configOptions.bmDijit.getSelected();
    // update global
    configOptions.basemap = basemap.itemId;
    // set sharing links and embed code
    setSharing();
}

// Show spinner on object
function showLoading(obj) {
    if (obj) {
        dojo.query('#' + obj).removeClass('LoadingComplete').addClass('Loading').style('display', 'inline-block');
    }
}

// Set initial extent for future use
function setExtentValues() {
    // if extent not set from Url
    if (!configOptions.extent) {
        configOptions.startExtent = map.extent;
    } else {
        var splitExtent = configOptions.extent.split(',');
        // Loaded from URL
        configOptions.startExtent = new esri.geometry.Extent({
            xmin: parseFloat(splitExtent[0]),
            ymin: parseFloat(splitExtent[1]),
            xmax: parseFloat(splitExtent[2]),
            ymax: parseFloat(splitExtent[3]),
            spatialReference: map.extent.spatialReference
        });
    }
}

// update position of menu for right side buttons
function updateRightMenuOffset(button, menu) {
    var buttonObj = dojo.query(button)[0];
    var menuObj = dojo.query(menu)[0];
    if (buttonObj && menuObj) {
        var offset = dojo.position(buttonObj);
        var vs = dojo.window.getBox();
        if (offset) {
            var position = vs.w - (offset.x + offset.w);
            dojo.style(menuObj, {
                "right": position + 'px'
            });
        }
    }
}

// update position of menu for left side buttons
function updateLeftMenuOffset(button, menu) {
    var btn = dojo.query(button)[0];
    var mnu = dojo.query(menu)[0];
    if (btn && mnu) {
        var offset = dojo.position(btn);
        var leftOffset = offset.x;
        dojo.style(mnu, {
            "left": leftOffset + 'px'
        });
    }
}

// Show dropdown menu
function showMenu(menuObj, buttonObj) {
    dojo.query('#mapcon .menuSelected').removeClass('menuSelected');
    if (menuObj) {
        dojo.fx.wipeIn({
            node: menuObj,
            duration: 200
        }).play();
        dojo.query(menuObj).addClass('menuSelected');
    }
    if (buttonObj) {
        dojo.query(buttonObj).addClass('barSelected');
    }
}

// Hide dropdown menu
function hideMenu(menuObj) {
    if (menuObj) {
        dojo.fx.wipeOut({
            node: menuObj,
            duration: 200
        }).play();
        dojo.query('#mapcon .menuSelected').removeClass('menuSelected');
    }
}

// Hide layer info boxes
function hideLayerInfo() {
    dojo.query('.listMenu ul li .infoHidden').style('display', 'none');
    dojo.query('.listMenu ul li').removeClass('active');
}

// hide all dropdown menus
function hideAllMenus() {
    dojo.query('#topMenuCon .barButton').removeClass('barSelected');
    dojo.query('#mapcon .menuSelected').forEach(function (selectTag) {
        hideMenu(selectTag);
    });
}

// toggle menu object
function toggleMenus(menu) {
    if (menu) {
        // get nodes
        var menuQuery = dojo.query('#dataMenuCon [data-menu="' + menu + '"]')[0];
        var buttonQuery = dojo.query('#topMenuCon [data-menu="' + menu + '"]')[0];
        // remove selected buttons
        dojo.query('#topMenuCon .barButton').removeClass('barSelected');
        if (menuQuery) {
            if (dojo.hasClass(menuQuery, "menuSelected")) {
                hideMenu(menuQuery);
            } else {
                hideAllMenus();
                showMenu(menuQuery, buttonQuery);
            }
        }
        configOptions.customPopup.hide();
        hideLayerInfo();
    } else {
        hideAllMenus();
    }
}

// remove loading spinners
function hideLoading(obj, obj2) {
    if (obj) {
        obj.removeClass('cLoading');
    }
    if (obj2) {
        obj2.removeClass('Loading').addClass('LoadingComplete');
    }
}

// clear popup content, title and features
function clearPopupValues() {
    configOptions.customPopup.setContent('');
    configOptions.customPopup.setTitle('');
    configOptions.customPopup.clearFeatures();
}

// set the order of these functions
function setConfigOptions() {
    configUrlParams();
    setDefaultConfigOptions();
    validateConfig();
}