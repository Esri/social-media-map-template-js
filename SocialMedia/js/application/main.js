define([
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/Deferred",
    "dojo/_base/event",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/date",
    "dojo/number",
    "dojo/window",
    "dojo/on",
    "dojo/fx",
    "dojo/i18n!./nls/template.js",
    "modules/HeatmapLayer",
    "modules/ClusterLayer",
    "modules/flickr",
    "modules/panoramio",
    "modules/twitter",
    "modules/ushahidi",
    "modules/youtube",
    "dijit/Dialog",
    "dijit/form/HorizontalSlider",
    "dijit/form/VerticalSlider",
    "dojo/NodeList-traverse",
    "dojo/NodeList-manipulate",
    "dojo/cookie",
    "dojo/json",
    "esri", // We're not directly using anything defined in esri.js but geometry, locator and utils are not AMD. So, the only way to get reference to esri object is through esri module (ie. esri/main)
    "esri/dijit/Geocoder",
    "esri/geometry",
    "esri/utils",
    "esri/map",
    "esri/IdentityManager",
    "esri/widgets",
    "esri/arcgis/utils"
 ],
function (ready, declare, connect, Deferred, event, array, dom, query, domClass, domConstruct, domGeom, domStyle, date, number, win, on, coreFx, i18n, HeatmapLayer, ClusterLayer, Flickr, Panoramio, Twitter, Ushahidi, YouTube, Dialog, HorizontalSlider, VerticalSlider, nlTraverse, nlManipulate, cookie, JSON, esri) {
    var Widget = declare("application.main", null, {
        constructor: function (options) {
            var _self = this;
            this.options = {};
            declare.safeMixin(_self.options, options);
            _self.setOptions();
            ready(function () {
                _self.getItemData().then(function (response) {
                    if(response){
                        // check for false value strings
                        var appSettings = _self.setFalseValues(response.values);
                        // set other config options from app id
                        _self.options = declare.safeMixin(_self.options, appSettings);
                    }
                    _self.init();
                });
            });
        },
        addReportInAppButton: function () {
            var _self = this;
            if (_self.options.bannedUsersService) {
                _self.removeReportInAppButton();
                var html = '<span id="inFlag"><a id="reportItem">Flag as inappropriate</a></span>';
                domConstruct.place(html, query('.esriPopup .actionList')[0], 'last');
                _self.options.flagConnect = connect.connect(dom.byId('reportItem'), 'onclick', function (event) {
                    var node = dom.byId('inFlag');
                    if (node) {
                        node.innerHTML = '<span id="reportLoading"></span> Reporting&hellip;';
                        _self.ReportInapp();
                    }
                });
            }
        },
        removeReportInAppButton: function () {
            query('#inFlag').orphan();
        },
        replaceFlag: function () {
            var node = dom.byId('inFlag');
            if (node) {
                node.innerHTML = '<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>';
            }
        },
        replaceFlagError: function () {
            var node = dom.byId('inFlag');
            if (node) {
                node.innerHTML = 'Error flagging content.';
            }
        },
        ReportInapp: function () {
            var _self = this;
            if (_self.options.bannedUsersService && _self.options.flagMailServer) {
                var requestHandle = esri.request({
                    url: _self.options.flagMailServer,
                    content: {
                        "op": "send",
                        "auth": "esriadmin",
                        "author": _self.options.activeFeature.attributes.filterAuthor,
                        "appname": _self.itemInfo.item.title,
                        "type": _self.options.activeFeature.attributes.filterType,
                        "content": _self.options.activeFeature.attributes.filterContent
                    },
                    handleAs: 'json',
                    callbackParamName: 'callback',
                    // on load
                    load: function () {
                        _self.replaceFlag();
                    },
                    error: function () {
                        _self.replaceFlagError();
                    }
                });
            } else {
                _self.replaceFlagError();
            }
        },
        createSMFOffensive: function () {
            var _self = this;
            if (_self.options.bannedUsersService) {
                // offensive users task
                _self.options.bannedUsersTask = new esri.tasks.QueryTask(_self.options.bannedUsersService);
                // offensive users query
                _self.options.bannedUsersQuery = new esri.tasks.Query();
                _self.options.bannedUsersQuery.where = '1=1';
                _self.options.bannedUsersQuery.returnCountOnly = false;
                _self.options.bannedUsersQuery.returnIdsOnly = false;
                _self.options.bannedUsersQuery.outFields = ["type", "author"];
                _self.options.bannedUsersTask.execute(_self.options.bannedUsersQuery, function (fset) {
                    // Banned twitter users
                    if (!_self.options.filterTwitterUsers) {
                        _self.options.filterTwitterUsers = [];
                    }
                    // Banned flickr users
                    if (!_self.options.filterFlickrUsers) {
                        _self.options.filterFlickrUsers = [];
                    }
                    // Banned youtube users
                    if (!_self.options.filterYoutubeUsers) {
                        _self.options.filterYoutubeUsers = [];
                    }
                    // features
                    var features = fset.features;
                    // for each feature
                    for (var i = 0; i < features.length; i++) {
                        // add to twitter list
                        if (parseInt(features[i].attributes.type, 10) === 2) {
                            _self.options.filterTwitterUsers.push(features[i].attributes.author);
                        }
                        // add to youtube list
                        else if (parseInt(features[i].attributes.type, 10) === 3) {
                            _self.options.filterYoutubeUsers.push(features[i].attributes.author);
                        }
                        // add to flickr list
                        else if (parseInt(features[i].attributes.type, 10) === 4) {
                            _self.options.filterFlickrUsers.push(features[i].attributes.author);
                        }
                    }
                });
            }
        },
        createSMFBadWords: function () {
            var _self = this;
            _self.options.filterWords = [];
            if (_self.options.bannedWordsService) {
                _self.options.bannedWordsTask = new esri.tasks.QueryTask(_self.options.bannedWordsService);
                _self.options.bannedWordsQuery = new esri.tasks.Query();
                _self.options.bannedWordsQuery.where = '1=1';
                _self.options.bannedWordsQuery.returnGeometry = false;
                _self.options.bannedWordsQuery.outFields = ["word"];
                _self.options.bannedWordsTask.execute(_self.options.bannedWordsQuery, function (fset) {
                    for (i = 0; i < fset.features.length; i++) {
                        _self.options.filterWords.push(fset.features[i].attributes.word);
                    }
                });
            }
        },
        // Set false url param strings to false
        setFalseValues: function (obj) {
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
        },
        // set application configuration settings
        getItemData: function (all) {
            var _self = this;
            var deferred = new Deferred();
            if (_self.options.appid) {
                var dataUrl;
                if(all){
                    dataUrl = esri.arcgis.utils.arcgisUrl + "/" + _self.options.appid;
                }
                else{
                    dataUrl = esri.arcgis.utils.arcgisUrl + "/" + _self.options.appid + "/data";
                }
                var requestHandle = esri.request({
                    url: dataUrl,
                    content: {
                        f: "json"
                    },
                    callbackParamName: "callback",
                    // on load
                    load: function (response) {
                        // callback function
                        deferred.resolve(response);
                    },
                    // on error
                    error: function (response) {
                        var error = response.message;
                        // show error dialog
                        var dialog = new Dialog({
                            title: i18n.viewer.errors.general,
                            content: '<div class="padContainer">' + error + '</div>'
                        });
                        dialog.show();
                        deferred.resolve();
                    }
                });
            } else {
                deferred.resolve();
            }
            return deferred;
        },
        getUrlObject: function () {
            var params = esri.urlToObject(document.location.href);
            // make sure it's an object
            params.query = params.query || {};
            return params;
        },
        // get URL params
        configUrlParams: function () {
            var _self = this;
            // set url object
            var params = this.getUrlObject();
            // check for false value strings
            params.query = this.setFalseValues(params.query);
            // mix in settings
            _self.options = declare.safeMixin(_self.options, params.query);
        },
        // Set sharing links
        setSharing: function () {
            var _self = this;
            // parameters to share
            var urlParams = ['webmap', 'appid', 'basemap', 'extent', 'locateName', 'layers', 'youtubeSearch', 'youtubeRange', 'youtubeChecked', 'twitterSearch', 'twitterChecked', 'flickrSearch', 'flickrRange', 'flickrChecked', 'panoramioChecked', 'socialDisplay', 'locatePoint'];
            if (urlParams) {
                _self.options.shareParams = '';
                // for each parameter
                for (var i = 0; i < urlParams.length; i++) {
                    // if it's set in _self.options
                    if (_self.options.hasOwnProperty(urlParams[i]) && (_self.options[urlParams[i]].toString() !== '') || typeof (_self.options[urlParams[i]]) === 'object') {
                        // if it's the first param
                        if (i === 0) {
                            _self.options.shareParams = '?';
                        } else {
                            _self.options.shareParams += '&';
                        }
                        // show it
                        _self.options.shareParams += urlParams[i] + '=' + encodeURIComponent(_self.options[urlParams[i]].toString());
                    }
                }
                var params = this.getUrlObject();
                // embed path URL
                var pathUrl = params.path.substring(0, params.path.lastIndexOf('/'));
                // Sharing url
                _self.options.shareURL = pathUrl + '/' + _self.options.homePage + _self.options.shareParams;
                // quick embed width
                var embedWidth = _self.options.embedWidth || _self.options.embedSizes.medium.width;
                var embedHeight = _self.options.embedHeight || _self.options.embedSizes.medium.height;
                // iframe code
                _self.options.embedURL = '<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="' + embedWidth + '" height="' + embedHeight + '" align="center" src="' + _self.options.shareURL + '"></iframe>';
                var inputEmbed = dom.byId('inputEmbed');
                if (inputEmbed) {
                    query(inputEmbed).attr('value', _self.options.embedURL);
                }
                var quickEmbed = dom.byId('quickEmbedCode');
                if (quickEmbed) {
                    query(quickEmbed).attr('value', _self.options.embedURL);
                }
                var inputShare = dom.byId('inputShare');
                if (inputShare) {
                    query(inputShare).attr('value', _self.options.shareURL);
                }
            }
        },
        // set defaults for config
        setDefaultOptions: function () {
            var _self = this;
            if (!_self.options.locateName) {
                _self.options.locateName = "";
            }
            _self.options.popupWidth = 290;
            _self.options.popupHeight = 200;
            _self.options.previewSize = {
                "width": 900,
                "height": 750
            };
            _self.options.embedSizes = {
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
            _self.options.socialLayers = [];
            _self.options.previewPage = 'preview.html';
            _self.options.homePage = 'index.html';
            _self.options.flickrID = "flickr";
            _self.options.flickrTitle = i18n.viewer.flickr.title;
            _self.options.flickrDescription = i18n.viewer.flickr.description;
            _self.options.flickrIcon = "images/social/flickr16x16.png";
            _self.options.flickrSymbol = {
                "url": "images/map/flickr25x30.png",
                "width": "18.75",
                "height": "22.5"
            };
            _self.options.twitterID = "twitter";
            _self.options.twitterTitle = i18n.viewer.twitter.title;
            _self.options.twitterDescription = i18n.viewer.twitter.description;
            _self.options.twitterIcon = "images/social/twitter16x16.png";
            _self.options.twitterSymbol = {
                "url": "images/map/twitter25x30.png",
                "width": "18.75",
                "height": "22.5"
            };
            _self.options.panoramioID = "panoramio";
            _self.options.panoramioTitle = i18n.viewer.panoramio.title;
            _self.options.panoramioDescription = i18n.viewer.panoramio.description;
            _self.options.panoramioIcon = "images/social/panoramio16x16.png";
            _self.options.panoramioSymbol = {
                "url": "images/map/panoramio25x30.png",
                "width": "18.75",
                "height": "22.5"
            };
            _self.options.youtubeID = "youtube";
            _self.options.youtubeTitle = i18n.viewer.youtube.title;
            _self.options.youtubeDescription = i18n.viewer.youtube.description;
            _self.options.youtubeIcon = "images/social/youtube16x16.png";
            _self.options.youtubeSymbol = {
                "url": "images/map/youtube25x30.png",
                "width": "18.75",
                "height": "22.5"
            };
            _self.options.ushahidiID = "ushahidi";
            _self.options.ushahidiTitle = i18n.viewer.ushahidi.title;
            _self.options.ushahidiDescription = i18n.viewer.ushahidi.description;
            _self.options.ushahidiIcon = "images/social/ushahidi16x16.png";
            _self.options.ushahidiSymbol = {
                "url": "images/map/ushahidi25x30.png",
                "width": "18.75",
                "height": "22.5"
            };
            if (!_self.options.layerInfos) {
                _self.options.layerInfos = [];
            }
            if (_self.options.layers && typeof _self.options.layers === 'string') {
                _self.options.layers = _self.options.layers.split(',');
            } else {
                _self.options.layers = [];
            }
            if (_self.options.locatePoint && typeof _self.options.locatePoint === 'string') {
                _self.options.locatePoint = _self.options.locatePoint.split(',');
            } else {
                _self.options.locatePoint = [];
            }
            if (window.dojoConfig.locale && window.dojoConfig.locale.indexOf("ar") !== -1) {
                //right now checking for Arabic only, to generalize for all RTL languages
                _self.options.isRightToLeft = true; // _self.options.isRightToLeft property setting to true when the locale is 'ar'
            }
            var dirNode = query('html');
            if (_self.options.isRightToLeft) {
                _self.options.dir = 'rtl';
                dirNode.attr("dir", "rtl");
                dirNode.addClass('esriRtl');
            } else {
                _self.options.dir = 'ltr';
                dirNode.attr("dir", "ltr");
                dirNode.addClass('esriLtr');
            }
        },
        // make sure config options are correct
        validateConfig: function () {
            var _self = this;
            //need to set the sharing url here so that when we query the applciation and organization the correct
            //location is searched.
            if (location.host.indexOf("arcgis.com") === -1) {
                //default (Not Hosted no org specified)
                esri.arcgis.utils.arcgisUrl = location.protocol + "//www.arcgis.com/sharing/rest/content/items";
            } else {
                // org app
                esri.arcgis.utils.arcgisUrl = location.protocol + '//' + location.host + "/sharing/rest/content/items";
                _self.options.proxyUrl = location.protocol + '//' + location.host + "/sharing/proxy";
            }
            //if the sharing url is set overwrite value
            if (_self.options.sharingurl) {
                esri.arcgis.utils.arcgisUrl = _self.options.sharingurl + 'sharing/rest/content/items';
                esri.dijit._arcgisUrl = _self.options.sharingurl + 'sharing/rest';
            } else {
                esri.dijit._arcgisUrl = location.protocol + "//www.arcgis.com/sharing/rest/";
            }
            // Set geometry to HTTPS if protocol is used
            if (templateConfig.helperServices.geometry.url && location.protocol === "https:") {
                templateConfig.helperServices.geometry.url = templateConfig.helperServices.geometry.url.replace('http:', 'https:');
            }
            // https locator url
            if (templateConfig.helperServices.geocode.url && location.protocol === "https:") {
                templateConfig.helperServices.geocode.url = templateConfig.helperServices.geocode.url.replace('http:', 'https:');
            }
            esri.config.defaults.geometryService = new esri.tasks.GeometryService(templateConfig.helperServices.geometry.url);
            esri.config.defaults.io.proxyUrl = _self.options.proxyUrl;
            esri.config.defaults.io.corsEnabledServers = [location.protocol + '//' + location.host];
            esri.config.defaults.io.alwaysUseProxy = false;
        },
        // Alert box
        alertDialog: function (text) {
            var _self = this;
            if (_self._alertDialog) {
                _self._alertDialog.destroy();
            }
            if (_self.alertCloseConnect) {
                connect.disconnect(_self.alertCloseConnect);
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
            _self._alertDialog = new Dialog(props, dom.byId('alertDialog'));
            _self._alertDialog.show();
            var closeAlert = dom.byId("closeAlert");
            if (closeAlert) {
                _self.alertCloseConnect = on(closeAlert, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self._alertDialog.hide();
                    }
                });
            }
        },
        // create the basemap gallery when active
        createBMGallery: function () {
            var _self = this;
            var basemapGroup = false;
            if (!_self.options.useArcGISOnlineBasemaps) {
                basemapGroup = {
                    title: _self.options.basemapGroupTitle,
                    owner: _self.options.basemapGroupOwner
                };
            }
            // basemap gallery
            _self.basemapDijit = new esri.dijit.BasemapGallery({
                showArcGISBasemaps: _self.options.useArcGISOnlineBasemaps,
                basemapsGroup: basemapGroup,
                map: _self.map
            }, domConstruct.create("div"));
            // on error
            connect.connect(_self.basemapDijit, "onError", function (msg) {
                console.log(msg);
            });
            // on initial load
            connect.connect(_self.basemapDijit, "onLoad", function () {
                query('#map').removeClass('mapLoading');
                _self.selectCurrentBasemap().then(function () {
                    connect.connect(_self.basemapDijit, "onSelectionChange", function () {
                        _self.baseMapChanged();
                    });
                });
            });
            // start it up
            _self.basemapDijit.startup();
            var baseContainer = dom.byId("baseContainer");
            if (baseContainer) {
                domConstruct.place(_self.basemapDijit.domNode, baseContainer, "first");
            }
        },
        // Gets current basemap ID by its title
        getBasemapIdTitle: function (title) {
            var _self = this;
            var bmArray = _self.basemapDijit.basemaps;
            if (bmArray) {
                for (var i = 0; i < bmArray.length; i++) {
                    if (bmArray[i].title === title) {
                        return bmArray[i].id;
                    }
                }
            }
            return false;
        },
        // Gets current basemap id by its Item ID on arcgisonline
        getBasemapId: function (itemId) {
            var _self = this;
            var bmArray = _self.basemapDijit.basemaps;
            if (bmArray) {
                for (var i = 0; i < bmArray.length; i++) {
                    if (bmArray[i].itemId === itemId) {
                        return bmArray[i].id;
                    }
                }
            }
            return false;
        },
        // Selects a basemap by its title
        selectCurrentBasemap: function () {
            var _self = this;
            var deferred = new Deferred();
            _self._bmInitConnect = connect.connect(_self.basemapDijit, "onSelectionChange", function () {
                deferred.resolve();
                connect.disconnect(_self._bmInitConnect);
            });
            var bmid;
            if (_self.options.basemap) {
                bmid = _self.getBasemapId(_self.options.basemap);
                if (bmid) {
                    _self.basemapDijit.select(bmid);
                }
            } else {
                bmid = _self.getBasemapIdTitle(_self.itemInfo.itemData.baseMap.title);
                if (bmid) {
                    _self.basemapDijit.select(bmid);
                }
            }
            return deferred;
        },
        // on change of basemap, update selected basemap global variable
        baseMapChanged: function () {
            var _self = this;
            // get currently selected basemap
            var basemap = _self.basemapDijit.getSelected();
            if (basemap && basemap.itemId) {
                // update global
                _self.options.basemap = basemap.itemId;
            }
            // set sharing links and embed code
            _self.setSharing();
            _self.hideAllMenus();
        },
        // Set initial extent for future use
        setStartExtent: function () {
            var _self = this;
            _self.options.startExtent = _self.map.extent;
            // if extent is a string
            if (_self.options.extent && typeof _self.options.extent === 'string') {
                var splitExtent = _self.options.extent.split(',');
                // Loaded from URL
                _self.options.startExtent = new esri.geometry.Extent({
                    xmin: parseFloat(splitExtent[0]),
                    ymin: parseFloat(splitExtent[1]),
                    xmax: parseFloat(splitExtent[2]),
                    ymax: parseFloat(splitExtent[3]),
                    spatialReference: _self.map.extent.spatialReference
                });
            }
            _self.map.setExtent(_self.options.startExtent);
        },
        setStartLevel: function () {
            var _self = this;
            if (_self.options.level) {
                _self.map.setLevel(parseInt(_self.options.level, 10));
            }
        },
        setStartMarker: function () {
            var _self = this;
            if (_self.options.locatePoint[0] && _self.options.locatePoint[1]) {
                var point = new esri.geometry.Point([_self.options.locatePoint[0], _self.options.locatePoint[1]], new esri.SpatialReference({
                    wkid: _self.map.spatialReference.wkid
                }));
                if (point) {
                    _self.setMarker(point, _self.options.locateName);
                }
            }
        },
        // set the order of these functions
        setOptions: function () {
            var _self = this;
            _self.configUrlParams();
            _self.setDefaultOptions();
            _self.validateConfig();
        },
        toggleSettingsContent: function () {
            var node = query('#collapseIcon')[0];
            var panel = query('#settingsDialog .dijitDialogPaneContent');
            domClass.toggle(node, "iconDown");
            if (domClass.contains(node, "iconDown")) {
                panel.style('display', 'none');
            } else {
                panel.style('display', 'block');
            }
        },
        // hide all dropdown menus
        hideAllMenus: function () {
            var _self = this;
            query('#topMenuCon .barButton').removeClass('barSelected');
            query('#mapcon .menuSelected').forEach(function (selectTag) {
                _self.hideMenu(selectTag);
            });
        },
        // Show dropdown menu
        showMenu: function (menuObj, buttonObj) {
            query('#mapcon .menuSelected').removeClass('menuSelected');
            if (menuObj) {
                coreFx.wipeIn({
                    node: menuObj,
                    duration: 200
                }).play();
                query(menuObj).addClass('menuSelected');
            }
            if (buttonObj) {
                query(buttonObj).addClass('barSelected');
            }
        },
        // return date object for flickr dateFrom and dateTo
        getFlickrDate: function (type) {
            var _self = this;
            var todate = new Date();
            todate = date.add(todate, "minute", -5);
            var fromdate;
            switch (_self.options.flickrRange.toLowerCase()) {
                case "today":
                    if (type === 'to') {
                        return todate;
                    } else {
                        fromdate = date.add(todate, "day", -1);
                        return fromdate;
                    }
                    break;
                case "this_week":
                    if (type === 'to') {
                        return todate;
                    } else {
                        fromdate = date.add(todate, "week", -1);
                        return fromdate;
                    }
                    break;
                case "this_month":
                    if (type === 'to') {
                        return todate;
                    } else {
                        fromdate = date.add(todate, "month", -1);
                        return fromdate;
                    }
                    break;
                case "all_time":
                    return false;
                default:
                    return false;
            }
        },
        smLayerChange: function (id) {
            var _self = this;
            if (id) {
                var layer = _self.getSocialLayer(id);
                if (layer) {
                    layer.change();
                }
            }
        },
        // settings panel ui
        configureSettingsUI: function () {
            var _self = this;
            var props = {
                style: "width: 400px",
                draggable: true,
                showTitle: true,
                title: i18n.viewer.settings.title
            };
            // new Dialog(
            _self.options.settingsDialog = new Dialog(props, dom.byId('settingsDialog'));
            var node = query('#settingsDialog .dijitDialogTitle')[0];
            if (node) {
                node.innerHTML = '<div id="collapseIcon"></div><span class="configIcon"></span><span id="settingsTitle">' + i18n.viewer.settings.title + '</span>';
            }
            // Settings Menu Config
            var cfgMenu = dom.byId("cfgMenu");
            if (cfgMenu) {
                on(cfgMenu, ".mapButton:click, .mapButton:keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        query('#cfgMenu .mapButton').removeClass('buttonSelected');
                        query(this).addClass('buttonSelected');
                        var id = query(this).attr('data-layer')[0];
                        var panelObj = query('#settingsDialog .cfgPanel[data-layer=' + id + ']');
                        query("#settingsDialog .cfgPanel").style('display', 'none');
                        panelObj.style('display', 'block');
                    }
                });
            }
            var collapseIcon = dom.byId("collapseIcon");
            if (collapseIcon) {
                on(collapseIcon, "click", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleSettingsContent();
                    }
                });
            }
            var socialList = dom.byId("socialList");
            if (socialList) {
                on(socialList, ".toggle:click, .toggle:keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleChecked(this);
                        var changeMapVal = query(this).parent('li').attr('data-layer')[0];
                        _self.toggleMapLayerSM(changeMapVal);
                    }
                });
            }
            var settingsDialog = dom.byId("settingsDialog");
            if (settingsDialog) {
                on(settingsDialog, ".dijitDialogTitleBar:dblclick", function (event) {
                    _self.toggleSettingsContent();
                });
            }
            for (var i = 0; i < _self.options.socialLayers.length; i++) {
                _self.socialMediaChangeEvents(i);
            }
        },
        socialMediaChangeEvents: function (i) {
            var _self = this;
            var input = dom.byId(_self.options.socialLayers[i].options.id + '_input');
            if (input) {
                on(input, "keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        var id = query(this).attr('data-id')[0];
                        _self.smLayerChange(id);
                    }
                });
            }
            var submit = dom.byId(_self.options.socialLayers[i].options.id + '_submit');
            if (submit) {
                on(submit, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        var id = query(this).attr('data-id')[0];
                        _self.smLayerChange(id);
                    }
                });
            }
        },
        clearDataPoints: function () {
            var _self = this;
            for (var i = 0; i < _self.options.socialLayers.length; i++) {
                _self.options.socialLayers[i].clear();
            }
        },
        getSocialLayer: function (id) {
            var _self = this;
            for (var i = 0; i < _self.options.socialLayers.length; i++) {
                if (_self.options.socialLayers[i].options.id === id) {
                    return _self.options.socialLayers[i];
                }
            }
            return false;
        },
        // gets string for social media popup title
        getSmPopupTitle: function () {
            var _self = this;
            var graphic = _self.options.customPopup.getSelectedFeature();
            var socialString = '';
            var pagString = '';
            if (graphic) {
                if (graphic.attributes.smType) {
                    var total = _self.options.customPopup.count;
                    var current = _self.options.customPopup.selectedIndex + 1;
                    var socialObject;
                    // if more than 1
                    if (total > 1) {
                        pagString = '<span class="pageInfo">(' + number.format(current) + ' ' + i18n.viewer.general.of + ' ' + number.format(total) + ')</span>';
                    }
                    var layer = _self.getSocialLayer(graphic.attributes.smType);
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
            _self.options.activeFeature = graphic;
            return socialString + pagString;
        },
        // overrides popup title for social media to add image
        overridePopupTitle: function () {
            var _self = this;
            _self.options.customPopup.setTitle(this.getSmPopupTitle());
            if (this.filterUsers) {
                _self.addReportInAppButton();
            }
        },
        // update social layers
        updateSocialLayers: function () {
            var _self = this;
            for (var i = 0; i < _self.options.socialLayers.length; i++) {
                _self.options.socialLayers[i].newQuery();
            }
        },
        // reset social refresh timer
        resetSocialRefreshTimer: function () {
            var _self = this;
            clearTimeout(_self.options.autoRefreshTimer);
            _self.options.autoRefreshTimer = setTimeout(function () {
                _self.updateSocialLayers();
            }, 4000);
        },
        // toggle social media layer on and off
        toggleMapLayerSM: function (layerid) {
            var _self = this;
            clearTimeout(_self.options.autoRefreshTimer);
            var layer = _self.getSocialLayer(layerid);
            var layerList = query('#socialMenu li[data-layer="' + layerid + '"]');
            if (domClass.contains(layerList[0], 'checked')) {
                layer.newQuery(true);
            } else {
                query('#' + layerid + '_load').style('display', 'none');
                layer.clear();
            }
            _self.setSharing();
        },
        // display points
        pointDisplay: function (display) {
            var _self = this;
            var i;
            switch (display) {
                case 'heatmap':
                    if (_self.clusterLayer) {
                        _self.clusterLayer.setVisibility(false);
                    }
                    if (_self.heatLayer) {
                        _self.heatLayer.setVisibility(true);
                    }
                    if (_self.options.socialLayers) {
                        for (i = 0; i < _self.options.socialLayers.length; i++) {
                            _self.options.socialLayers[i].hide();
                        }
                    }
                    _self.options.socialDisplay = 'heatmap';
                    break;
                case 'cluster':
                    if (_self.heatLayer) {
                        _self.heatLayer.setVisibility(false);
                    }
                    if (_self.clusterLayer) {
                        _self.clusterLayer.setVisibility(true);
                    }
                    if (_self.options.socialLayers) {
                        for (i = 0; i < _self.options.socialLayers.length; i++) {
                            _self.options.socialLayers[i].hide();
                        }
                    }
                    _self.options.socialDisplay = 'cluster';
                    break;
                default:
                    if (_self.heatLayer) {
                        _self.heatLayer.setVisibility(false);
                    }
                    if (_self.clusterLayer) {
                        _self.clusterLayer.setVisibility(false);
                    }
                    if (_self.options.socialLayers) {
                        for (i = 0; i < _self.options.socialLayers.length; i++) {
                            _self.options.socialLayers[i].show();
                        }
                    }
                    _self.options.socialDisplay = 'point';
            }
        },
        // toggle display as clusters/heatmap
        toggleDisplayAs: function (obj) {
            var _self = this;
            query('#displayAs .mapButton').removeClass('buttonSelected');
            // data type variable
            var dataType = query(obj).attr('data-type')[0];
            if (dataType === 'heatmap' && _self.isCanvasSupported()) {
                _self.pointDisplay('heatmap');
            } else if (dataType === 'cluster') {
                _self.pointDisplay('cluster');
            } else {
                _self.pointDisplay('point');
            }
            _self.options.customPopup.hide();
            _self.setSharing();
            // class
            query(obj).addClass('buttonSelected');
        },
        // zebra stripe css object
        zebraStripe: function (obj) {
            obj.removeClass("stripe");
            obj.filter(":nth-child(even)").addClass("stripe");
        },
        // heatmap / clusters toggle
        insertSMToggle: function () {
            var _self = this;
            if (_self.options.showDisplaySwitch) {
                var clusterClass = '';
                var heatmapClass = '';
                var pointClass = '';
                var clusterButton = 'buttonMiddle ';
                var html = '';
                if (!_self.isCanvasSupported()) {
                    clusterButton = 'buttonBottom ';
                    if (_self.options.socialDisplay === 'heatmap') {
                        _self.options.socialDisplay = 'point';
                    }
                }
                if (_self.options.socialDisplay === 'heatmap') {
                    heatmapClass = 'buttonSelected';
                } else if (_self.options.socialDisplay === 'cluster') {
                    clusterClass = 'buttonSelected';
                } else {
                    pointClass = 'buttonSelected';
                }
                html += '<div id="displayAs" class="displayAs">';
                html += '<div class="displayAsText">' + i18n.viewer.buttons.displayAs + '</div>';
                html += '<div tabindex="0" title="' + i18n.viewer.buttons.point + '" data-type="point" class="mapButton pointButton buttonTop ' + pointClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.point + '</div>';
                html += '<div tabindex="0" title="' + i18n.viewer.buttons.cluster + '" data-type="cluster" class="mapButton clusterButton ' + clusterButton + clusterClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.cluster + '</div>';
                if (_self.isCanvasSupported()) {
                    html += '<div tabindex="0" title="' + i18n.viewer.buttons.heatmap + '" data-type="heatmap" class="mapButton heatButton buttonBottom ' + heatmapClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.heatmap + '</div>';
                }
                html += '</div>';
                var node = dom.byId('socialMenu');
                if (node) {
                    domConstruct.place(html, node, "last");
                }
                var displayAs = dom.byId("displayAs");
                if (displayAs) {
                    on(displayAs, ".mapButton:click, .mapButton:keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.toggleDisplayAs(this);
                        }
                    });
                }
            }
        },
        // insert social media list item
        insertSMItem: function (obj) {
            var _self = this;
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
                html += '<span tabindex="0" class="toggle cBtitle">' + obj.title;
                html += '<span class="count"></span>';
                html += '</span>';
                if(obj.oAuth){
                    html += '<span class="oAuthSignIn"></span>';
                }
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
                var node = dom.byId('socialList');
                if (node) {
                    domConstruct.place(html, node, "last");
                }
            }
        },
        // update heat map
        updateDataPoints: function () {
            var _self = this;
            var dataPoints = [];
            for (var i = 0; i < _self.options.socialLayers.length; i++) {
                var list = query('#socialMenu .layer[data-layer=' + _self.options.socialLayers[i].options.id + ']');
                if (list[0] && _self.options.socialLayers[i].dataPoints && domClass.contains(list[0], "checked")) {
                    dataPoints = dataPoints.concat(_self.options.socialLayers[i].dataPoints);
                }
            }
            if (_self.heatLayer) {
                _self.heatLayer.setData(dataPoints);
            }
            if (_self.clusterLayer) {
                _self.clusterLayer.setData(dataPoints);
            }
        },
        // insert settings panel html
        insertSettingsHTML: function () {
            var _self = this;
            var html = '';
            html += '<div class="padContainer">';
            html += '<div class="cfgMenu" id="cfgMenu"></div>';
            html += '<div class="Pad ">';
            html += '<div class="clear"></div>';
            if (_self.options.showFlickr) {
                if (_self.options.showFlickrConfig) {
                    html += '<div class="cfgPanel" data-layer="' + _self.options.flickrID + '">';
                    html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + _self.options.flickrTitle + ':</strong></div>';
                    html += '<ul class="formStyle">';
                    html += '<li>';
                    html += '<label for="' + _self.options.flickrID + '_input' + '">' + i18n.viewer.settings.usingThisKeyword + '</label>';
                    html += '<input data-id="' + _self.options.flickrID + '" id="' + _self.options.flickrID + '_input' + '" class="mapInput inputSingle" type="text" size="20" value="' + _self.options.flickrSearch + '" />';
                    html += '</li>';
                    html += '<li>';
                    html += '<label for="' + _self.options.flickrID + '_range">' + i18n.viewer.settings.fromThePast + '</label>';
                    html += '<select id="' + _self.options.flickrID + '_range">';
                    html += '<option value="today">' + number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
                    html += '<option value="this_week">' + number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
                    html += '<option value="this_month">' + number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
                    html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
                    html += '</select>';
                    html += '</li>';
                    html += '<li>';
                    html += '<label for="' + _self.options.flickrID + '_submit' + '">&nbsp;</label>';
                    html += '<span data-id="' + _self.options.flickrID + '" tabindex="0" id="' + _self.options.flickrID + '_submit' + '" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + _self.options.flickrID + '_load' + '"></span>';
                    html += '</li>';
                    html += '</ul>';
                    html += '</div>';
                }
            }
            if (_self.options.showTwitter) {
                if (_self.options.showTwitterConfig) {
                    html += '<div class="cfgPanel" data-layer="' + _self.options.twitterID + '">';
                    html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + _self.options.twitterTitle + ':</strong></div>';
                    html += '<ul class="formStyle">';
                    var cookieValue = cookie(_self.options.twitterCookie);
                    if(cookieValue){
                        var parsedCookie = JSON.parse(cookieValue);
                        if(parsedCookie.screen_name){
                            html += '<li>';
                            html += '<label>' + i18n.viewer.social.screenName + '</label>';
                            html += '<span"><a href="' + location.protocol + '//twitter.com/' + parsedCookie.screen_name + '">' + parsedCookie.screen_name + '</a><a class="oAuthSwitchAccount" href="' + _self.options.twitterUrl + 'switch_account.php">' + i18n.viewer.social.switchAccount + '</a></span>';
                            html += '</li>';
                        }
                    }
                    html += '<li>';
                    html += '<label for="' + _self.options.twitterID + '_input' + '">' + i18n.viewer.settings.usingThisKeyword + '</label>';
                    html += '<input data-id="' + _self.options.twitterID + '" id="' + _self.options.twitterID + '_input' + '" class="mapInput inputSingle" type="text" size="20" value="' + _self.options.twitterSearch + '" />';
                    html += '<a title="' + i18n.viewer.settings.twSearch + '" class="twInfo" href="' + location.protocol + '//support.twitter.com/articles/71577-how-to-use-advanced-twitter-search" target="_blank"></a>';
                    html += '</li>';
                    html += '<li>';
                    html += '<label for="' + _self.options.twitterID + '_submit' + '">&nbsp;</label>';
                    html += '<span data-id="' + _self.options.twitterID + '" tabindex="0" id="' + _self.options.twitterID + '_submit' + '" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + _self.options.twitterID + '_load' + '"></span>';
                    html += '</li>';
                    html += '</ul>';
                    html += '</div>';
                }
            }
            if (_self.options.showYouTube) {
                if (_self.options.showYouTubeConfig) {
                    html += '<div class="cfgPanel" data-layer="' + _self.options.youtubeID + '">';
                    html += '<div class="firstDesc"><strong>' + i18n.viewer.settings.searchAll + ' ' + _self.options.youtubeTitle + ':</strong></div>';
                    html += '<ul class="formStyle">';
                    html += '<li>';
                    html += '<label for="' + _self.options.youtubeID + '_input' + '">' + i18n.viewer.settings.usingThisKeyword + '</label>';
                    html += '<input data-id="' + _self.options.youtubeID + '" id="' + _self.options.youtubeID + '_input' + '" class="mapInput inputSingle" type="text" size="20" value="' + _self.options.youtubeSearch + '" />';
                    html += '</li>';
                    html += '<li>';
                    html += '<label for="' + _self.options.youtubeID + '_range' + '">' + i18n.viewer.settings.fromThePast + '</label>';
                    html += '<select id="' + _self.options.youtubeID + '_range' + '">';
                    html += '<option value="today">' + number.format(1) + ' ' + i18n.viewer.settings.today + '</option>';
                    html += '<option value="this_week">' + number.format(1) + ' ' + i18n.viewer.settings.this_week + '</option>';
                    html += '<option value="this_month">' + number.format(1) + ' ' + i18n.viewer.settings.this_month + '</option>';
                    html += '<option value="all_time">' + i18n.viewer.settings.all_time + '</option>';
                    html += '</select>';
                    html += '</li>';
                    html += '<li>';
                    html += '<label for="' + _self.options.youtubeID + '_submit' + '">&nbsp;</label>';
                    html += '<span data-id="' + _self.options.youtubeID + '" tabindex="0" class="mapSubmit" id="' + _self.options.youtubeID + '_submit' + '">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + _self.options.youtubeID + '_load' + '"></span>';
                    html += '</li>';
                    html += '</ul>';
                    html += '</div>';
                }
            }
            if (_self.options.showUshahidi) {
                if (_self.options.showUshahidiConfig) {
                    html += '<div class="cfgPanel" data-layer="' + _self.options.ushahidiID + '">';
                    html += '<ul class="formStyle">';
                    html += '<li>';
                    html += '<label for="' + _self.options.ushahidiID + '_category' + '">Category</label>';
                    html += '<select id="' + _self.options.ushahidiID + '_category' + '">';
                    html += '</select>';
                    html += '</li>';
                    html += '<li>';
                    html += '<label for="' + _self.options.ushahidiID + '_submit' + '">&nbsp;</label>';
                    html += '<span data-id="' + _self.options.ushahidiID + '" tabindex="0" id="' + _self.options.ushahidiID + '_submit' + '" class="mapSubmit">' + i18n.viewer.settings.search + '</span><span class="Status" id="' + _self.options.ushahidiID + '_load' + '"></span>';
                    html += '</li>';
                    html += '</ul>';
                    html += '</div>';
                }
            }
            html += '</div>';
            html += '</div>';
            var node = dom.byId('settingsDialog');
            if (node) {
                node.innerHTML = html;
            }
            if (_self.options.showUshahidi) {
                _self.ushahidiLayer.getCategories().then(function (categories) {
                    if (categories) {
                        _self.ushahidiCategoryArray = categories;
                        var catHTML = '';
                        catHTML += '<option value="0">All</option>';
                        for (var i = 0; i < categories.length; i++) {
                            catHTML += '<option title="' + categories[i].category.description + '" value="' + categories[i].category.id + '">' + categories[i].category.title + '</option>';
                        }
                        var categoryID = dom.byId(_self.options.ushahidiID + '_category');
                        if (categoryID) {
                            categoryID.innerHTML = catHTML;
                        }
                    }
                });
            }
            //	set select menu values
            if (_self.options.showYouTube) {
                query('#' + _self.options.youtubeID + '_range').attr('value', _self.options.youtubeRange);
            }
            //	set select menu values
            if (_self.options.showFlickr) {
                query('#' + _self.options.flickrID + '_range').attr('value', _self.options.flickrRange);
            }
        },
        getUshahidCategory: function (id) {
            var _self = this;
            if (_self.ushahidiCategoryArray.length) {
                for (var i = 0; i < _self.ushahidiCategoryArray.length; i++) {
                    if (parseInt(_self.ushahidiCategoryArray[i].category.id, 10) === parseInt(id, 10)) {
                        return _self.ushahidiCategoryArray[i].category;
                    }
                }
            }
            return false;
        },
        // Social Media
        configureSocialMedia: function () {
            var _self = this;
            // if canvas is supported
            if (_self.isCanvasSupported()) {
                // set up heat layer
                _self.heatLayer = new HeatmapLayer({
                    config: {
                        "useLocalMaximum": true
                    },
                    id: "heatLayer",
                    map: _self.map,
                    domNodeId: "heatLayer",
                    opacity: 0.85
                });
                _self.map.addLayer(_self.heatLayer);
            }
            // set up cluster layer
            _self.clusterLayer = new ClusterLayer(null, {
                map: _self.map,
                id: "clusterLayer",
                label: i18n.viewer.buttons.cluster,
                clusterImage: _self.options.clusterImage,
                clusterHoverImage: _self.options.clusterHoverImage
            });
            _self.options.layerInfos.push({
                defaultSymbol: true,
                title: i18n.viewer.social.menuTitle,
                layer: _self.clusterLayer.featureLayer
            });
            // append list container
            var node = dom.byId('socialMenu');
            if (node) {
                node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.social.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="socialList"></ul>';
            }
            // if flickr
            if (_self.options.showFlickr) {
                var flickrLayer = new Flickr({
                    map: _self.map,
                    filterUsers: _self.options.filterFlickrUsers,
                    filterWords: _self.options.filterWords,
                    title: _self.options.flickrTitle,
                    legendIcon: _self.options.flickrIcon,
                    id: _self.options.flickrID,
                    datePattern: i18n.viewer.main.datePattern,
                    timePattern: i18n.viewer.main.timePattern,
                    searchTerm: _self.options.flickrSearch,
                    symbolUrl: _self.options.flickrSymbol.url,
                    symbolHeight: _self.options.flickrSymbol.height,
                    symbolWidth: _self.options.flickrSymbol.width,
                    popupWidth: _self.options.popupWidth,
                    popupHeight: _self.options.popupHeight,
                    dateFrom: _self.getFlickrDate('from'),
                    dateTo: _self.getFlickrDate('to'),
                    apiKey: _self.options.flickrKey
                });
                _self.options.layerInfos.push({
                    defaultSymbol: true,
                    title: _self.options.flickrTitle,
                    layer: flickrLayer.featureLayer
                });
                _self.clusterLayer.featureLayer.renderer.addValue({
                    value: _self.options.flickrID,
                    symbol: new esri.symbol.PictureMarkerSymbol({
                        "url": _self.options.flickrSymbol.url,
                        "height": _self.options.flickrSymbol.height,
                        "width": _self.options.flickrSymbol.width,
                        "type": "esriPMS"
                    }),
                    label: _self.options.flickrTitle
                });
                connect.connect(flickrLayer.featureLayer, 'onClick', function (evt) {
                    if (evt.graphic && evt.graphic.geometry) {
                        _self.map.centerAt(evt.graphic.geometry);
                    }
                    _self.overridePopupTitle();
                });
                connect.connect(flickrLayer, 'onUpdate', function () {
                    _self.updateDataPoints();
                });
                connect.connect(flickrLayer, 'onClear', function () {
                    _self.updateDataPoints();
                    _self.options.flickrChecked = false;
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + '] .count')[0];
                    if (node) {
                        node.innerHTML = '';
                    }
                });
                connect.connect(flickrLayer, 'onUpdateEnd', function () {
                    var totalCount = flickrLayer.getStats().geoPoints;
                    _self.hideLoading(query('#socialMenu ul li[data-layer=' + _self.options.flickrID + ']'), query('#' + _self.options.flickrID + '_load'));
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + '] .keyword')[0];
                    if (node) {
                        node.innerHTML = _self.options.flickrSearch;
                    }
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    node = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + '] .count')[0];
                    if (node) {
                        node.innerHTML = textCount;
                    }
                });
                flickrLayer.newQuery = function (enable) {
                    if (enable) {
                        _self.options.flickrChecked = true;
                    }
                    var flList = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + ']');
                    if (domClass.contains(flList[0], "checked")) {
                        flList.addClass("cLoading");
                        var updateObj = {
                            searchTerm: _self.options.flickrSearch
                        };
                        if (_self.options.flickrRange) {
                            updateObj.dateFrom = _self.getFlickrDate('from');
                            updateObj.dateTo = _self.getFlickrDate('to');
                        }
                        flickrLayer.update(updateObj);
                    }
                };
                flickrLayer.change = function () {
                    _self.options.flickrSearch = query('#' + _self.options.flickrID + '_input').attr('value')[0];
                    _self.options.flickrRange = query('#' + _self.options.flickrID + '_range').attr('value')[0];
                    _self.showLoading(_self.options.flickrID + '_load');
                    query('#socialMenu .layer[data-layer=' + _self.options.flickrID + ']').addClass("checked cLoading");
                    _self.setSharing();
                    var html = '';
                    if (_self.options.flickrSearch) {
                        html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + _self.options.flickrSearch + '</span>."';
                    }
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + '] .filtered')[0];
                    if (node) {
                        node.innerHTML = html;
                    }
                    flickrLayer.clear();
                    var updateObj = {
                        searchTerm: _self.options.flickrSearch
                    };
                    if (_self.options.flickrRange) {
                        updateObj.dateFrom = _self.getFlickrDate('from');
                        updateObj.dateTo = _self.getFlickrDate('to');
                    }
                    flickrLayer.update(updateObj);
                };
                // insert html
                _self.insertSMItem({
                    visible: _self.options.flickrChecked,
                    uniqueID: _self.options.flickrID,
                    title: _self.options.flickrTitle,
                    showSocialSettings: _self.options.showFlickrConfig,
                    legendIcon: _self.options.flickrIcon,
                    description: _self.options.flickrDescription,
                    searchTerm: _self.options.flickrSearch
                });
                _self.options.socialLayers.push(flickrLayer);
            }
            // if panoramio
            if (_self.options.showPanoramio) {
                var panoramioLayer = new Panoramio({
                    map: _self.map,
                    title: _self.options.panoramioTitle,
                    legendIcon: _self.options.panoramioIcon,
                    id: _self.options.panoramioID,
                    datePattern: i18n.viewer.main.datePattern,
                    timePattern: i18n.viewer.main.timePattern,
                    symbolUrl: _self.options.panoramioSymbol.url,
                    symbolHeight: _self.options.panoramioSymbol.height,
                    symbolWidth: _self.options.panoramioSymbol.width,
                    popupWidth: _self.options.popupWidth,
                    popupHeight: _self.options.popupHeight
                });
                _self.options.layerInfos.push({
                    defaultSymbol: true,
                    title: _self.options.panoramioTitle,
                    layer: panoramioLayer.featureLayer
                });
                _self.clusterLayer.featureLayer.renderer.addValue({
                    value: _self.options.panoramioID,
                    symbol: new esri.symbol.PictureMarkerSymbol({
                        "url": _self.options.panoramioSymbol.url,
                        "height": _self.options.panoramioSymbol.height,
                        "width": _self.options.panoramioSymbol.width,
                        "type": "esriPMS"
                    }),
                    label: _self.options.panoramioTitle
                });
                connect.connect(panoramioLayer.featureLayer, 'onClick', function (evt) {
                    if (evt.graphic && evt.graphic.geometry) {
                        _self.map.centerAt(evt.graphic.geometry);
                    }
                    _self.overridePopupTitle();
                });
                connect.connect(panoramioLayer, 'onUpdate', function () {
                    _self.updateDataPoints();
                });
                connect.connect(panoramioLayer, 'onClear', function () {
                    _self.updateDataPoints();
                    _self.options.panoramioChecked = false;
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.panoramioID + '] .count')[0];
                    if (node) {
                        node.innerHTML = '';
                    }
                });
                connect.connect(panoramioLayer, 'onUpdateEnd', function () {
                    var totalCount = panoramioLayer.getStats().geoPoints;
                    _self.hideLoading(query('#socialMenu ul li[data-layer=' + _self.options.panoramioID + ']'), query('#' + _self.options.panoramioID + '_load'));
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.panoramioID + '] .keyword')[0];
                    if (node) {
                        node.innerHTML = _self.options.panoramioSearch;
                    }
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    node = query('#socialMenu .layer[data-layer=' + _self.options.panoramioID + '] .count')[0];
                    if (node) {
                        node.innerHTML = textCount;
                    }
                });
                panoramioLayer.newQuery = function (enable) {
                    if (enable) {
                        _self.options.panoramioChecked = true;
                    }
                    var prList = query('#socialMenu .layer[data-layer=' + _self.options.panoramioID + ']');
                    if (domClass.contains(prList[0], "checked")) {
                        prList.addClass("cLoading");
                        panoramioLayer.update();
                    }
                };
                panoramioLayer.change = function () {};
                // insert html
                _self.insertSMItem({
                    visible: _self.options.panoramioChecked,
                    uniqueID: _self.options.panoramioID,
                    title: _self.options.panoramioTitle,
                    showSocialSettings: false,
                    legendIcon: _self.options.panoramioIcon,
                    description: _self.options.panoramioDescription
                });
                _self.options.socialLayers.push(panoramioLayer);
            }
            // if twitter
            if (_self.options.showTwitter) {
                var twitterLayer = new Twitter({
                    map: _self.map,
                    url: _self.options.twitterUrl,
                    filterUsers: _self.options.filterTwitterUsers,
                    filterWords: _self.options.filterWords,
                    title: _self.options.twitterTitle,
                    legendIcon: _self.options.twitterIcon,
                    id: _self.options.twitterID,
                    datePattern: i18n.viewer.main.datePattern,
                    timePattern: i18n.viewer.main.timePattern,
                    searchTerm: _self.options.twitterSearch,
                    symbolUrl: _self.options.twitterSymbol.url,
                    symbolHeight: _self.options.twitterSymbol.height,
                    symbolWidth: _self.options.twitterSymbol.width,
                    popupWidth: _self.options.popupWidth,
                    popupHeight: _self.options.popupHeight
                });
                _self.options.layerInfos.push({
                    defaultSymbol: true,
                    title: _self.options.twitterTitle,
                    layer: twitterLayer.featureLayer
                });
                _self.clusterLayer.featureLayer.renderer.addValue({
                    value: _self.options.twitterID,
                    symbol: new esri.symbol.PictureMarkerSymbol({
                        "url": _self.options.twitterSymbol.url,
                        "height": _self.options.twitterSymbol.height,
                        "width": _self.options.twitterSymbol.width,
                        "type": "esriPMS"
                    }),
                    label: _self.options.twitterTitle
                });
                connect.connect(twitterLayer, 'authenticate', function (url) {
                    _self.toggleChecked(query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .cBox')[0]);
                    _self.toggleMapLayerSM(_self.options.twitterID);
                    query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']').addClass('unauthenticated');
                    node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .oAuthSignIn')[0];
                    if (node) {
                        node.innerHTML = '<a href="' + _self.options.twitterUrl + 'sign_in.php">' + i18n.viewer.social.signIn + '</a>';
                    }
                });
                connect.connect(twitterLayer, 'onUpdate', function () {
                    _self.updateDataPoints();
                });
                connect.connect(twitterLayer.featureLayer, 'onClick', function (evt) {
                    if (evt.graphic && evt.graphic.geometry) {
                        _self.map.centerAt(evt.graphic.geometry);
                    }
                    _self.overridePopupTitle();
                });
                connect.connect(twitterLayer, 'onClear', function () {
                    _self.updateDataPoints();
                    _self.options.twitterChecked = false;
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .count')[0];
                    if (node) {
                        node.innerHTML = '';
                    }
                });
                connect.connect(twitterLayer, 'onUpdateEnd', function () {
                    var totalCount = twitterLayer.getStats().geoPoints;
                    _self.hideLoading(query('#socialMenu ul li[data-layer=' + _self.options.twitterID + ']'), query('#' + _self.options.twitterID + '_load'));
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .keyword')[0];
                    if (node) {
                        node.innerHTML = _self.options.twitterSearch;
                    }
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .count')[0];
                    if (node) {
                        node.innerHTML = textCount;
                    }
                });
                twitterLayer.newQuery = function (enable) {
                    if (enable) {
                        _self.options.twitterChecked = true;
                    }
                    var twList = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']');
                    if (domClass.contains(twList[0], "checked")) {
                        twList.addClass("cLoading");
                        twitterLayer.update({
                            searchTerm: _self.options.twitterSearch
                        });
                    }
                };
                twitterLayer.change = function () {
                    _self.options.twitterSearch = query('#' + _self.options.twitterID + '_input').attr('value')[0];
                    query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']').addClass("checked cLoading");
                    _self.showLoading(_self.options.twitterID + '_load');
                    _self.setSharing();
                    var html = '';
                    if (_self.options.twitterSearch) {
                        html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + _self.options.twitterSearch + '</span>."';
                    }
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .filtered')[0];
                    if (node) {
                        node.innerHTML = html;
                    }
                    twitterLayer.clear();
                    twitterLayer.update({
                        searchTerm: _self.options.twitterSearch
                    });
                };
                // insert html
                _self.insertSMItem({
                    visible: _self.options.twitterChecked,
                    uniqueID: _self.options.twitterID,
                    title: _self.options.twitterTitle,
                    showSocialSettings: _self.options.showTwitterConfig,
                    legendIcon: _self.options.twitterIcon,
                    description: _self.options.twitterDescription,
                    searchTerm: _self.options.twitterSearch,
                    oAuth: true
                });
                _self.options.socialLayers.push(twitterLayer);
                _self._twitterLayer = twitterLayer;
            }
            // if youtube
            if (_self.options.showYouTube) {
                var youtubeLayer = new YouTube({
                    map: _self.map,
                    filterUsers: _self.options.filterYoutubeUsers,
                    filterWords: _self.options.filterWords,
                    title: _self.options.youtubeTitle,
                    legendIcon: _self.options.youtubeIcon,
                    id: _self.options.youtubeID,
                    datePattern: i18n.viewer.main.datePattern,
                    timePattern: i18n.viewer.main.timePattern,
                    key: _self.options.youtubeKey,
                    searchTerm: _self.options.youtubeSearch,
                    symbolUrl: _self.options.youtubeSymbol.url,
                    symbolHeight: _self.options.youtubeSymbol.height,
                    symbolWidth: _self.options.youtubeSymbol.width,
                    popupWidth: _self.options.popupWidth,
                    popupHeight: _self.options.popupHeight,
                    range: _self.options.youtubeRange
                });
                _self.options.layerInfos.push({
                    defaultSymbol: true,
                    title: _self.options.youtubeTitle,
                    layer: youtubeLayer.featureLayer
                });
                _self.clusterLayer.featureLayer.renderer.addValue({
                    value: _self.options.youtubeID,
                    symbol: new esri.symbol.PictureMarkerSymbol({
                        "url": _self.options.youtubeSymbol.url,
                        "height": _self.options.youtubeSymbol.height,
                        "width": _self.options.youtubeSymbol.width,
                        "type": "esriPMS"
                    }),
                    label: _self.options.youtubeTitle
                });
                connect.connect(youtubeLayer, 'onUpdate', function () {
                    _self.updateDataPoints();
                });
                connect.connect(youtubeLayer.featureLayer, 'onClick', function (evt) {
                    if (evt.graphic && evt.graphic.geometry) {
                        _self.map.centerAt(evt.graphic.geometry);
                    }
                    _self.overridePopupTitle();
                });
                connect.connect(youtubeLayer, 'onClear', function () {
                    _self.updateDataPoints();
                    _self.options.youtubeChecked = false;
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + '] .count')[0];
                    if (node) {
                        node.innerHTML = '';
                    }
                });
                connect.connect(youtubeLayer, 'onUpdateEnd', function () {
                    var totalCount = youtubeLayer.getStats().geoPoints;
                    _self.hideLoading(query('#socialMenu ul li[data-layer=' + _self.options.youtubeID + ']'), query('#' + _self.options.youtubeID + '_load'));
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + '] .keyword')[0];
                    if (node) {
                        node.innerHTML = _self.options.youtubeSearch;
                    }
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    node = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + '] .count')[0];
                    if (node) {
                        node.innerHTML = textCount;
                    }
                });
                youtubeLayer.newQuery = function (enable) {
                    if (enable) {
                        _self.options.youtubeChecked = true;
                    }
                    // if youtube cbox is checked
                    var ytList = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + ']');
                    if (domClass.contains(ytList[0], "checked")) {
                        ytList.addClass("cLoading");
                        youtubeLayer.update({
                            searchTerm: _self.options.youtubeSearch,
                            range: _self.options.youtubeRange
                        });
                    }
                };
                youtubeLayer.change = function () {
                    _self.options.youtubeSearch = query('#' + _self.options.youtubeID + '_input').attr('value')[0];
                    _self.options.youtubeRange = query('#' + _self.options.youtubeID + '_range').attr('value')[0];
                    _self.showLoading(_self.options.youtubeID + '_load');
                    query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + ']').addClass("checked cLoading");
                    _self.setSharing();
                    var html = '';
                    if (_self.options.youtubeSearch) {
                        html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + _self.options.youtubeSearch + '</span>."';
                    }
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + '] .filtered')[0];
                    if (node) {
                        node.innerHTML = html;
                    }
                    youtubeLayer.clear();
                    youtubeLayer.update({
                        searchTerm: _self.options.youtubeSearch,
                        range: _self.options.youtubeRange
                    });
                };
                // insert html
                _self.insertSMItem({
                    visible: _self.options.youtubeChecked,
                    uniqueID: _self.options.youtubeID,
                    title: _self.options.youtubeTitle,
                    showSocialSettings: _self.options.showYouTubeConfig,
                    legendIcon: _self.options.youtubeIcon,
                    description: _self.options.youtubeDescription,
                    searchTerm: _self.options.youtubeSearch
                });
                _self.options.socialLayers.push(youtubeLayer);
            }
            // if ushahidi
            if (_self.options.showUshahidi) {
                var ushahidiLayer = new Ushahidi({
                    map: _self.map,
                    title: _self.options.ushahidiTitle,
                    legendIcon: _self.options.ushahidiIcon,
                    id: _self.options.ushahidiID,
                    datePattern: i18n.viewer.main.datePattern,
                    timePattern: i18n.viewer.main.timePattern,
                    url: _self.options.ushahidiUrl,
                    symbolUrl: _self.options.ushahidiSymbol.url,
                    symbolHeight: _self.options.ushahidiSymbol.height,
                    symbolWidth: _self.options.ushahidiSymbol.width,
                    popup: _self.options.customPopup,
                    popupWidth: _self.options.popupWidth,
                    popupHeight: _self.options.popupHeight
                });
                _self.options.layerInfos.push({
                    defaultSymbol: true,
                    title: _self.options.ushahidiTitle,
                    layer: ushahidiLayer.featureLayer
                });
                _self.clusterLayer.featureLayer.renderer.addValue({
                    value: _self.options.ushahidiID,
                    symbol: new esri.symbol.PictureMarkerSymbol({
                        "url": _self.options.ushahidiSymbol.url,
                        "height": _self.options.ushahidiSymbol.height,
                        "width": _self.options.ushahidiSymbol.width,
                        "type": "esriPMS"
                    }),
                    label: _self.options.ushahidiTitle
                });
                connect.connect(ushahidiLayer, 'onUpdate', function () {
                    _self.updateDataPoints();
                });
                connect.connect(ushahidiLayer.featureLayer, 'onClick', function (evt) {
                    if (evt.graphic && evt.graphic.geometry) {
                        _self.map.centerAt(evt.graphic.geometry);
                    }
                    _self.overridePopupTitle();
                });
                connect.connect(ushahidiLayer, 'onClear', function () {
                    _self.updateDataPoints();
                    _self.options.ushahidiChecked = false;
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .count')[0];
                    if (node) {
                        node.innerHTML = '';
                    }
                });
                connect.connect(ushahidiLayer, 'onUpdateEnd', function () {
                    var totalCount = ushahidiLayer.getStats().geoPoints;
                    _self.hideLoading(query('#socialMenu ul li[data-layer=' + _self.options.ushahidiID + ']'), query('#' + _self.options.ushahidiID + '_load'));
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .keyword')[0];
                    if (node) {
                        var cat = _self.getUshahidCategory(_self.options.ushahidiCategory);
                        if (cat) {
                            var title = cat.title;
                            node.innerHTML = title;
                        }
                    }
                    var textCount = '';
                    if (totalCount) {
                        textCount = ' (' + totalCount + ')' || '';
                    }
                    node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .count')[0];
                    if (node) {
                        node.innerHTML = textCount;
                    }
                });
                ushahidiLayer.newQuery = function (enable) {
                    if (enable) {
                        _self.options.ushahidiChecked = true;
                    }
                    var uhList = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + ']');
                    if (domClass.contains(uhList[0], "checked")) {
                        uhList.addClass("cLoading");
                        ushahidiLayer.update();
                    }
                };
                ushahidiLayer.change = function () {
                    _self.options.ushahidiCategory = parseInt(query('#' + _self.options.ushahidiID + '_category').attr('value')[0], 10);
                    _self.showLoading(_self.options.ushahidiID + '_load');
                    query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + ']').addClass("checked cLoading");
                    _self.setSharing();
                    var html = '';
                    if (_self.options.ushahidiCategory) {
                        var cat = _self.getUshahidCategory(_self.options.ushahidiCategory);
                        if (cat) {
                            var title = cat.title;
                            html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + title + '</span>."';
                        }
                    }
                    var node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .filtered')[0];
                    if (node) {
                        node.innerHTML = html;
                    }
                    ushahidiLayer.clear();
                    var updateObj = {
                        category: _self.options.ushahidiCategory
                    };
                    ushahidiLayer.update(updateObj);
                };
                // insert html
                _self.insertSMItem({
                    visible: _self.options.ushahidiChecked,
                    uniqueID: _self.options.ushahidiID,
                    title: _self.options.ushahidiTitle,
                    showSocialSettings: _self.options.showUshahidiConfig,
                    searchTerm: '',
                    legendIcon: _self.options.ushahidiIcon,
                    description: _self.options.ushahidiDescription
                });
                _self.options.socialLayers.push(ushahidiLayer);
                _self.ushahidiLayer = ushahidiLayer;
            }
            _self.insertSMToggle();
            _self.insertSettingsHTML();
            _self.configureSettingsUI();
            // set default visible of the two
            if (_self.options.socialDisplay === 'heatmap' && _self.isCanvasSupported()) {
                _self.pointDisplay('heatmap');
            } else if (_self.options.socialDisplay === 'cluster') {
                _self.pointDisplay('cluster');
            } else {
                _self.pointDisplay('point');
            }
            // onclick connect
            connect.connect(_self.clusterLayer.featureLayer, "onClick", function (evt) {
                event.stop(evt);
                var arr = [];
                var query = new esri.tasks.Query();
                query.geometry = evt.graphic.attributes.extent;
                for (var i = 0; i < _self.options.socialLayers.length; i++) {
                    arr.push(_self.options.socialLayers[i].featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW));
                }
                _self.options.customPopup.setFeatures(arr);
                _self.options.customPopup.show(evt.mapPoint);
                _self.options.customPopup.resize(_self.options.popupWidth, _self.options.popupHeight);
                if (evt.graphic && evt.graphic.geometry) {
                    _self.map.centerAt(evt.graphic.geometry);
                }
                _self.overridePopupTitle();
            });
            // zebra stripe layers
            _self.zebraStripe(query('#socialList li.layer'));
            // settings menu generator
            var settingsCount = query('#socialList li.layer .cBconfig').length;
            if (settingsCount > -1) {
                array.forEach(query('#socialList li.layer .cBconfig'), function (entry, i) {
                    var parent = query(entry).parent('li');
                    var settingsID = query(parent).attr('data-layer');
                    var settingsClass = _self.getButtonClass(i + 1, settingsCount);
                    var settingsSource = query(parent).children('.cBicon').children('img').attr('src');
                    var settingsTitle = query(parent).children('.cBtitle').text();
                    var node = dom.byId('cfgMenu');
                    if (node) {
                        var html = '<span tabindex="0" data-layer="' + settingsID + '" class="mapButton ' + settingsClass + '" title="' + settingsTitle + '"><img width="16" height="16" src="' + settingsSource + '" /></span>';
                        domConstruct.place(html, node, "last");
                    }
                });
            }
        },
        // return correct button class
        getButtonClass: function (i, size) {
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
        },
        // Folder Layer CheckBoxes
        toggleChecked: function (obj) {
            var _self = this;
            var list = query(obj).parent('li');
            if (domClass.contains(list[0], "checked")) {
                list.removeClass('cLoading');
            } else {
                list.addClass('cLoading');
            }
            domClass.toggle(list[0], 'checked');
            _self.setSharing();
        },
        // removes layer from list of visible layers
        removeFromActiveLayers: function (layerid) {
            var _self = this;
            var theIndex = this.getActiveLayerIndex(layerid);
            for (theIndex; theIndex > -1; theIndex = this.getActiveLayerIndex(layerid)) {
                _self.options.layers.splice(theIndex, 1);
            }
            _self.setSharing();
        },
        // change active layers
        getActiveLayerIndex: function (layerid) {
            var _self = this;
            var indexNum = array.indexOf(_self.options.layers, layerid);
            return indexNum;
        },
        // adds layer to list of visible layers
        addToActiveLayers: function (layerid) {
            var _self = this;
            var theIndex = _self.getActiveLayerIndex(layerid);
            if (theIndex === -1) {
                _self.options.layers.push(layerid);
            }
            _self.setSharing();
        },
        // layers ui
        configureLayerUI: function () {
            var _self = this;
            var layersList = dom.byId("layersList");
            if (layersList) {
                on(layersList, ".toggle:click, .toggle:keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleChecked(this);
                        var changeMapVal = query(this).parent('li').attr('data-layer')[0];
                        var splitVals = changeMapVal.split(',');
                        if (splitVals) {
                            for (var i = 0; i < splitVals.length; i++) {
                                _self.toggleMapLayer(splitVals[i]);
                            }
                        }
                        _self.hideLoading(query('#layersList li[data-layer="' + changeMapVal + '"]'));
                    }
                });
            }
            // ToolTips
            on(query(".listMenu"), ".cBinfo:click, .cBinfo:keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    var toolTip = query(this).parent('li').children('.infoHidden');
                    query('.listMenu ul li .cBinfo').removeClass('cBinfoAnim');
                    if (toolTip[0]) {
                        if (toolTip.style('display')[0] === 'none') {
                            query('.infoHidden').style('display', 'none');
                            query('.listMenu ul li').removeClass('active');
                            query(this).parent('li').addClass('active');
                            toolTip.style('display', 'block');
                            query(this).addClass('cBinfoAnim');
                        } else {
                            toolTip.style('display', 'none');
                            query(this).parent('li').removeClass('active');
                        }
                    }
                }
            });
            // Close Menus
            on(query(".slideMenu"), ".closeMenu:click, .closeMenu:keyup", function (event) {
                _self.hideAllMenus();
            });
            // Close ToolTips
            on(query(".listMenu"), ".ihClose:click, .ihClose:keyup", function (event) {
                _self.hideLayerInfo();
            });
            // config settings
            on(query(".listMenu"), ".cBconfig:click, .cBconfig:keyup", function (event) {
                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                    _self.hideLayerInfo();
                    query('.listMenu ul li .cBconfig').removeClass('cBconfigAnim');
                    var parentLi = query(this).parent('li').attr('data-layer')[0];
                    var panelObj = query('#settingsDialog .cfgPanel[data-layer=' + parentLi + ']');
                    var panelBtn = query('#cfgMenu .mapButton[data-layer=' + parentLi + ']');
                    query('#cfgMenu span').removeClass('buttonSelected');
                    panelBtn.addClass('buttonSelected');
                    _self.options.customPopup.hide();
                    query(this).addClass('cBconfigAnim');
                    query("#settingsDialog .cfgPanel").style('display', 'none');
                    panelObj.style('display', 'block');
                    query('#collapseIcon').removeClass('iconDown');
                    query('#settingsDialog .dijitDialogPaneContent').style('display', 'block');
                    if (!_self.options.settingsDialog.get('open')) {
                        _self.options.settingsDialog.show();
                    } else if (_self.options.currentSettingsTab === parentLi) {
                        _self.options.settingsDialog.hide();
                    }
                    _self.options.currentSettingsTab = parentLi;
                }
            });
        },
        // toggle map layer on and off
        toggleMapLayer: function (layerid) {
            var _self = this;
            var layer = _self.map.getLayer(layerid);
            if (layer) {
                //if visible hide the layer
                if (layer.visible === true) {
                    layer.hide();
                    _self.removeFromActiveLayers(layerid);
                }
                //otherwise show and add to layers
                else {
                    layer.show();
                    _self.addToActiveLayers(layerid);
                }
            }
        },
        addLayerToUI: function (layerToAdd, index) {
            var _self = this;
            // each layer
            var layerClass;
            // URL layers variable
            var urlLayers = false;
            var params = _self.getUrlObject();
            // if visible layers set in URL
            if (params.query.hasOwnProperty('layers')) {
                urlLayers = true;
            }
            // generate layer html
            var html = '';
            // if layer object
            if (layerToAdd) {
                // default layer class
                layerClass = 'layer';
                // layer ids
                var dataLayers = '';
                // key variable
                var key;
                if (layerToAdd.featureCollection) {
                    // if feature collection layers
                    if (layerToAdd.featureCollection.layers) {
                        // for each feature collection
                        for (var k = 0; k < layerToAdd.featureCollection.layers.length; k++) {
                            // if URL layers set
                            if (urlLayers) {
                                // set layer visibility to false
                                layerToAdd.featureCollection.layers[k].visibility = false;
                                _self.map.getLayer(layerToAdd.featureCollection.layers[k].id).hide();
                                // for each visible layer array item
                                for (key in _self.options.layers) {
                                    // if current layer ID matches visible layer item
                                    if (_self.options.layers[key] === layerToAdd.featureCollection.layers[k].id) {
                                        // set visibility to true
                                        layerToAdd.featureCollection.layers[k].visibility = true;
                                        _self.map.getLayer(layerToAdd.featureCollection.layers[k].id).show();
                                    }
                                }
                            }
                            // if layer visibility is true
                            if (layerToAdd.featureCollection.layers[k].visibility === true) {
                                // set layer class to checked
                                layerClass = 'layer checked';
                                // add to active layers array
                                _self.addToActiveLayers(layerToAdd.featureCollection.layers[k].id);
                            }
                            // data layer attrubute
                            dataLayers += layerToAdd.featureCollection.layers[k].id;
                            // if not last feature collection add comma for splitting
                            if (k !== (layerToAdd.featureCollection.layers.length - 1)) {
                                dataLayers += ",";
                            }
                        }
                    }
                    // csv
                    else {
                        // if URL layers set
                        if (urlLayers) {
                            _self.map.getLayer(layerToAdd.id).hide();
                            layerToAdd.visibility = false;
                            // for each visible layer array item
                            for (key in _self.options.layers) {
                                // if current layer ID matches visible layer item
                                if (_self.options.layers[key] === layerToAdd.id) {
                                    // set visibility to true
                                    layerToAdd.visibility = true;
                                    _self.map.getLayer(layerToAdd.id).show();
                                }
                            }
                        }
                        // if layer visibility is true
                        if (layerToAdd.visibility === true) {
                            // set layer class to checked
                            layerClass = 'layer checked';
                            // add to active layers array
                            _self.addToActiveLayers(layerToAdd.id);
                        }
                        // data layer attrubute
                        dataLayers += layerToAdd.id;
                    }
                } else {
                    // if URL layers set
                    if (urlLayers) {
                        layerToAdd.visibility = false;
                        _self.map.getLayer(layerToAdd.id).hide();
                        // for each visible layer array item
                        for (key in _self.options.layers) {
                            // if current layer ID matches visible layer item
                            if (_self.options.layers[key] === layerToAdd.id) {
                                // set visibility to true
                                layerToAdd.visibility = true;
                                _self.map.getLayer(layerToAdd.id).show();
                            }
                        }
                    }
                    // if layer visibility is true
                    if (layerToAdd.visibility === true) {
                        // set layer class to checked
                        layerClass = 'layer checked';
                        // add to active layers array
                        _self.addToActiveLayers(layerToAdd.id);
                    }
                    // data layer attrubute
                    dataLayers += layerToAdd.id;
                }
                // Set data layers
                layerToAdd.dataLayers = dataLayers;
                // compose html list string
                html += '<li class="' + layerClass + '" data-layer="' + dataLayers + '">';
                html += '<div class="cover"></div>';
                html += '<span tabindex="0" class="cBinfo" title="' + i18n.viewer.layer.information + '"></span>';
                html += '<span tabindex="0" class="toggle cBox"></span>';
                html += '<span tabindex="0" class="toggle cBtitle" title="' + layerToAdd.title + '">' + layerToAdd.title.replace(/[\-_]/g, " ") + '</span>';
                html += '<div class="clear"></div>';
                html += '<div class="infoHidden">';
                html += '<div title="' + i18n.viewer.general.close + '" class="ihClose"></div>';
                if (layerToAdd.resourceInfo) {
                    html += '<div class="infoHiddenScroll">';
                    if (layerToAdd.resourceInfo.serviceDescription || layerToAdd.resourceInfo.description) {
                        if (layerToAdd.resourceInfo.serviceDescription) {
                            html += unescape(layerToAdd.resourceInfo.serviceDescription);
                        }
                        if (layerToAdd.resourceInfo.description) {
                            html += unescape(layerToAdd.resourceInfo.description);
                        }
                    }
                    html += '</div>';
                } else {
                    html += '<div>' + i18n.viewer.errors.nodesc + '</div>';
                }
                html += '<div class="transSlider"><span class="transLabel">' + i18n.viewer.layer.transparency + '</span><span id="layerSlider' + index + '" data-layer-id="' + dataLayers + '" class="uiSlider slider"></span></div>';
                html += '</div>';
            }
            html += '</li>';
            // append html
            node = dom.byId('layersList');
            if (node) {
                domConstruct.place(html, node, "first");
            }
        },
        // Show spinner on object
        showLoading: function (obj) {
            if (obj) {
                query('#' + obj).removeClass('LoadingComplete').addClass('Loading').style('display', 'inline-block');
            }
        },
        // remove loading spinners
        hideLoading: function (obj, obj2) {
            if (obj) {
                obj.removeClass('cLoading');
            }
            if (obj2) {
                obj2.removeClass('Loading').addClass('LoadingComplete');
            }
        },
        addLayerTransparencySlider: function (theLayer, index) {
            var _self = this;
            // if layer object
            if (theLayer) {
                // init sliders
                var slider = new HorizontalSlider({
                    name: "slider",
                    value: parseFloat(theLayer.opacity * 100),
                    minimum: 1,
                    showButtons: false,
                    maximum: 100,
                    discreteValues: 20,
                    intermediateChanges: true,
                    style: "width:100px; display:inline-block; *display:inline; vertical-align:middle;",
                    onChange: function (value) {
                        _self.transparencyChange(value, theLayer.dataLayers);
                    }
                }, "layerSlider" + index);
            }
        },
        // create layer items
        configureLayers: function () {
            var _self = this;
            // if operational layers
            if (_self.itemInfo.itemData.operationalLayers) {
                // if operational layers of at least 1
                if (_self.itemInfo.itemData.operationalLayers.length > 0) {
                    if (!_self.options.layerInfos) {
                        _self.options.layerInfos = [];
                    }
                    // get legend layers
                    var legendLayers = esri.arcgis.utils.getLegendLayers(_self.mapResponse);
                    // build layers
                    _self.options.layerInfos = _self.options.layerInfos.concat(legendLayers);
                    var node;
                    if (_self.options.showLegendMenu) {
                        node = dom.byId('legendMenu');
                        if (node) {
                            node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.legend.menuTitle + '<div class="clear"></div></div><div class="legendMenuCon"><div class="slideScroll"><div id="legendContent"></div></div></div>';
                        }
                        // Build Legend
                        if (_self.options.layerInfos && _self.options.layerInfos.length > 0) {
                            _self.options.legendDijit = new esri.dijit.Legend({
                                map: _self.map,
                                layerInfos: _self.options.layerInfos
                            }, "legendContent");
                            _self.options.legendDijit.startup();
                        } else {
                            var legendContentNode = dom.byId('legendContent');
                            if (legendContentNode) {
                                legendContentNode.innerHTML = i18n.viewer.errors.noLegend;
                            }
                        }
                    }
                    // ADD URL
                    node = dom.byId('layersMenu');
                    if (node) {
                        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.layers.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="layersList"></ul>';
                    }
                    // for each layer
                    for (var i = 0; i < _self.itemInfo.itemData.operationalLayers.length; i++) {
                        _self.addLayerToUI(_self.itemInfo.itemData.operationalLayers[i], i);
                        _self.addLayerTransparencySlider(_self.itemInfo.itemData.operationalLayers[i], i);
                    }
                    _self.zebraStripe(query('#layersList li.layer'));
                }
                _self.options.scaleBar = new esri.dijit.Scalebar({
                    map: _self.map,
                    attachTo: "bottom-left",
                    scalebarUnit: i18n.viewer.main.scaleBarUnits
                });
                _self.configureLayerUI();
            }
        },
        // slidder transparency change
        transparencyChange: function (value, layerID) {
            var _self = this;
            var newValue = (value / 100);
            var splitVals = layerID.split(',');
            if (splitVals) {
                for (var j = 0; j < splitVals.length; j++) {
                    var layer = _self.map.getLayer(splitVals[j]);
                    if (layer) {
                        if (layer._fLayers) {
                            for (var k = 0; k < layer._fLayers.length; k++) {
                                layer._fLayers[k].setOpacity(newValue);
                            }
                        } else {
                            layer.setOpacity(newValue);
                        }
                    }
                }
            }
        },
        // create places item
        createPlacesListItem: function (i) {
            var _self = this;
            // default vars //
            var html = '';
            // list html
            html += '<li data-index="' + i + '" class="layer sharedItem placesClick">';
            html += _self.itemInfo.itemData.bookmarks[i].name.replace(/[\-_]/g, " ");
            html += '</li>';
            // insert list item
            var node = dom.byId('placesList');
            if (node) {
                domConstruct.place(html, node, "last");
            }
        },
        // zoom to location: zooms map to location point
        zoomToLocation: function (x, y, IPAccuracy) {
            var _self = this;
            var lod = 16;
            // set point
            var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(x, y));
            // zoom and center
            _self.map.centerAndZoom(pt, lod);
        },
        // geolocation error
        geoLocateMapError: function (error) {
            this.alertDialog(error.toString());
        },
        // geolocate function: sets map location to users location
        geoLocateMap: function (position) {
            var _self = this;
            if (position) {
                var latitude = position.coords.latitude;
                var longitude = position.coords.longitude;
                var IPAccuracy = position.coords.accuracy;
                _self.zoomToLocation(longitude, latitude, IPAccuracy);
            }
        },
        // configure places
        placesOnClick: function () {
            var _self = this;
            // places click
            var placesList = dom.byId("placesList");
            if (placesList) {
                on(placesList, ".placesClick:click, .placesClick:keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        objIndex = query(this).attr('data-index');
                        if (objIndex !== -1) {
                            // create extent
                            var newExtent = new esri.geometry.Extent(_self.itemInfo.itemData.bookmarks[objIndex].extent);
                            // set extent
                            _self.map.setExtent(newExtent);
                            _self.hideAllMenus();
                        }
                    }
                });
            }
            // places click
            var placesButton = dom.byId("placesButton");
            if (placesButton) {
                on(placesButton, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleMenus('places');
                    }
                });
            }
        },
        // configure places
        configurePlaces: function () {
            var _self = this;
            // if places
            if (_self.options.showPlaces) {
                if (_self.itemInfo.itemData.bookmarks && _self.itemInfo.itemData.bookmarks.length > 0) {
                    // insert places button
                    var node = dom.byId('placesCon');
                    if (node) {
                        node.innerHTML = '<span tabindex="0" id="placesButton" class="barButton" data-menu="places" title="' + i18n.viewer.places.placesTitle + '"><span class="barIcon placesMenuIcon"></span>' + i18n.viewer.places.places + '</span>';
                    }
                    // create list
                    node = dom.byId('placesMenu');
                    if (node) {
                        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.places.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="placesList"></ul>';
                    }
                    // if share object
                    for (i = 0; i < _self.itemInfo.itemData.bookmarks.length; i++) {
                        _self.createPlacesListItem(i);
                    }
                    // set on clicks
                    _self.placesOnClick();
                    _self.zebraStripe(query('#placesList li.layer'));
                } else {
                    _self.options.showPlaces = false;
                }
            }
        },
        // clear the locate graphic
        resetLocateLayer: function () {
            var _self = this;
            if (_self.options.locateLayer) {
                _self.options.locateLayer.clear();
            }
            _self.options.locateName = "";
            _self.setSharing();
        },
        setMarker: function (point, address) {
            var _self = this;
            if (_self.options.pointGraphic) {
                // Create point marker
                var pointGraphic = new esri.symbol.PictureMarkerSymbol(_self.options.pointGraphic, 21, 29).setOffset(0, 12);
                var locationGraphic = new esri.Graphic(point, pointGraphic);
                // if locate point layer
                if (_self.options.locateLayer) {
                    _self.options.locateLayer.clear();
                    _self.clearPopupValues();
                    _self.options.customPopup.hide();
                } else {
                    _self.options.locateLayer = new esri.layers.GraphicsLayer();
                    connect.connect(_self.options.locateLayer, "onClick",

                    function (evt) {
                        _self.clearPopupValues();
                        event.stop(evt);
                        var content = "<strong>" + evt.graphic.attributes.address + "</strong>";
                        _self.options.customPopup.setContent(content);
                        _self.options.customPopup.setTitle(i18n.viewer.search.location);
                        _self.options.customPopup.show(evt.graphic.geometry);
                    });
                    _self.map.addLayer(_self.options.locateLayer);
                }
                // graphic
                locationGraphic.setAttributes({
                    "address": address
                });
                _self.options.locateLayer.add(locationGraphic);
                var content = "<strong>" + address + "</strong>";
                _self.options.customPopup.setContent(content);
                _self.options.customPopup.setTitle(i18n.viewer.search.location);
                _self.options.customPopup.show(point);
            }
        },
        // resize map
        resizeMap: function () {
            var _self = this;
            if (_self.mapTimer) {
                //clear any existing resize timer
                clearTimeout(_self.mapTimer);
            }
            //create new resize timer with delay of 500 milliseconds
            _self.mapTimer = setTimeout(function () {
                if (_self.map) {
                    var barHeight = 0,
                        chartHeight = 0;
                    // menu bar height
                    var menuBar = dom.byId('topMenuBar');
                    if (menuBar) {
                        var menuPos = domGeom.position(menuBar);
                        barHeight = menuPos.h;
                    }
                    // chart height
                    var chartNode = dom.byId('graphBar');
                    if (chartNode) {
                        var chartPos = domGeom.position(chartNode);
                        chartHeight = chartPos.h;
                    }
                    // window height
                    var vs = win.getBox();
                    var windowHeight = vs.h;
                    var node = dom.byId('map');
                    if (node) {
                        domStyle.set(node, {
                            "height": windowHeight - barHeight - chartHeight + 'px'
                        });
                    }
                    // resize
                    _self.map.resize();
                    _self.map.reposition();
                    // update location of menus
                    _self.updateLeftMenuOffset('#shareMap', '#shareControls');
                    _self.updateLeftMenuOffset('#placesButton', '#placesMenu');
                    _self.updateRightMenuOffset('#layersButton', '#layersMenu');
                    _self.updateRightMenuOffset('#basemapButton', '#basemapMenu');
                    _self.updateRightMenuOffset('#legendButton', '#legendMenu');
                    _self.updateRightMenuOffset('socialButton', '#socialMenu');
                }
            }, 500);
        },
        // update position of menu for right side buttons
        updateRightMenuOffset: function (button, menu) {
            var _self = this;
            var buttonObj = query(button)[0];
            var menuObj = query(menu)[0];
            var position;
            if (buttonObj && menuObj) {
                var offset = domGeom.position(buttonObj);
                var vs = win.getBox();
                if (offset) {
                    if (_self.options.isRightToLeft) {
                        position = offset.x;
                        domStyle.set(menuObj, {
                            "left": position + 'px'
                        });
                    } else {
                        position = vs.w - (offset.x + offset.w);
                        domStyle.set(menuObj, {
                            "right": position + 'px'
                        });
                    }
                }
            }
        },
        // update position of menu for left side buttons
        updateLeftMenuOffset: function (button, menu) {
            var _self = this;
            var btn = query(button)[0];
            var mnu = query(menu)[0];
            var vs = win.getBox();
            var leftOffset;
            if (btn && mnu) {
                var offset = domGeom.position(btn);
                if (_self.options.isRightToLeft) {
                    leftOffset = vs.w - (offset.x + offset.w);
                    domStyle.set(mnu, {
                        "right": leftOffset + 'px'
                    });
                } else {
                    leftOffset = offset.x;
                    domStyle.set(mnu, {
                        "left": leftOffset + 'px'
                    });
                }
            }
        },
        hideAboutMap: function () {
            var _self = this;
            if (_self.options.aboutDialog) {
                _self.options.aboutDialog.hide();
                query('#aboutMap').removeClass('barSelected');
            }
        },
        // Toggle show/hide about map info
        toggleAboutMap: function (obj) {
            var _self = this;
            if (_self.options.aboutDialog) {
                if (!_self.options.aboutDialog.get('open')) {
                    _self.options.aboutDialog.show();
                    query(obj).addClass('barSelected');
                } else {
                    _self.options.aboutDialog.hide();
                    query(obj).removeClass('barSelected');
                }
            }
        },
        // twitter link
        setTWLink: function (shLink) {
            var _self = this;
            if (shLink) {
                var fullLink;
                var w = 650;
                var h = 400;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);
                fullLink = 'https://twitter.com/intent/tweet?' + 'url=' + encodeURIComponent(shLink) + '&text=' + encodeURIComponent(_self.itemInfo.item.snippet) + '&hashtags=' + 'EsriSMT';
                window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
            }
        },
        // facebook link
        setFBLink: function (fbLink) {
            var _self = this;
            if (fbLink) {
                var fullLink;
                var w = 650;
                var h = 360;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);
                fullLink = 'http://www.facebook.com/sharer.php?u=' + encodeURIComponent(fbLink) + '&t=' + encodeURIComponent(_self.itemInfo.item.snippet);
                window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
            }
        },
        // Canvas detection
        isCanvasSupported: function () {
            var dc = document.createElement('canvas');
            if (!dc.getContext) {
                return 0;
            }
            var c = dc.getContext('2d');
            return typeof c.fillText === 'function' ? 2 : 1;
        },
        // right side menu buttons
        rightSideMenuButtons: function () {
            var _self = this;
            var html = '';
            var node;
            if (_self.options.showLegendMenu && _self.options.layerInfos && _self.options.layerInfos.length > 0) {
                html += '<span tabindex="0" id="legendButton" data-menu="legend" class="barButton" title="' + i18n.viewer.buttons.legendTitle + '"><span class="barIcon legendIcon"></span>' + i18n.viewer.buttons.legend + '</span>';
            }
            if (_self.options.showBasemapMenu) {
                html += '<span tabindex="0" id="basemapButton" data-menu="basemap" class="barButton" title="' + i18n.viewer.buttons.basemapTitle + '"><span class="barIcon basemapIcon"></span>' + i18n.viewer.buttons.basemap + '</span>';
                node = dom.byId('basemapMenu');
                if (node) {
                    node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.basemap.menuTitle + '<div class="clear"></div></div><div class="bmMenuCon"><div class="slideScroll"><div id="baseContainer"></div></div></div>';
                }
            }
            if (_self.options.showLayersMenu && _self.itemInfo.itemData.operationalLayers.length) {
                html += '<span tabindex="0" id="layersButton" data-menu="layers" class="barButton" title="' + i18n.viewer.buttons.layersTitle + '"><span class="barIcon layersIcon"></span>' + i18n.viewer.buttons.layers + '</span>';
            }
            if (_self.options.showSocialMenu) {
                html += '<span tabindex="0" id="socialButton" data-menu="social" class="barButton" title="' + i18n.viewer.buttons.socialTitle + '"><span class="barIcon socialIcon"></span>' + i18n.viewer.buttons.social + '</span>';
            }
            node = dom.byId('menuList');
            if (node) {
                node.innerHTML = html;
            }
            var legendButton = dom.byId("legendButton");
            if (legendButton) {
                // Social MENU TOGGLE
                on(legendButton, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleMenus('legend');
                    }
                });
            }
            // Basemap MENU TOGGLE
            var basemapButton = dom.byId("basemapButton");
            if (basemapButton) {
                on(basemapButton, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleMenus('basemap');
                    }
                });
            }
            // Layers MENU TOGGLE
            var layersButton = dom.byId("layersButton");
            if (layersButton) {
                on(layersButton, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleMenus('layers');
                    }
                });
            }
            var socialButton = dom.byId("socialButton");
            // Social MENU TOGGLE
            if (socialButton) {
                on(socialButton, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.toggleMenus('social');
                    }
                });
            }
            // Show Default Menu
            if (_self.options.defaultMenu) {
                switch (_self.options.defaultMenu) {
                    case 'places':
                        if (_self.options.showPlaces) {
                            _self.toggleMenus(_self.options.defaultMenu);
                        }
                        break;
                    case 'basemap':
                        if (_self.options.showBasemapMenu) {
                            _self.toggleMenus(_self.options.defaultMenu);
                        }
                        break;
                    case 'layers':
                        if (_self.options.showLayersMenu) {
                            _self.toggleMenus(_self.options.defaultMenu);
                        }
                        break;
                    case 'social':
                        if (_self.options.showSocialMenu) {
                            _self.toggleMenus(_self.options.defaultMenu);
                        }
                        break;
                    case 'legend':
                        if (_self.options.showLegendMenu) {
                            _self.toggleMenus(_self.options.defaultMenu);
                        }
                        break;
                }
            }
            // Show Menu Bar
            query('#topMenuBar').style('display', 'block');
        },
        // set up share menu
        configureShareMenu: function () {
            var _self = this;
            if (_self.options.showShareMenu) {
                var node = query('#shareMap')[0];
                if (node) {
                    node.innerHTML = '<span tabindex="0" id="shareIcon" data-menu="share" class="barButton" title="' + i18n.viewer.buttons.linkTitle + '"><span class="barIcon iconBlock"></span>' + i18n.viewer.buttons.link + '</span></div><div class="clear">';
                }
                var html = '';
                html += '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.shareMenu.menuTitle + '<div class="clear"></div></div>';
                html += '<div class="shareContainer">';
                html += '<div class="Pad">';
                html += '<h3>' + i18n.viewer.shareMenu.shareHeader + '</h3>';
                html += '<input id="inputShare" value="" type="text" class="mapInput inputSingle" size="20" readonly>';
                html += '<span tabindex="0" id="fbImage" title="' + i18n.viewer.shareMenu.facebookHeader + '"><span class="icon"></span>' + i18n.viewer.shareMenu.facebook + '</span><span tabindex="0" id="twImage" title="' + i18n.viewer.shareMenu.twitterHeader + '"><span class="icon"></span>' + i18n.viewer.shareMenu.twitter + '</span></div>';
                html += '<h3>' + i18n.viewer.shareMenu.instructionHeader + '</h3>';
                html += '<textarea rows="3" id="quickEmbedCode"></textarea>';
                if (_self.options.previewPage) {
                    html += '<span id="embedOptions">' + i18n.viewer.shareMenu.preview + '</span>';
                }
                node = query('#shareControls')[0];
                if (node) {
                    node.innerHTML = html;
                }
                // embed click
                if (_self.options.previewPage) {
                    var embedOptions = dom.byId("embedOptions");
                    if (embedOptions) {
                        // on click
                        on(embedOptions, "click, keyup", function (event) {
                            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                var w = _self.options.previewSize.width;
                                var h = _self.options.previewSize.height;
                                var left = (screen.width / 2) - (w / 2);
                                var top = (screen.height / 2) - (h / 2);
                                window.open(_self.options.previewPage + _self.options.shareParams, 'embed', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
                            }
                        });
                    }
                }
                // toggle share menu
                var shareIcon = dom.byId("shareIcon");
                if (shareIcon) {
                    on(shareIcon, "click, keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.toggleMenus('share');
                        }
                    });
                }
                var fbImage = dom.byId("fbImage");
                if (fbImage) {
                    // share buttons
                    on(fbImage, "click, keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.setFBLink(_self.options.shareURL);
                            return false;
                        }
                    });
                }
                var twImage = dom.byId("twImage");
                if (twImage) {
                    on(twImage, "click, keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.setTWLink(_self.options.shareURL);
                            return false;
                        }
                    });
                }
                var inputShare = dom.byId("inputShare");
                if (inputShare) {
                    on(inputShare, "click", function (event) {
                        this.select();
                    });
                }
                var quickEmbedCode = dom.byId("quickEmbedCode");
                if (quickEmbedCode) {
                    on(quickEmbedCode, "click", function (event) {
                        this.select();
                    });
                }
            }
        },
        removeSpotlight: function () {
            query('.spotlight').removeClass('spotlight-active');
        },
        // show search
        configureSearchBox: function () {
            var _self = this;
            if (_self.options.showSearchBox) {
                var html = '<div id="spotlight" class="spotlight"><\/div>';
                domConstruct.place(html, dom.byId('map_container'), 'last');
                _self._geocoder = new esri.dijit.Geocoder({
                    map: _self.map,
                    theme: 'modernGrey',
                    autoComplete: true
                }, dom.byId("geocoderSearch"));
                // on select test
                connect.connect(_self._geocoder, 'onSelect', function (result) {
                    var spotlight = connect.connect(_self.map, 'onExtentChange', function () {
                        var geom = esri.geometry.toScreenGeometry(_self.map.extent, _self.map.width, _self.map.height, result.extent);
                        var width = geom.xmax - geom.xmin;
                        var height = geom.ymin - geom.ymax;
                        var max = height;
                        if (width > height) {
                            max = width;
                        }
                        var margin = '-' + Math.floor(max / 2) + 'px 0 0 -' + Math.floor(max / 2) + 'px';
                        var pt = result.feature.geometry;
                        _self.setMarker(pt, result.name);
                        query('.spotlight').addClass('spotlight-active').style({
                            width: max + 'px',
                            height: max + 'px',
                            margin: margin
                        });
                        _self.setSharing();
                        connect.disconnect(spotlight);
                    });
                });
                connect.connect(_self._geocoder, 'onFindResults', function (response) {
                    if (!response.results.length) {
                        _self.alertDialog(i18n.viewer.errors.noLocation);
                        _self.resetLocateLayer();
                    }
                });
                _self._geocoder.startup();
                // on clear test
                connect.connect(_self._geocoder, 'onClear', function () {
                    _self.removeSpotlight();
                    _self.resetLocateLayer();
                    _self.clearPopupValues();
                    _self.map.infoWindow.hide();
                });
                if (_self.options.locateName) {
                    _self._search.set('value', _self.options.locateName);
                }
            }
        },
        // show about button if url is set
        configureAboutText: function () {
            var _self = this;
            if (_self.itemInfo.item.description && _self.options.showAboutDialog) {
                // insert html
                var node = dom.byId('aboutMapCon');
                if (node) {
                    node.innerHTML = '<span tabindex="0" class="barButton" id="aboutMap" title="' + i18n.viewer.buttons.aboutTitle + '"><span class="barIcon aboutInfo"></span>' + i18n.viewer.buttons.about + '</span>';
                }
                node = dom.byId('aboutDialog');
                var html = '';
                html += '<div class="padContainer">';
                html += '<h2 tabindex="0">' + _self.itemInfo.item.title + '</h2>';
                html += '<div class="desc">' + _self.itemInfo.item.description + '</div>';
                html += '<div class="clear"></div>';
                // see if not just empty HTML tags
                if (_self.itemInfo.item.licenseInfo) {
                    var result = _self.itemInfo.item.licenseInfo.replace(/(<([^>]+)>)/ig, "");
                    if (_self.itemInfo.item.licenseInfo && result) {
                        html += '<h3>' + i18n.viewer.about.access + '</h3>';
                        html += '<div class="license">' + _self.itemInfo.item.licenseInfo + '</div>';
                    }
                }
                html += '</div>';
                if (node) {
                    node.innerHTML = html;
                }
                var aboutMap = dom.byId("aboutMap");
                if (aboutMap) {
                    on(aboutMap, "click, keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            this.blur();
                            _self.hideAllMenus();
                            _self.toggleAboutMap(this);
                        }
                    });
                }
                var props = {
                    //style: "width:550px;",
                    style: "width:52%; max-width:725px; min-width:400px;",
                    draggable: true,
                    modal: false,
                    showTitle: true,
                    title: i18n.viewer.about.title
                };
                _self.options.aboutDialog = new Dialog(props, dom.byId('aboutDialog'));
                node = query('#aboutDialog .dijitDialogTitle')[0];
                if (node) {
                    node.innerHTML = '<span class="inlineIcon aboutInfo"></span>' + i18n.viewer.about.title;
                }
                if (_self.options.showAboutDialogOnLoad) {
                    _self.options.aboutDialog.show();
                }
                connect.connect(_self.options.aboutDialog, 'onHide', function () {
                    var buttons = query('#mapcon .barButton');
                    if (buttons && buttons.length > 0) {
                        buttons.removeClass('barSelected');
                        for (var i = 0; i < buttons.length; i++) {
                            buttons[i].blur();
                        }
                    }
                });
            }
        },
        createCustomSlider: function () {
            var _self = this;
            var node = dom.byId('zoomSlider');
            var html = '';
            if (_self.options.showGeolocation && "geolocation" in navigator) {
                html += '<div tabindex="0" title="' + i18n.viewer.places.myLocationTitle + '" id="geoLocate"></div>';
            } else {
                _self.options.showGeolocation = false;
            }
            var homeClass = '';
            if (!_self.options.showGeolocation) {
                homeClass = 'noGeo';
            }
            html += '<div tabindex="0" title="' + i18n.viewer.general.homeExtent + '" id="homeExtent" class="' + homeClass + '"></div>';
            html += '<div id="customZoom"></div>';
            if (node) {
                node.innerHTML = html;
            }
            // Home extent
            var homeExtent = dom.byId("homeExtent");
            if (homeExtent) {
                on(homeExtent, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        _self.map.setExtent(_self.options.startExtent);
                    }
                });
            }
            // geolocate click
            var geolocateButton = dom.byId("geoLocate");
            if (geolocateButton) {
                on(geolocateButton, "click, keyup", function (event) {
                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            _self.geoLocateMap(position);
                        }, function (error) {
                            _self.geoLocateMapError(error);
                        }, {
                            maximumAge: 3000,
                            timeout: 5000,
                            enableHighAccuracy: true
                        });
                    }
                });
            }
            connect.connect(_self.map, "onZoomEnd", function (evt) {
                var level = _self.map.getLevel();
                if (level !== -1 && _self.options.mapZoomBar) {
                    _self.options.mapZoomBar.set("value", level);
                }
            });
            var sliderMax;
            var mapLevel;
            if (_self.map.getLevel() !== -1) {
                mapLevel = _self.map.getLevel();
            }
            if (_self.map._params && _self.map._params.lods) {
                sliderMax = _self.map._params.lods.length - 1;
            }
            if (typeof sliderMax !== 'undefined' && typeof mapLevel !== 'undefined') {
                _self.options.mapZoomBar = new VerticalSlider({
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
                        if (_self.map.getLevel() !== level) {
                            _self.map.setLevel(level);
                        }
                    }
                }, "customZoom");
            }
        },
        // application title
        configureAppTitle: function () {
            var _self = this;
            document.title = _self.itemInfo.item.title;
            var node = dom.byId('mapTitle');
            if (node) {
                node.innerHTML = _self.itemInfo.item.title;
                query(node).attr('title', _self.itemInfo.item.title);
            }
            query('meta[name="Description"]').attr('content', _self.itemInfo.item.snippet);
            query('meta[property="og:image"]').attr('content', esri.arcgis.utils.arcgisUrl + '/' + _self.itemInfo.item.id + '/info/' + _self.itemInfo.item.thumbnail);
        },
        // Hide dropdown menu
        hideMenu: function (menuObj) {
            if (menuObj) {
                coreFx.wipeOut({
                    node: menuObj,
                    duration: 200
                }).play();
                var selectedMenus = query('#mapcon .menuSelected').removeClass('menuSelected');
                var buttons = query('#mapcon .barButton');
                for (var i = 0; i < buttons.length; i++) {
                    buttons[i].blur();
                }
            }
        },
        // Hide layer info boxes
        hideLayerInfo: function () {
            query('.listMenu ul li .infoHidden').style('display', 'none');
            query('.listMenu ul li').removeClass('active');
        },
        // toggle menu object
        toggleMenus: function (menu) {
            var _self = this;
            if (menu) {
                // get nodes
                var menuQuery = query('#dataMenuCon [data-menu="' + menu + '"]')[0];
                var buttonQuery = query('#topMenuCon [data-menu="' + menu + '"]')[0];
                // remove selected buttons
                query('#topMenuCon .barButton').removeClass('barSelected');
                if (menuQuery) {
                    if (domClass.contains(menuQuery, "menuSelected")) {
                        _self.hideMenu(menuQuery);
                    } else {
                        _self.hideAllMenus();
                        _self.showMenu(menuQuery, buttonQuery);
                    }
                }
                _self.hideLayerInfo();
            } else {
                _self.hideAllMenus();
            }
        },
        // add menus to dom
        addSlideMenus: function () {
            var html = '';
            html += '<div id="dataMenuCon">';
            html += '<div data-menu="share" id="shareControls" class="slideMenu"></div>';
            html += '<div data-menu="autocomplete" id="autoComplete" class="slideMenu"></div>';
            html += '<div data-menu="places" id="placesMenu" class="slideMenu listMenu"></div>';
            html += '<div data-menu="basemap" id="basemapMenu" class="slideMenu"></div>';
            html += '<div data-menu="layers" id="layersMenu" class="slideMenu listMenu"></div>';
            html += '<div data-menu="social" id="socialMenu" class="slideMenu listMenu"></div>';
            html += '<div data-menu="legend" id="legendMenu" class="slideMenu"></div>';
            html += '</div>';
            var node = query('#mapcon')[0];
            if (node) {
                domConstruct.place(html, node, "last");
            }
            query('#mapcon .slideMenu').style('display', 'none');
        },
        webmapNext: function(){
            var _self = this;
            _self.setStartExtent();
            _self.setStartLevel();
            _self.setStartMarker();
            _self.configureAppTitle();
            _self.configureShareMenu();
            _self.configureAboutText();
            _self.configurePlaces();
            // once map is loaded
            if (_self.map.loaded) {
                _self.mapIsLoaded();
            } else {
                connect.connect(_self.map, "onLoad", function () {
                    _self.mapIsLoaded();
                });
            }
        },
        // webmap object returned. Create map data
        webmapReturned: function (response) {
            var _self = this;
            // map response
            _self.mapResponse = response;
            // webmap
            _self.map = response.map;
            _self.itemInfo = response.itemInfo;
            if (_self.options.appid) {
                // get webapp object item info
                _self.getItemData(true).then(function(resp){
                    if(resp && resp.length){
                        for (var i in resp) {
                           if (resp.hasOwnProperty(i) && resp[i] === "" || resp[i] === null ) {
                               delete resp[i];
                            }
                        }
                        // set other config options from app id
                        _self.itemInfo.item = declare.safeMixin(_self.itemInfo.item, appSettings);
                    }
                    _self.webmapNext();
                });
            }
            else{
                _self.webmapNext();
            }
        },
        onMapLoad: function () {},
        mapIsLoaded: function () {
            var _self = this;
            // map connect functions
            connect.connect(window, "onresize", function () {
                _self.resizeMap();
            });
            _self.createCustomSlider();
            _self.setSharing();
            // set up social media
            _self.configureSocialMedia();
            // set up layer menu
            _self.configureLayers();
            _self.rightSideMenuButtons();
            // create basemap gallery widget
            _self.createBMGallery(_self.map);
            // resize map
            _self.resizeMap();
            _self.updateSocialLayers();
            _self.configureSearchBox();
            setTimeout(function () {
                connect.connect(_self.map, "onExtentChange", function (extent) {
                    _self.removeSpotlight();
                    // hide about panel if open
                    _self.hideAboutMap();
                    // update current extent
                    _self.options.extent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
                    // update sharing link
                    _self.setSharing();
                    // reset refresh timer for social media
                    _self.resetSocialRefreshTimer();
                });
            }, 4000);
            // map loaded.
            _self.onMapLoad();
        },
        // clear popup content, title and features
        clearPopupValues: function () {
            var _self = this;
            _self.options.customPopup.setContent('');
            _self.options.customPopup.setTitle('');
            _self.options.customPopup.clearFeatures();
        },
        // Info window popup creation
        configurePopup: function () {
            var _self = this;
            // popup dijit configuration
            _self.options.customPopup = new esri.dijit.Popup({
                offsetX: 3,
                fillSymbol: false,
                highlight: false,
                lineSymbol: false,
                marginLeft: 10,
                marginTop: 10,
                markerSymbol: false,
                offsetY: 3,
                zoomFactor: 4
            }, domConstruct.create("div"));
            // connects for popup
            connect.connect(_self.options.customPopup, "maximize", function () {
                _self.hideAllMenus();
            });
            connect.connect(_self.options.customPopup, "onSelectionChange", function () {
                _self.overridePopupTitle();
            });
            connect.connect(_self.options.customPopup, "onHide", function () {
                _self.clearPopupValues();
            });
            // popup theme
            domClass.add(_self.options.customPopup.domNode, "modernGrey");
        },
        // Create the map object for the template
        createWebMap: function () {
            var _self = this;
            // configure popup
            _self.configurePopup();
            // create map deferred with options
            var mapDeferred = esri.arcgis.utils.createMap(_self.options.webmap, 'map', {
                mapOptions: {
                    slider: false,
                    wrapAround180: true,
                    infoWindow: _self.options.customPopup,
                    isScrollWheelZoom: true
                },
                bingMapsKey: templateConfig.bingMapsKey,
                geometryServiceURL: templateConfig.helperServices.geometry.url
            });
            // on successful response
            mapDeferred.addCallback(function (response) {
                _self.webmapReturned(response);
            });
            // on error response
            mapDeferred.addErrback(function (error) {
                _self.alertDialog(i18n.viewer.errors.createMap + ": " + error.message);
            });
        },
        init: function () {
            var _self = this;
            _self.setOptions();
            // add menus
            _self.addSlideMenus();
            // Create Map
            _self.createWebMap();
            // filtering
            if (_self.options.bannedUsersService && _self.options.flagMailServer) {
                _self.filterUsers = true;
                _self.createSMFOffensive();
            }
            if (_self.options.bannedWordsService) {
                _self.filterWords = true;
                _self.createSMFBadWords();
            }
        }
    });
    return Widget;
});