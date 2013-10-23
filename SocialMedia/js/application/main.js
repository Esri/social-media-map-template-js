define([
    "dojo/ready",
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/Deferred",
    "dojo/_base/lang",
    "dojox/mobile",
    "dojox/mobile/migrationAssist",
    "dojo/promise/all",
    "dojo/_base/event",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/date",
    "dojo/number",
    "dojo/window",
    "dojo/on",
    "dojo/aspect",
    "dojo/fx",
    "dojo/i18n!./nls/template.js",
    "modules/HeatmapLayer",
    "modules/ClusterLayer",
    "modules/flickr",
    "modules/panoramio",
    "modules/twitter",
    "modules/ushahidi",
    "modules/youtube",
    "config/commonConfig",
    "dojo/cookie",
    "dojo/json",
    "dojo/html",
    "esri/config",
    "esri/arcgis/utils",
    "modules/utils",
    "modules/mapnote",
    "dijit/Dialog",
    "dijit/form/HorizontalSlider",
    "dijit/form/VerticalSlider",
    "dojo/NodeList-traverse",
    "dojo/NodeList-manipulate",
    "esri", // We're not directly using anything defined in esri.js but geometry, locator and utils are not AMD. So, the only way to get reference to esri object is through esri module (ie. esri/main)
    "esri/dijit/Geocoder",
    "esri/layers/FeatureLayer",
    "dijit/TitlePane",
    "dojox/widget/TitleGroup",
    "esri/dijit/PopupMobile",
    "dojox/mobile/SimpleDialog",
    "esri/geometry/Extent",
    "esri/geometry/webMercatorUtils",
    "esri/dijit/BasemapGallery",
    "modules/Switch",
    "esri/InfoWindowBase",
    "esri/geometry",
    "esri/utils",
    "esri/map",
    "esri/IdentityManager",
    "esri/widgets",
    "dojo/touch",
    "dojox/mobile/parser",
    "dojox/mobile/compat",
    "dojox/mobile/Heading",
    "dojox/mobile/View",
    "dojox/mobile/ScrollableView",
    "dojox/mobile/TabBar",
    "dojox/mobile/RoundRectList",
    "dojox/mobile/RoundRectCategory",
    "dojox/mobile/TabBarButton",
    "dojox/mobile/ContentPane",
    "dojox/mobile/IconMenu",
    "dojox/mobile/IconMenuItem",
    "dojox/mobile/Switch",
    "dojox/mobile/ListItem",
    "dojox/mobile/scrollable",
    "dojox/mobile/Accordion"
],
	function (ready, declare, connect, Deferred, lang, dojoMbl, mlist, all, event, array, dom, query, domClass, domConstruct, domGeom, domStyle, domAttr,
              date, number, win, on, aspect, coreFx, i18n, HeatmapLayer, ClusterLayer, Flickr, Panoramio, Twitter, Ushahidi, YouTube, templateConfig,
              cookie, JSON, html, config, arcgisUtils, utils, mapnote, Dialog, HorizontalSlider, VerticalSlider, nlTraverse, nlManipulate, esri, Geocoder,
              FeatureLayer, TitlePane, TitleGroup, PopupMobile, SimpleDialog, Extent, webMercatorUtils, BasemapGallery, Switch, Accordion) {
            var Widget = declare("application.main", null, {
                popup: null,
                tinyUrl: null,
                legendFilter: {},
                zoomToAttributes: null,
                gTitle: null,
	        mobilePoint: null,
                constructor: function (options) {
                    var _self = this;
                    this.options = {};
	            this.mapNotesLayer = [];
                    declare.safeMixin(_self.options, options);
                    _self.utils = new modules.utils({ options: _self.options });
	            _self.mapnote = new modules.mapnote({ options: _self.options });
                    _self.setOptions();
                    ready(function () {
                        _self.setAppIdSettings().then(function () {
				_self.init();
				document.dojoClick = false;
                        });
                    });
                    var supportsOrientationChange = "onorientationchange" in window,
                    orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
                    if (window.addEventListener) {
                        window.addEventListener(orientationEvent, dojo.hitch(this, function () {
                            if (dojo.isBrowser) {
                                _self.resizeTopMenuBar();
                            }
                            _self.orientationChanged();
                            _self.resizeMap();
                        }), false);
                    }
                    if (dojo.isMobileDevice && dojo.isiOS) {
                        dojo.connect(window, "onscroll", dojo.hitch(this, function (evt) {
                            if (window.pageYOffset <= 10) {
                                dojo.body().style.height = window.innerHeight + 60 + 'px';
                                dojo.byId('mapcon').style.height = window.innerHeight + 'px';
                            } else {
                                dojo.body().style.height = window.innerHeight - 60 + 'px';
                                dojo.byId('mapcon').style.height = dojo.window.getBox().h + 'px';
                                this.hideAddressBar();
                            }
                            _self.setViewHeight();
                        }));
                    }
                    dojo.connect(window, "onresize", function () {
                        _self.orientationChanged();
                        _self.resizeMap();
                    });
                },

                addReportInAppButton: function () {
                    var _self = this;
                    if (_self.options.bannedUsersService) {
                        _self.utils.removeReportInAppButton();
                        if (dojo.isMobileDevice) {
                            var html = '<span id="zoomTo" class="accessoryButton"><div id="zoomToLabel">' + i18n.viewer.buttons.zoomToLabel + '</div></span>';
                            html += '<span id="inFlag" class="accessoryButton"><div id="reportItem">' + i18n.viewer.buttons.flagAppropriate + '</div></span>';
                            if (dojo.byId('zoomTo')) {
                                dojo.destroy(dojo.byId('zoomTo'));
                            }
                            domConstruct.place(html, query('.esriMobileInfoViewItem')[query('.esriMobileInfoViewItem').length - 1], 'last');
                            dojo.connect(dojo.byId('zoomTo'), "onclick", this, function () {
                                _self.options.map.infoWindow.hide();
	                        query('.esriMobileNavigationBar')[0].style.display = "none";
	                        query('.esriMobileInfoView, .esriMobilePopupInfoView')[0].style.display = "none";
                                var level = _self.options.map.getLevel();
                                _self.options.map.centerAndZoom(_self.zoomToAttributes, level + 1);
                                setTimeout(function () {
                                    dojo.showInfoWindow = true;
                                    _self.options.map.infoWindow.show(_self.zoomToAttributes);
                                }, 1000);

                                if (dojo.query('.ytContent').length > 0) {
                                    var divytContent = dojo.query('.ytContent')[0];
                                    divytContent.id = "divytContent";
                                    dojo.empty(dojo.byId("divytContent"));
                                }
                                dojo.byId('divCont').style.display = "block";
                            });
                        } else {
                            if (query('.esriPopup .actionList')[0]) {
                                if (dojo.isReferrer) {
                                    if ((window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) <= 450) {
                                        query('.esriPopup .actionList .action')[0].innerHTML = "";
                                        query('.esriPopup .actionList .action')[0].title = i18n.viewer.buttons.zoomToLabel;
                                    }
                                }
                            }
                            var html = '<span id="inFlag"><a id="reportItem">' + i18n.viewer.buttons.flagAppropriate + '</a></span>';

                            if (query('.esriPopup .actionList')[0]) {
                                domConstruct.place(html, query('.esriPopup .actionList')[0], 'last');
                                if (dojo.isReferrer) {
                                    if ((window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) <= 450) {
                                        dojo.byId("reportItem").innerHTML = '';
                                        dojo.byId("reportItem").title = i18n.viewer.buttons.flagAppropriate;
                                    }
                                }
                            }

                        }
                        if (dom.byId('reportItem')) {
                            _self.options.flagConnect = connect.connect(dom.byId('reportItem'), 'onclick', function (event) {
                                var node = dom.byId('inFlag');
                                if (node) {
                                    dojo.removeClass(node, 'accessoryButton');
                                    if (window.innerWidth < 420) {
                                        node.innerHTML = '<span id="reportLoading"></span> ';
                                    } else {
                                        node.innerHTML = '<span id="reportLoading">Reporting&hellip;</span> ';
                                    }
                                    _self.ReportInapp();
                                }
                            });
                        }
                        if (!(_self.gTitle === "Twitter" || _self.gTitle === "YouTube" || _self.gTitle === "Flickr" || _self.gTitle === "Panoramio" || _self.gTitle === "Ushahidi")) {
                            _self.utils.removeReportInAppButton();
                        }
                    }
                },
                orientationChanged: function () {
                    var _self = this;
                    if (_self.options.map) {
                        var timeout = (dojo.isMobileDevice && dojo.isiOS) ? 500 : 1000;
                        setTimeout(dojo.hitch(this, function () {
                            if (dojo.isMobileDevice) {
                                _self.hideAddressBar();
                                _self.setViewHeight();
	                        _self.resetTitle();
                            }
                            if (_self.options.map.infoWindow.isShowing) {
	                        if (dojo.isMobileDevice) {
	                            _self.options.map.centerAt(_self.options.map.graphics.graphics[0]._extent.getCenter());
	                        } else {
                                _self.options.map.centerAt(_self.options.map.infoWindow._location);
                            }
                            _self.options.map.reposition();
                            _self.options.map.resize();
                            dijit.byId('mapcon').resize();
	                    }

                        }), timeout);
                    }
                },
	        resetTitle: function () {
	            if (dojo.coords(query('.mblHeadingCenterTitle .mblHeadingDivTitle')[0]).w > 500) {
	            }
	        },

                hideAddressBar: function () {
                    var searchInputBox = query('.modernGrey .esriGeocoder input')[0];
                    if (window.orientation === 0) {
                        if (dojo.isiOS) {
                            dojo.body().style.height = window.innerHeight + 60 + 'px';
                        }
                        if (searchInputBox) {
                            searchInputBox.style.width = '65%';
                        }
                        dojo.byId("uList").style.height = "50px";
                        dojo.query('.esriControlsBR')[0].style.bottom = "50px";
                        window.scrollTo(0, 1);

                    } else {
                        if (dojo.isiOS) {
                            dojo.body().style.height = window.innerHeight + 'px';
                        }
                        if (searchInputBox) {
                            searchInputBox.style.width = '80%';
                        }
                        dojo.byId("uList").style.height = "35px";
                        dojo.query('.esriControlsBR')[0].style.bottom = "35px";
                    }
                    dojo.byId('mapcon').style.height = dojo.window.getBox().h + 'px';
                },

                setViewHeight: function () {
                    var height = dojo.window.getBox().h - dojo.coords(dojo.byId("uList")).h + 'px';
                    query(dojo.byId('layersView')).style('height', height);
                    query(dojo.byId('legendView')).style('height', height);
                    query(dojo.byId('shareView')).style('height', height);
                    query(dojo.byId('aboutView')).style('height', height);
                    query(dojo.byId('bookmarkView')).style('height', height);
                    query('.mobileViews').style('height', height);
                    if (dijit.byId("layersView")) {
                        dijit.byId("layersView").resize();
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
                                "author": (_self.options.activeFeature.attributes.filterAuthor) ? _self.options.activeFeature.attributes.filterAuthor : i18n.viewer.errors.notAvailable,
                                "appname": (_self.options.itemInfo.item.title) ? _self.options.itemInfo.item.title : i18n.viewer.errors.notAvailable,
                                "type": (_self.options.activeFeature.attributes.filterType) ? _self.options.activeFeature.attributes.filterType : i18n.viewer.errors.notAvailable,
                                "content": (_self.options.activeFeature.attributes.filterContent) ? _self.options.activeFeature.attributes.filterContent : i18n.viewer.errors.notAvailable
                            },
                            handleAs: 'json',
                            callbackParamName: 'callback',
                            // on load
                            load: function () {
                                _self.utils.replaceFlag();
                            },
                            error: function () {
                                _self.utils.replaceFlagError();
                            }
                        });
                    } else {
                        _self.utils.replaceFlagError();
                    }
                },

                // set application configuration settings
                setAppIdSettings: function () {
                    var _self = this;
                    var deferred = new Deferred();
                    if (_self.options.appid) {
                        var requestHandle = esri.request({
                            url: arcgisUtils.arcgisUrl + "/" + _self.options.appid + "/data",
                            content: {
                                f: "json"
                            },
                            callbackParamName: "callback",
                            // on load
                            load: function (response) {
                                // check for false value strings
                                var appSettings = _self.utils.setFalseValues(response.values);
                                // set other config options from app id
                                _self.options = declare.safeMixin(_self.options, appSettings);
                                // callback function
                                deferred.resolve();
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
                // get URL params
                configUrlParams: function () {
                    var _self = this;
                    // set url object
                    var params = _self.utils.getUrlObject();
                    // check for false value strings
                    params.query = _self.utils.setFalseValues(params.query);
                    // mix in settings
                    _self.options = declare.safeMixin(_self.options, params.query);
                },

                // Set sharing links
                setSharing: function () {
                    var _self = this;
                    // parameters to share
                    var urlParams = ['webmap', 'basemap', 'extent', 'locateName', 'layers', 'youtubeSearch', 'youtubeRange', 'youtubeChecked', 'twitterSearch', 'twitterChecked', 'flickrSearch', 'flickrRange', 'flickrChecked', 'panoramioChecked', 'ushahidiChecked', 'socialDisplay', 'locatePoint', 'showMapNote'];
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
                                _self.options.shareParams += urlParams[i] + '=' + _self.options[urlParams[i]].toString();
                            }
                        }
                        var params = _self.utils.getUrlObject();
                        // embed path URL
                        var pathUrl = params.path.substring(0, params.path.lastIndexOf('/'));
                        // Sharing url
                        _self.options.shareURL = pathUrl + '/' + _self.options.homePage + _self.options.shareParams;
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
                    }
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
                    if (dojo.isMobileDevice) {
                        alert(text);
                    } else {
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
                            class: "alertDijit",
                            draggable: true,
                            modal: false,
                            showTitle: true,
                            title: i18n.viewer.errors.general,
                            content: html
                        };
                        _self._alertDialog = new Dialog(props, dom.byId('alertDialog'));
                        _self._alertDialog.show();
                        _self.alertCloseConnect = on(dom.byId("closeAlert"), "click, keyup", function (event) {
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
                    _self.basemapDijit = new BasemapGallery({
                        showArcGISBasemaps: _self.options.useArcGISOnlineBasemaps,
                        bingMapsKey: templateConfig.bingMapsKey,
                        basemapsGroup: basemapGroup,
                        map: _self.options.map
                    }, domConstruct.create("div"));

                    // on error
                    connect.connect(_self.basemapDijit, "onError", function (msg) {
                        console.log(msg);
                    });
                    // on initial load
                    connect.connect(_self.basemapDijit, "onLoad", function () {
                        query('#mapcon').removeClass('mapLoading');
                        _self.selectCurrentBasemap().then(function () {
                            if (dojo.isMobileDevice) {
                                dijit.byId("mapTab").set('selected', true);
                                dijit.byId("mapcon").show();
                                dijit.byId("mapcon").resize();
                                dojo.byId('divCont').style.display = "block";
                            } else {
                                _self.utils.hideAllMenus();
                            }

                            connect.connect(_self.basemapDijit, "onSelectionChange", function () {
                                if (dojo.isMobileDevice) {
                                    dijit.byId("mapTab").set('selected', true);
                                    dijit.byId("mapcon").show();
                                    dijit.byId("mapcon").resize();
                                    dojo.byId('divCont').style.display = "block";
                                } else {
                                    _self.utils.hideAllMenus();
                                }
                                _self.baseMapChanged();
                            });
                        });
                    });
                    // start it up
                    _self.basemapDijit.startup();

                    if (!dojo.isMobileDevice) {
                        var baseContainer = dom.byId("baseContainer");
                        if (baseContainer) {
                            domConstruct.place(_self.basemapDijit.domNode, baseContainer, "first");
                        }
                    } else {
                        if (dijit.byId("basemapContent")) {
                            dijit.byId("basemapContent").addChild(_self.basemapDijit);
                        }

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
                        bmid = _self.getBasemapIdTitle(_self.options.itemInfo.itemData.baseMap.title);
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
                },

                // set the order of these functions
                setOptions: function () {
                    var _self = this;
                    _self.configUrlParams();
                    _self.utils.setDefaultOptions();
                    _self.utils.validateConfig();
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
                        on(collapseIcon, "click, keyup, touchstart", function (event) {
                            _self.utils.toggleSettingsContent();
                        });
                    }
                    var socialList = dom.byId("socialList");
                    if (socialList) {
                        on(socialList, ".toggle:click, .toggle:keyup", function (event) {
                            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                _self.utils.toggleChecked(this);
                                var changeMapVal = query(this).parent('li').attr('data-layer')[0];
                                _self.toggleMapLayerSM(changeMapVal);
                            }
                        });
                    }
                    var settingsDialog = dom.byId("settingsDialog");
                    if (settingsDialog) {
                        on(settingsDialog, ".dijitDialogTitleBar:dblclick", function (event) {
                            _self.utils.toggleSettingsContent();
                        });
                    }
                    for (var i = 0; i < _self.options.socialLayers.length; i++) {
                        _self.utils.socialMediaChangeEvents(i);
                    }
                },
                //         gets string for social media popup title
                getSmPopupTitle: function () {
                    var _self = this;
                    var graphic = _self.options.customPopup.getSelectedFeature();
                    var socialString = '';
                    var pagString = '';
                    if (graphic) {
                        var total = _self.options.customPopup.count;
                        var current = _self.options.customPopup.selectedIndex + 1;
                        var socialObject;
                        // if more than 1
                        if (total > 1) {
                            pagString = '<span class="pageInfo">(' + number.format(current) + ' ' + i18n.viewer.general.of + ' ' + number.format(total) + ')</span>';
                        }
                        var layer = _self.utils.getSocialLayer(graphic.attributes.smType);
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
                    _self.options.activeFeature = graphic;
                    return socialString + pagString;
                },
                // overrides popup title for social media to add image
                overridePopupTitle: function () {
                    var _self = this;
                    if (!dojo.isMobileDevice) {
                        _self.options.customPopup.setTitle(this.getSmPopupTitle());
                    }
                    var graphic = _self.options.customPopup.getSelectedFeature();
                    _self.options.activeFeature = graphic;

                    if (graphic) {
                        _self.gTitle = graphic.getTitle();
                    }
                    if (this.filterUsers) {
                        _self.addReportInAppButton();
                    }
                },
                // update social layers
                updateSocialLayers: function () {
                    var _self = this;
                    var promises = [];
                    for (var i = 0; i < _self.options.socialLayers.length; i++) {
                        if (dojo.isMobileDevice) {
                            if (dijit.byId("sw" + _self.options.socialLayers[i].options.id).value === "on") {
                                window['d' + _self.options.socialLayers[i].options.title] = new Deferred();
                                promises.push(window['d' + _self.options.socialLayers[i].options.title]);
                            }
                        }
                        _self.options.socialLayers[i].newQuery();
                    }
                    if (dojo.isMobileDevice && (!_self.options.updateSocialLayersOnPan)) {
                        all(promises).then(function () {
                            dojo.byId('imgRefresh').src = "./images/ui/refresh.png";
                            if (dojo.byId('divMessage')) {
                                dojo.byId('divMessage').style.display = "none";
                            }
                        });
                    }
                },
                // reset social refresh timer
                resetSocialRefreshTimer: function () {
                    var _self = this;
                    if (_self.options.updateSocialLayersOnPan || (!dojo.isMobileDevice)) {
                        clearTimeout(_self.options.autoRefreshTimer);
                        _self.options.autoRefreshTimer = setTimeout(function () {
                            _self.updateSocialLayers();
                        }, 4000);
                    }
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
                                if (dojo.isMobileDevice) {
                                    if (dijit.byId('heatmap')) {
                                        dijit.byId('heatmap').set("selected", true);
                                    }
                                }
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
                                if (dojo.isMobileDevice) {
                                    if (dijit.byId('cluster')) {
                                        dijit.byId('cluster').set("selected", true);
                                    }
                                }
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
                            if (dojo.isMobileDevice) {
                                if (dijit.byId('point')) {
                                    dijit.byId('point').set("selected", true);
                                }
                            }
                            _self.options.socialDisplay = 'point';
                    }
                },

                changeDisplayAs: function (evt) {

                    var _self = this;
                    // data type variable
                    var dataType = evt.id;
                    if (dataType === 'heatmap' && _self.utils.isCanvasSupported()) {
                        _self.pointDisplay('heatmap');
                    } else if (dataType === 'cluster') {
                        _self.pointDisplay('cluster');
                    } else {
                        _self.pointDisplay('point');
                    }
                    _self.options.customPopup.hide();
                    _self.setSharing();

                },
                // toggle display as clusters/heatmap
                toggleDisplayAs: function (obj) {
                    var _self = this;
                    query('#displayAs .mapButton').removeClass('buttonSelected');
                    // data type variable
                    var dataType;
                    if (dojo.isMobileDevice) {
                        dataType = obj.id;
                    } else {
                        dataType = query(obj).attr('data-type')[0];
                        query(obj).addClass('buttonSelected');
                    }
                    if (dataType === 'heatmap' && _self.utils.isCanvasSupported()) {
                        _self.pointDisplay('heatmap');
                    } else if (dataType === 'cluster') {
                        _self.pointDisplay('cluster');
                    } else {
                        _self.pointDisplay('point');
                    }
                    _self.options.customPopup.hide();
                    _self.setSharing();

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

                        if (!_self.utils.isCanvasSupported()) {
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
                        html += '<div tabindex="0"  "title="' + i18n.viewer.buttons.point + '" data-type="point" class="mapButton pointButton buttonTop ' + pointClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.point + '</div>';
                        html += '<div tabindex="0"  title="' + i18n.viewer.buttons.cluster + '" data-type="cluster" class="mapButton clusterButton ' + clusterButton + clusterClass + '"><div class="iconBlock" ><img src="./' + _self.options.clusterImage + ' " /></div>' + i18n.viewer.buttons.cluster + '</div>';
                        if (_self.utils.isCanvasSupported()) {
                            html += '<div tabindex="0"  title="' + i18n.viewer.buttons.heatmap + '" data-type="heatmap" class="mapButton heatButton buttonBottom ' + heatmapClass + '"><span class="iconBlock"></span>' + i18n.viewer.buttons.heatmap + '</div>';
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
                        if (!dojo.isMobileDevice) {
                            if (obj.oAuth) {
                                layerClass += ' unauthenticated';
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
                            html += '<span tabindex="0" class="toggle cBtitle">' + obj.title + '<span class="count"></span>';
                            html += '</span>';
                            if (obj.oAuth) {
                                html += '<span class="oAuthSignIn"><a id="twSignInLink">' + i18n.viewer.social.signIn + '</a></span>';
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
                    }
                    if (dojo.isMobileDevice) {
                        if (dijit.byId("listSocial")) {
                            var item1 = new dojox.mobile.ListItem({
                                label: obj.title,
                                icon: obj.legendIcon,
                                moveTo: obj.title + "view"
                            });
                            dijit.byId("listSocial").addChild(item1);
                        }
                        var socialdiv = dojo.create("div", {
                            "id": obj.title + "view",
                            "class": "mobileViews"
                        }, dojo.body());
                        var ScrollV = dojo.create("div", { "id": obj.title + "scroll", "class": "scrollView" }, socialdiv);
                        var divSocialView = new dojox.mobile.View(null, obj.title + "view");
                        var socialViewHead = new dojox.mobile.Heading({
                            label: obj.title,
                            back: "Back",
                            moveTo: "layersView"
                        });
                        divSocialView.addChild(socialViewHead);
                        divSocialView.startup();
                        dojo.connect(dijit.byId(obj.title + "view"), "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                            this.resize();
                        });
                        var SocialScroll = new dojox.mobile.View({
                            id: obj.title + "scroll",
                            class: "mobileScrollViews"
                        });
                        divSocialView.addChild(SocialScroll);
                        var content1 = new dojox.mobile.RoundRectList({
                            label: "",
                            id: obj.title + 'ListItem'
                        });
                        var listItem = new dojox.mobile.ListItem({
                            label: i18n.viewer.buttons.layerVisible,
                            class: layerClass
                        });
                        var switchBtn = new Switch({
                            id: "sw" + obj.uniqueID,
                            class: "mblSwSquareShape"
                        });
                        listItem.addChild(switchBtn);
                        content1.addChild(listItem);
                        if (obj.visible) {
                            switchBtn.set('value', 'on');
                        } else {
                            switchBtn.set('value', 'off');
                        }
                        dojo.connect(dijit.byId("sw" + obj.uniqueID), "onStateChanged", function (newState) {
                            var id = (this.id).replace("sw", "");
                            _self.toggleMapLayerSM(id, newState);
                        });
                        var description = ' ';
                        if (obj.description) {
                            description += obj.description + ' ';
                        }
                        if (obj.searchTerm) {
                            description += i18n.viewer.layer.filteredBy + '  ' + '<span class="bold">' + obj.searchTerm + "</span>";
                        }
                        var content2 = new dojox.mobile.ContentPane({
                            content: description
                        });
                        SocialScroll.addChild(content1);
                        SocialScroll.addChild(content2);
                        if (obj.title == "Twitter") {
                            var accountInfo = '';
                            accountInfo += '<span id="twitterStatusList">';
                            accountInfo += '<label> ' + obj.title + '</label>';
                            accountInfo += '<span"><a id="twSignInLink2">' + i18n.viewer.social.signIn + '</a></span></span>';
                            var content3 = new dojox.mobile.ContentPane({
                                content: accountInfo
                            });
                            SocialScroll.addChild(content3);
                        }
                        SocialScroll.startup();
                    }
                },
                // update heat map
                updateDataPoints: function () {
                    var _self = this;
                    var dataPoints = [];
                    for (var i = 0; i < _self.options.socialLayers.length; i++) {
                        if (dojo.isMobileDevice) {
                            if (dijit.byId("sw" + _self.options.socialLayers[i].options.id).value === "on") {
                                dataPoints = dataPoints.concat(_self.options.socialLayers[i].dataPoints);
                            }
                        } else {
                            var list = query('#socialMenu .layer[data-layer=' + _self.options.socialLayers[i].options.id + ']');
                            if (list[0] && _self.options.socialLayers[i].dataPoints && domClass.contains(list[0], "checked")) {
                                dataPoints = dataPoints.concat(_self.options.socialLayers[i].dataPoints);
                            }
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
                            html += '<li id="twitterStatusList">';
                            html += '<label>' + _self.options.twitterTitle + '</label>';
                            html += '<span"><a id="twSignInLink2">' + i18n.viewer.social.signIn + '</a></span>';
                            html += '</li>';
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
                                var categoryID = dom.byId(_self.options.ushahidiID + '_category');
                                var catHTML = '';
                                var option1 = dojo.create('option', {}, null);
                                option1.value = '0';
                                option1.text = "All";
                                if (categoryID) {
                                    dom.byId(_self.options.ushahidiID + '_category').appendChild(option1);
                                }
                                for (var i = 0; i < categories.length; i++) {
                                    var option = dojo.create('option', {}, null);
                                    option.title = categories[i].category.description;
                                    option.value = categories[i].category.id;
                                    option.text = categories[i].category.title;
                                    if (categoryID) {
                                        dom.byId(_self.options.ushahidiID + '_category').appendChild(option);
                                    }
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
                // Social Media
                configureSocialMedia: function () {
                    var _self = this;
                    // if canvas is supported
                    if (_self.utils.isCanvasSupported()) {
                        // set up heat layer
                        _self.heatLayer = new HeatmapLayer({
                            config: {
                                useLocalMaximum: true
                            },
                            map: _self.options.map,
                            opacity: 0.85
                        }, "heatLayer");
                        _self.options.map.addLayer(_self.heatLayer);
                    }
                    // set up cluster layer
                    _self.clusterLayer = new ClusterLayer(null, {
                        map: _self.options.map,
                        id: "clusterLayer",
                        label: i18n.viewer.buttons.cluster,
                        clusterImage: _self.options.clusterImage,
                        clusterHoverImage: _self.options.clusterHoverImage
                    });
                    // if flickr
                    if (_self.options.showFlickr) {
                        var flickrLayer = new Flickr({
                            map: _self.options.map,
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
                            dateFrom: _self.utils.getFlickrDate('from'),
                            dateTo: _self.utils.getFlickrDate('to'),
                            apiKey: _self.options.flickrKey,
                            range: _self.options.flickrRange
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
	                    _self.mapnote.showInfoWindow = true;
                            _self.zoomToAttributes = evt.graphic.geometry;
                            _self.overridePopupTitle();
                            _self.overridePopupHeader();
                        });
                        connect.connect(flickrLayer, 'onUpdate', function () {
                            _self.updateDataPoints();
                        });
                        connect.connect(flickrLayer, 'onClear', function () {
                            _self.updateDataPoints();
                            _self.options.flickrChecked = false;
                            if (!dojo.isMobileDevice) {
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + '] .count')[0];
                                if (node) {
                                    node.innerHTML = '';
                                }
                            }
                        });
                        connect.connect(flickrLayer, 'onUpdateEnd', function () {
                            var totalCount = flickrLayer.getStats().geoPoints;
                            if (!dojo.isMobileDevice) {
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
                            }
                            else {
                                if (dFlickr) {
                                    dFlickr.resolve();
                                }
                            }
                        });
                        flickrLayer.newQuery = function (enable) {
                            if (enable) {
                                _self.options.flickrChecked = true;
                            }
                            if (dojo.isMobileDevice) {
                                var val = dijit.byId("sw" + _self.options.flickrID).value;
                                if (val === "on") {
                                    var updateObj = {
                                        searchTerm: _self.options.flickrSearch
                                    };
                                    if (_self.options.flickrRange) {
                                        updateObj.dateFrom = _self.utils.getFlickrDate('from');
                                        updateObj.dateTo = _self.utils.getFlickrDate('to');
                                    }
                                    flickrLayer.update(updateObj);
                                }
                            } else {
                                var flList = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + ']');
                                if (domClass.contains(flList[0], "checked")) {
                                    flList.addClass("cLoading");
                                    var updateObj = {
                                        searchTerm: _self.options.flickrSearch
                                    };
                                    if (_self.options.flickrRange) {
                                        updateObj.dateFrom = _self.utils.getFlickrDate('from');
                                        updateObj.dateTo = _self.utils.getFlickrDate('to');
                                    }
                                    flickrLayer.update(updateObj);
                                }
                            }
                        };
                        flickrLayer.change = function () {
                            if (!dojo.isMobileDevice) {
                                _self.options.flickrSearch = query('#' + _self.options.flickrID + '_input').attr('value')[0];
                                _self.options.flickrRange = query('#' + _self.options.flickrID + '_range').attr('value')[0];
                                _self.showLoading(_self.options.flickrID + '_load');
                                query('#socialMenu .layer[data-layer=' + _self.options.flickrID + ']').addClass("checked cLoading");
                                var html = '';
                                if (_self.options.flickrSearch) {
                                    html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + _self.options.flickrSearch + '</span>."';
                                }
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.flickrID + '] .filtered')[0];
                                if (node) {
                                    node.innerHTML = html;
                                }
                            }
                            flickrLayer.clear();
                            _self.options.flickrChecked = true;
                            var updateObj = {
                                searchTerm: _self.options.flickrSearch
                            };
                            if (_self.options.flickrRange) {
                                updateObj.dateFrom = _self.utils.getFlickrDate('from');
                                updateObj.dateTo = _self.utils.getFlickrDate('to');
                            }
                            flickrLayer.update(updateObj);
                            _self.setSharing();
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
                            map: _self.options.map,
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
	                    _self.mapnote.showInfoWindow = true;
                            _self.zoomToAttributes = evt.graphic.geometry;
                            _self.overridePopupTitle();
                            _self.overridePopupHeader();
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
                            if (!dojo.isMobileDevice) {
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
                            }
                            else {
                                if (dPanoramio) {
                                    dPanoramio.resolve();
                                }
                            }
                        });
                        panoramioLayer.newQuery = function (enable) {
                            if (enable) {
                                _self.options.panoramioChecked = true;
                            }
                            if (!dojo.isMobileDevice) {
                                var prList = query('#socialMenu .layer[data-layer=' + _self.options.panoramioID + ']');
                                if (domClass.contains(prList[0], "checked")) {
                                    prList.addClass("cLoading");
                                    panoramioLayer.update();
                                }
                            } else {
                                var val = dijit.byId("sw" + _self.options.panoramioID).value;
                                if (val === "on") {
                                    panoramioLayer.update();
                                }
                            }
                        };
                        panoramioLayer.change = function () { _self.setSharing(); };
                        _self.options.socialLayers.push(panoramioLayer);
                        // insert html
                        _self.insertSMItem({
                            visible: _self.options.panoramioChecked,
                            uniqueID: _self.options.panoramioID,
                            title: _self.options.panoramioTitle,
                            showSocialSettings: false,
                            legendIcon: _self.options.panoramioIcon,
                            description: _self.options.panoramioDescription
                        });
                    }
                    // if twitter
                    if (_self.options.showTwitter) {
                        var twitterLayer = new Twitter({
                            map: _self.options.map,
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
                        connect.connect(twitterLayer, 'authenticate', function () {
                            if (!dojo.isMobileDevice) {
                                var cbox = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .cBox')[0];
                                if (cbox) {
                                    _self.utils.toggleChecked(cbox);
                                }

                                _self.toggleMapLayerSM(_self.options.twitterID);
                                query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']').addClass('unauthenticated');
                                var signInNode = dom.byId('twSignInLink');
                                if (signInNode) {
                                    signInNode.innerHTML = i18n.viewer.social.signIn;
                                    on(signInNode, 'click', function () {
                                        _self.utils._twitterWindow(_self.options.twitterSigninUrl);
                                    });
                                }
                            } else {

                                if (dijit.byId("swtwitter")) {
                                    dijit.byId("swtwitter").set("value", "off");
                                }
                            }
                            var html = '';
                            html += '<label>' + _self.options.twitterTitle + '</label>';
                            html += '<span"><a id="twSignInLink2">' + i18n.viewer.social.signIn + '</a></span>';
                            node = dom.byId('twitterStatusList');
                            if (node) {
                                node.innerHTML = html;
                            }
                            var signInNode2 = dom.byId('twSignInLink2');
                            if (signInNode2) {
                                on(signInNode2, 'click', function () {
                                    _self.utils._twitterWindow(_self.options.twitterSigninUrl, false);
                                });
                            }
                        });
                        connect.connect(twitterLayer, 'unauthenticate', function () {
                            var signInNode = dom.byId('twSignInLink');
                            if (signInNode) {
                                signInNode.innerHTML = '';
                            }
                            if (!dojo.isMobileDevice) {
                                query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']').removeClass('unauthenticated');
                            } var html = '';
                            html += '<label>' + _self.options.twitterTitle + '</label>';
                            html += '<span"><a id="oAuthSwitchAccountTwitter">' + i18n.viewer.social.switchAccount + '</a></span>';
                            var node = dom.byId('twitterStatusList');
                            if (node) {
                                node.innerHTML = html;
                            }
                            var switchAccountNode = dom.byId('oAuthSwitchAccountTwitter');
                            if (switchAccountNode) {
                                on(switchAccountNode, 'click', function () {
                                    _self.utils._twitterWindow(_self.options.twitterSigninUrl, true);
                                });
                            }
                        });
                        connect.connect(twitterLayer, 'onUpdate', function () {
                            _self.updateDataPoints();
                        });
                        connect.connect(twitterLayer.featureLayer, 'onClick', function (evt) {
	                    _self.mapnote.showInfoWindow = true;
                            _self.zoomToAttributes = evt.graphic.geometry;
                            _self.overridePopupTitle();
                            _self.overridePopupHeader();
                        });
                        connect.connect(twitterLayer, 'onClear', function () {
                            _self.updateDataPoints();
                            _self.options.twitterChecked = false;
                            if (!dojo.isMobileDevice) {
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .count')[0];
                                if (node) {
                                    node.innerHTML = '';
                                }
                            }
                        });
                        connect.connect(twitterLayer, 'onUpdateEnd', function () {
                            var totalCount = twitterLayer.getStats().geoPoints;
                            if (!dojo.isMobileDevice) {
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
                            }
                            else {
                                if (dTwitter) {
                                    dTwitter.resolve();
                                }
                            }
                        });
                        twitterLayer.newQuery = function (enable) {

                            if (enable) {
                                _self.options.twitterChecked = true;
                            }
                            if (!dojo.isMobileDevice) {
                                var twList = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']');
                                if (domClass.contains(twList[0], "checked")) {
                                    twList.addClass("cLoading");
                                    twitterLayer.update({
                                        searchTerm: _self.options.twitterSearch
                                    });
                                }
                            } else {
                                var val = dijit.byId("sw" + _self.options.twitterID).value;
                                if (val === "on") {
                                    twitterLayer.update({
                                        searchTerm: _self.options.twitterSearch
                                    });
                                }
                            }
                        };
                        twitterLayer.change = function () {
                            if (!dojo.isMobileDevice) {
                                _self.options.twitterSearch = query('#' + _self.options.twitterID + '_input').attr('value')[0];
                                query('#socialMenu .layer[data-layer=' + _self.options.twitterID + ']').addClass("checked cLoading");
                                _self.showLoading(_self.options.twitterID + '_load');
                                var html = '';
                                if (_self.options.twitterSearch) {
                                    html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + _self.options.twitterSearch + '</span>."';
                                }
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.twitterID + '] .filtered')[0];
                                if (node) {
                                    node.innerHTML = html;
                                }
                            }
                            twitterLayer.clear();
                            _self.options.twitterChecked = true;
                            twitterLayer.update({
                                searchTerm: _self.options.twitterSearch
                            });
                            _self.setSharing();

                        };
                        _self.options.socialLayers.push(twitterLayer);
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

                    }
                    // if youtube
                    if (_self.options.showYouTube) {
                        var youtubeLayer = new YouTube({
                            map: _self.options.map,
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
	                    _self.mapnote.showInfoWindow = true;
                            _self.zoomToAttributes = evt.graphic.geometry;
                            _self.overridePopupTitle();
                            _self.overridePopupHeader();
                        });
                        connect.connect(youtubeLayer, 'onClear', function () {
                            _self.updateDataPoints();
                            _self.options.youtubeChecked = false;
                            if (!dojo.isMobileDevice) {
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + '] .count')[0];
                                if (node) {
                                    node.innerHTML = '';
                                }
                            }
                        });
                        connect.connect(youtubeLayer, 'onUpdateEnd', function () {
                            var totalCount = youtubeLayer.getStats().geoPoints;
                            if (!dojo.isMobileDevice) {
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
                            }
                            else {
                                if (dYouTube) {
                                    dYouTube.resolve();
                                }
                            }
                        });
                        youtubeLayer.newQuery = function (enable) {
                            if (enable) {
                                _self.options.youtubeChecked = true;
                            }
                            if (!dojo.isMobileDevice) {
                                // if youtube cbox is checked
                                var ytList = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + ']');
                                if (domClass.contains(ytList[0], "checked")) {
                                    ytList.addClass("cLoading");
                                    youtubeLayer.update({
                                        searchTerm: _self.options.youtubeSearch,
                                        range: _self.options.youtubeRange
                                    });
                                }
                            } else {
                                var val = dijit.byId("sw" + _self.options.youtubeID).value;
                                if (val === "on") {
                                    youtubeLayer.update({
                                        searchTerm: _self.options.youtubeSearch,
                                        range: _self.options.youtubeRange
                                    });
                                }
                            }
                        };
                        youtubeLayer.change = function () {
                            if (!dojo.isMobileDevice) {
                                _self.options.youtubeSearch = query('#' + _self.options.youtubeID + '_input').attr('value')[0];
                                _self.options.youtubeRange = query('#' + _self.options.youtubeID + '_range').attr('value')[0];
                                _self.showLoading(_self.options.youtubeID + '_load');
                                query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + ']').addClass("checked cLoading");
                                var html = '';
                                if (_self.options.youtubeSearch) {
                                    html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + _self.options.youtubeSearch + '</span>."';
                                }
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.youtubeID + '] .filtered')[0];
                                if (node) {
                                    node.innerHTML = html;
                                }
                            }
                            youtubeLayer.clear();
                            _self.options.youtubeChecked = true;
                            youtubeLayer.update({
                                searchTerm: _self.options.youtubeSearch,
                                range: _self.options.youtubeRange
                            });
                            _self.setSharing();
                        };

                        _self.options.socialLayers.push(youtubeLayer);
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

                    }
                    // if ushahidi

                    if (_self.options.showUshahidi) {
                        var ushahidiLayer = new Ushahidi({
                            map: _self.options.map,
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
                        connect.connect(ushahidiLayer, 'onUpdateEnd', function () {
                            if (!dojo.isMobileDevice) {
                                var totalCount = ushahidiLayer.getStats().geoPoints;
                                _self.hideLoading(query('#socialMenu ul li[data-layer=' + _self.options.ushahidiID + ']'), query('#' + _self.options.ushahidiID + '_load'));
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .keyword')[0];
                                if (node) {
                                    var cat = _self.utils.getUshahidCategory(_self.options.ushahidiCategory);
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
                            }
                            else {
                                if (dUshahidi) {
                                    dUshahidi.resolve();
                                }
                            }
                        });
                        connect.connect(ushahidiLayer.featureLayer, 'onClick', function (evt) {
	                    _self.mapnote.showInfoWindow = true;
                            _self.zoomToAttributes = evt.graphic.geometry;
                            _self.overridePopupTitle();
                            _self.overridePopupHeader();
                        });
                        connect.connect(ushahidiLayer, 'onClear', function () {
                            _self.updateDataPoints();
                            _self.options.ushahidiChecked = false;
                            var node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .count')[0];
                            if (node) {
                                node.innerHTML = '';
                            }
                        });

                        ushahidiLayer.newQuery = function (enable) {
                            if (enable) {
                                _self.options.ushahidiChecked = true;
                            }
                            if (!dojo.isMobileDevice) {
                                if (enable) {
                                    _self.options.ushahidiChecked = true;
                                }
                                var uhList = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + ']');
                                if (domClass.contains(uhList[0], "checked")) {
                                    uhList.addClass("cLoading");
                                    ushahidiLayer.update();
                                }
                            } else {
                                var val = dijit.byId("sw" + _self.options.ushahidiID).value;
                                if (val === "on") {
                                    ushahidiLayer.update();
                                }
                            }
                        };
                        ushahidiLayer.change = function () {
                            if (!dojo.isMobileDevice) {
                                _self.options.ushahidiCategory = parseInt(query('#' + _self.options.ushahidiID + '_category').attr('value')[0], 10);
                                _self.showLoading(_self.options.ushahidiID + '_load');
                                query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + ']').addClass("checked cLoading");
                                var html = '';
                                if (_self.options.ushahidiCategory) {
                                    var cat = _self.utils.getUshahidCategory(_self.options.ushahidiCategory);
                                    if (cat) {
                                        var title = cat.title;
                                        html = ' ' + i18n.viewer.layer.filteredBy + ' "<span class="keyword">' + title + '</span>."';
                                    }
                                }
                                var node = query('#socialMenu .layer[data-layer=' + _self.options.ushahidiID + '] .filtered')[0];
                                if (node) {
                                    node.innerHTML = html;
                                }
                            }
                            ushahidiLayer.clear();
                            _self.options.ushahidiChecked = true;

                            var updateObj = {
                                category: _self.options.ushahidiCategory
                            };
                            ushahidiLayer.update(updateObj);
                            _self.setSharing();
                        };
                        // insert html
                        _self.options.socialLayers.push(ushahidiLayer);
                        _self.insertSMItem({
                            visible: _self.options.ushahidiChecked,
                            uniqueID: _self.options.ushahidiID,
                            title: _self.options.ushahidiTitle,
                            showSocialSettings: _self.options.showUshahidiConfig,
                            searchTerm: '',
                            legendIcon: _self.options.ushahidiIcon,
                            description: _self.options.ushahidiDescription
                        });

                        _self.ushahidiLayer = ushahidiLayer;
                    }
                    if (!dojo.isMobileDevice) {
                        _self.insertSMToggle();
                        _self.insertSettingsHTML();
                        _self.configureSettingsUI();
                    }
                    // set default visible of the two
                    if (_self.options.socialDisplay === 'heatmap' && _self.utils.isCanvasSupported()) {
                        _self.pointDisplay('heatmap');
                    } else if (_self.options.socialDisplay === 'cluster') {
                        _self.pointDisplay('cluster');
                    } else {
                        _self.pointDisplay('point');
                    }
                    // onclick connect
                    connect.connect(_self.clusterLayer.featureLayer, "onClick", function (evt) {
	                _self.mapnote.showInfoWindow = true;
                        if (evt) {
                            evt.stopPropagation();
                        }
                        if (_self.options.map.infoWindow.isShowing) {
                            _self.options.customPopup.hide();
                        }
                        var arr = [];
                        _self.zoomToAttributes = evt.graphic.geometry;
                        var query = new esri.tasks.Query();
                        query.geometry = evt.graphic.attributes.extent;
                        for (var i = 0; i < _self.options.socialLayers.length; i++) {
                            arr.push(_self.options.socialLayers[i].featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW));
                        }
                        if (evt.graphic.symbol.url === _self.options.clusterImage || evt.graphic.symbol.type === "textsymbol") {

                            var mp = new esri.geometry.Multipoint(_self.options.map.spatialReference);
                            var flag = false;
                            for (var i in arr) {
                                if (!flag) {
                                    for (var j in arr[i].results[0][0]) {
                                        mp.addPoint(arr[i].results[0][0][j].geometry);
                                        if (mp.getExtent().getWidth() !== 0) {
                                            flag = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (flag) {
                                _self.options.map.centerAndZoom(evt.graphic.geometry, _self.options.map.getLevel() + 1);
                                return;
                            }
                        }
                        event.stop(evt);
                        _self.options.customPopup.setFeatures(arr);
                        _self.options.map.centerAt(evt.graphic.geometry);
                        setTimeout(function () { _self.options.customPopup.show(evt.graphic.geometry); }, 500);
                        _self.options.customPopup.resize(_self.options.popupWidth, _self.options.popupHeight);
                        _self.overridePopupTitle();
                        _self.overridePopupHeader();
                    });
                    // zebra stripe layers
                    _self.utils.zebraStripe(query('#socialList li.layer'));
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

	        //List will be created for every mapnote showing title
	        configureMapNotes: function () {
	            var _self = this;
	            var _tabContainer = domConstruct.create("div", { class: "tabContainer" }, "mapNotesContainer", "first");
	            var _headerTitle = domConstruct.create("div", { class: "mapNoteTitle" }, _tabContainer, "first");
	            var _mapNoteListContainer = domConstruct.create("div", { class: "mapNoteListContainer" }, "mapNotesContainer", "last");
	            if (dojo.isMobileDevice) {
	                if (_self.mapNotesLayer.length > 0) {
	                    html.set(_headerTitle, i18n.viewer.buttons.mapnote);
	                    domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.mapNoteTitle);
	                    var _titleGroup = new TitleGroup({});
	                    _mapNoteListContainer.appendChild(_titleGroup.domNode);
	                    array.forEach(_self.mapNotesLayer, function (mapNote, i) {
	                        array.forEach(mapNote.featureCollection.layers, function (mapNoteLayer, j) {
	                            var _mapNoteFeature = mapNoteLayer.layerObject;
	                            array.forEach(mapNoteLayer.featureSet.features, function (item, k) {
	                                var _titlePane = new TitlePane({ title: item.attributes.TITLE, content: item.attributes.DESCRIPTION, open: false });
	                                _titlePane.id = item.attributes.TITLE + item.attributes.OBJECTID;
	                                if (_titlePane.content == undefined) {
	                                    _titlePane.setContent(i18n.viewer.settings.descriptionUnavailable);
	                                }
	                                _self.mapnote.mapNotesList.push(_titlePane);
	                                _titleGroup.domNode.appendChild(_titlePane.domNode);
	                                domClass.add(_titlePane.titleNode, "titleNode");
	                                domClass.add(_titlePane.hideNode, "contentNode");
	                                domClass.add(_titlePane.domNode, "bottomBorder");
	                                domClass.add(_titlePane.containerNode, "descriptionNode");
	                                on(_titlePane.titleBarNode, "click", function () {
	                                    array.forEach(_self.mapnote.mapNotesList, function (list, index) {
	                                        if (list.open) {
	                                            domClass.add(list.titleNode, "listExpand");
	                                            setTimeout(function () {
	                                                if (mapNoteLayer.featureSet.geometryType === "esriGeometryPolygon" || mapNoteLayer.featureSet.geometryType === "esriGeometryPolyline") {
	                                                    var arr = [];
	                                                    arr.push(mapNoteLayer.layerObject.graphics[k]);
	                                                    _self.options.customPopup.setFeatures(arr);
	                                                    _self.options.customPopup.show(mapNoteLayer.layerObject.graphics[k].geometry.getExtent().getCenter());
	                                                    _self.options.map.centerAndZoom(mapNoteLayer.layerObject.graphics[k].geometry.getExtent().getCenter(), _self.options.zoomLevel);
	                                                }
	                                                else {
	                                                var arr = [];
	                                                arr.push(mapNoteLayer.layerObject.graphics[k]);
	                                                _self.options.customPopup.setFeatures(arr);
	                                                _self.options.customPopup.show(item.geometry);
	                                                    _self.options.map.centerAndZoom(item.geometry, _self.options.zoomLevel);
	                                                }
	                                            }, 500);
	                                        }
	                                        else {
	                                            if (domClass.contains(list.titleNode, "listExpand")) {
	                                                _self.mapnote.swapCSS(list.titleNode);
	                                            }
	                                        }
	                                    });
	                                });
	                                _mapNoteFeature.onClick = function (evt) {
	                                    _self.changeSelection();
	                                }
	                            });
	                        });
	                    });
	                } else if (_self.options.itemInfo.itemData.bookmarks) {
	                    html.set(_headerTitle, i18n.viewer.buttons.bookmarks);
	                    domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.bookmarksTitle);
	                    _self.mapnote._createBookmarkList(_self.options.itemInfo.itemData.bookmarks, _mapNoteListContainer)
	                } else {
	                    domConstruct.destroy("mblMapnoteBtn");
	                }
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
                // removes layer from list of visible layers
                removeFromActiveLayers: function (layerid) {
                    var _self = this;
                    var theIndex = _self.getActiveLayerIndex(layerid);
                    for (theIndex; theIndex > -1; theIndex = _self.getActiveLayerIndex(layerid)) {
                        _self.options.layers.splice(theIndex, 1);
                    }
                    _self.setSharing();
                },
                // Build a list of layers for the incoming web map.
                buildLayersList: function (layers) {
                    var _self = this;
                    //layers  arg is  response.itemInfo.itemData.operationalLayers;
                    var layerInfos = [];
                    array.forEach(layers, function (mapLayer, index) {
                        var layerInfo = {};
                        if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
                            if (mapLayer.featureCollection.showLegend === true) {
                                array.forEach(mapLayer.featureCollection.layers, function (fcMapLayer) {
                                    if (fcMapLayer.showLegend !== false) {
                                        layerInfo = {
                                            "layer": fcMapLayer.layerObject,
                                            "title": mapLayer.title,
                                            "defaultSymbol": false
                                        };
                                        if (mapLayer.featureCollection.layers.length > 1) {
                                            layerInfo.title += " - " + fcMapLayer.layerDefinition.name;
                                        }
                                        layerInfos.push(layerInfo);
                                    }
                                });
                            }
                        } else if (mapLayer.showLegend !== false && mapLayer.layerObject) {
                            var showDefaultSymbol = false;
                            if (mapLayer.layerObject.version < 10.1 && (mapLayer.layerObject instanceof esri.layers.ArcGISDynamicMapServiceLayer || mapLayer.layerObject instanceof esri.layers.ArcGISTiledMapServiceLayer)) {
                                showDefaultSymbol = true;
                            }
                            layerInfo = {
                                "layer": mapLayer.layerObject,
                                "title": mapLayer.title,
                                "defaultSymbol": showDefaultSymbol
                            };
                            //does it have layers too? If so check to see if showLegend is false
                            if (mapLayer.layers) {
                                var hideLayers = array.map(array.filter(mapLayer.layers, function (lyr) {
                                    return (lyr.showLegend === false);
                                }), function (lyr) {
                                    return lyr.id;
                                });
                                if (hideLayers.length) {
                                    layerInfo.hideLayers = hideLayers;
                                }
                            }
                            layerInfos.push(layerInfo);
                        }
                    });
                    return layerInfos;
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
                    on(dom.byId("layersList"), ".toggle:click, .toggle:keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.utils.toggleChecked(this);
                            _self.setSharing();
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
                                    toolTip[0].style.display = 'block';
                                    var mapconHeight = dojo.coords(dojo.byId('mapcon')).h - 70;
                                    var lMenuHeight = dojo.coords(dojo.byId('layersMenu')).h;
                                    toolTip[0].style.top = dojo.coords(this).y - 36 + 'px';
                                    var tp = dojo.coords(toolTip[0]);
                                    if ((tp.h + tp.t) >= mapconHeight) {
                                        toolTip[0].style.top = lMenuHeight - tp.h + "px";
                                    }
                                    query(this).addClass('cBinfoAnim');
                                } else {
                                    toolTip[0].style.display = 'none';
                                    query(this).parent('li').removeClass('active');
                                }
                            }
                        }
                    });
                    // Close Menus
                    on(query(".slideMenu"), ".closeMenu:click, .closeMenu:keyup, .closeMenu:touchstart", function (event) {
                        _self.utils.hideAllMenus();
                    });
                    // Close ToolTips
                    on(query(".listMenu"), ".ihClose:click, .ihClose:keyup, .ihClose:touchstart", function (event) {
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
                    setTimeout(function () {
                        var layer = _self.options.map.getLayer(layerid);
                        if (layer) {
                            //if visible hide the layer
                            if (layer.visible === true) {
                                layer.hide();
                                _self.removeFromActiveLayers(layerid);
	                        if (_self.options.map.infoWindow.isShowing) {
	                            _self.options.map.infoWindow.hide();
	                        }
                            }
                            //otherwise show and add to layers
                            else {
                                layer.show();
                                _self.addToActiveLayers(layerid);
                            }
                        }
                    }, 100);
                },
                toggleMapLayerSM: function (layerid, newState) {
                    var _self = this;
                    clearTimeout(_self.options.autoRefreshTimer);
                    var layer = _self.utils.getSocialLayer(layerid);

                    if (dojo.isMobileDevice) {
                        if (newState === "off") {
                            layer.clear();
                        } else {
                            layer.newQuery(true);
                        }
                    } else {
                        var layerList = query('#socialMenu li[data-layer="' + layerid + '"]');
                        if (domClass.contains(layerList[0], 'checked')) {
                            layer.newQuery(true);
                        } else {
                            query('#' + layerid + '_load').style('display', 'none');
                            layer.clear();
                        }
                    }
                    _self.setSharing();
                },
                addLayerToUI: function (layerToAdd, index) {
                    var _self = this;
                    // each layer
                    var layerClass;
                    // URL layers variable
                    var urlLayers = false;
                    var params = _self.utils.getUrlObject();
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
                                        _self.options.map.getLayer(layerToAdd.featureCollection.layers[k].id).hide();
                                        // for each visible layer array item
                                        for (key in _self.options.layers) {
                                            // if current layer ID matches visible layer item
                                            if (_self.options.layers[key] === layerToAdd.featureCollection.layers[k].id) {
                                                // set visibility to true
                                                layerToAdd.featureCollection.layers[k].visibility = true;
                                                _self.options.map.getLayer(layerToAdd.featureCollection.layers[k].id).show();
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
                                    _self.options.map.getLayer(layerToAdd.id).hide();
                                    layerToAdd.visibility = false;
                                    // for each visible layer array item
                                    for (key in _self.options.layers) {
                                        // if current layer ID matches visible layer item
                                        if (_self.options.layers[key] === layerToAdd.id) {
                                            // set visibility to true
                                            layerToAdd.visibility = true;
                                            _self.options.map.getLayer(layerToAdd.id).show();
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
                                _self.options.map.getLayer(layerToAdd.id).hide();
                                // for each visible layer array item
                                for (key in _self.options.layers) {
                                    // if current layer ID matches visible layer item
                                    if (_self.options.layers[key] === layerToAdd.id) {
                                        // set visibility to true
                                        layerToAdd.visibility = true;
                                        _self.options.map.getLayer(layerToAdd.id).show();
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
                        if (!dojo.isMobileDevice) {
                            html += '<li class="' + layerClass + '" data-layer="' + dataLayers + '">';
                            html += '<div class="cover"></div>';
                            html += '<span tabindex="0" class="cBinfo" title="' + i18n.viewer.layer.information + '"></span>';
                            html += '<span tabindex="0" class="toggle cBox"></span>';
                            html += '<span tabindex="0" class="toggle cBtitle" title="' + layerToAdd.title + '">' + layerToAdd.title.replace(/[\-_]/g, " ") + '</span>';
                            html += '<div class="clear"></div>';
                            html += '<div class="infoHidden">';
                            html += '<div title="' + i18n.viewer.general.close + '" class="ihClose"></div>';
                            if (layerToAdd.resourceInfo) {
                                if (layerToAdd.resourceInfo.serviceDescription || layerToAdd.resourceInfo.description) {
                                    html += '<div class="infoHiddenScroll">';
                                    if (layerToAdd.resourceInfo.serviceDescription) {
                                        html += unescape(layerToAdd.resourceInfo.serviceDescription);
                                    }
                                    if (layerToAdd.resourceInfo.description) {
                                        html += unescape(layerToAdd.resourceInfo.description);
                                    }
                                    html += '</div>';
                                }
                                else {
                                    html += '<div>' + i18n.viewer.errors.nodesc + '</div>';
                                }
                            } else {
                                html += '<div>' + i18n.viewer.errors.nodesc + '</div>';
                            }
                            html += '<div class="transSlider"><span class="transLabel">' + i18n.viewer.layer.transparency + '</span><span id="layerSlider' + index + '" data-layer-id="' + dataLayers + '" class="uiSlider slider"></span></div>';
                            html += '</div>';
                        }

                    }
                    if (!dojo.isMobileDevice) {
                        html += '</li>';
                        // append html
                        node = dom.byId('layersList');
                        if (node) {
                            domConstruct.place(html, node, "first");
                        }
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
                                _self.utils.transparencyChange(value, theLayer.dataLayers);
                            }
                        }, "layerSlider" + index);
                    }
                },
                // create layer items
                configureLayers: function () {
                    var _self = this;
                    // if operational layers
                    if (_self.options.itemInfo.itemData.operationalLayers) {
                        // if operational layers of at least 1
                        if (_self.options.itemInfo.itemData.operationalLayers.length > 0) {
                            if (!_self.options.layerInfos) {
                                _self.options.layerInfos = [];
                            }
                            // build layers
                            _self.options.layerInfos = _self.options.layerInfos.concat(_self.buildLayersList(_self.options.itemInfo.itemData.operationalLayers));
                            if (!dojo.isMobileDevice) {
                                var node;
                                if (_self.options.showLegendMenu) {
                                    node = dom.byId('legendMenu');
                                    if (node) {
                                        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.legend.menuTitle + '<div class="clear"></div></div><div class="legendMenuCon"><div class="slideScroll"><div id="legendContent"></div></div></div>';
                                    }
                                    // Build Legend
                                    if (_self.options.layerInfos && _self.options.layerInfos.length > 0) {
                                        _self.options.legendDijit = new esri.dijit.Legend({
                                            map: _self.options.map,
                                            layerInfos: _self.options.layerInfos
                                        }, "legendContent");
                                        _self.options.legendDijit.autoUpdate = true;
                                        _self.options.legendDijit.startup();
                                        for (var i in _self.options.legendDijit.layers) {
                                            connect.connect(_self.options.legendDijit.layers[i], "onVisibilityChange", function (visibility) {
                                                _self.options.legendDijit.refresh();
                                                setTimeout(dojo.hitch(this, function () {
                                                    for (var i in _self.legendFilter) {
                                                        var legendcontainer = dojo.byId('legendcontent_' + i);
                                                        if (legendcontainer) {
                                                            dojo.query(".esrilegendlayer", dojo.byId('legendcontent_' + i)).foreach(function (node) {
                                                                for (var j = _self.legendFilter[i].length - 1; j >= 0; j--) {
                                                                    node.deleterow(_self.legendFilter[i][j]);
                                                                }
                                                            });
                                                        }
                                                    }
                                                }), 1000);
                                            });
                                            if (_self.options.legendDijit.layers[i].type) {
                                                if (_self.options.legendDijit.layers[i].getDefinitionExpression()) {
                                                    var expression = _self.options.legendDijit.layers[i].getDefinitionExpression();
                                                    if (expression.indexOf(_self.options.legendDijit.layers[i].renderer.attributeField) >= 0) {
                                                        switch (_self.options.legendDijit.layers[i].renderer.declaredClass) {
                                                            case "esri.renderer.UniqueValueRenderer":
                                                                _self.filterUniqueValueRenders(_self.options.legendDijit.layers[i], _self.legendFilter);
                                                                break;
                                                            case "esri.renderer.ClassBreaksRenderer":
                                                                _self.filterClassBreakRenders(_self.options.legendDijit.layers[i], _self.legendFilter);
                                                                break;
                                                            case "esri.renderer.SimpleRenderer":
                                                                break;
                                                            default:
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        var legendContentNode = dom.byId('legendContent');
                                        if (legendContentNode) {
                                            legendContentNode.innerHTML = i18n.viewer.errors.noLegend;
                                        }
                                    }
                                }
                                // for each layer
                                for (var i = 0; i < _self.options.itemInfo.itemData.operationalLayers.length; i++) {
                                    _self.addLayerToUI(_self.options.itemInfo.itemData.operationalLayers[i], i);
                                    _self.addLayerTransparencySlider(_self.options.itemInfo.itemData.operationalLayers[i], i);
                                }
                                _self.utils.zebraStripe(query('#layersList li.layer'));
                            } else {
                                var div = dojo.create("div", {
                                    "id": "legendContent"
                                }, dojo.body());
                                if (_self.options.layerInfos && _self.options.layerInfos.length > 0) {

                                    _self.options.legendDijit = new esri.dijit.Legend({
                                        map: _self.options.map,
                                        layerInfos: _self.options.layerInfos
                                    }, "legendContent");
                                    _self.options.legendDijit.startup();

                                    for (var i in _self.options.legendDijit.layers) {
                                        connect.connect(_self.options.legendDijit.layers[i], "onVisibilityChange", function (visibility) {
                                            setTimeout(dojo.hitch(this, function () {
                                                for (var i in _self.legendFilter) {
                                                    var legendContainer = dojo.byId('legendContent_' + i);
                                                    if (legendContainer) {
                                                        dojo.query(".esriLegendLayer", dojo.byId('legendContent_' + i)).forEach(function (node) {
                                                            for (var j = _self.legendFilter[i].length - 1; j >= 0; j--) {
                                                                node.deleteRow(_self.legendFilter[i][j]);
                                                            }
                                                        });
                                                    }
                                                }
                                            }), 1000);
                                        });
                                        if (_self.options.legendDijit.layers[i].type) {
                                            if (_self.options.legendDijit.layers[i].getDefinitionExpression()) {
                                                var expression = _self.options.legendDijit.layers[i].getDefinitionExpression();
                                                if (expression.indexOf(_self.options.legendDijit.layers[i].renderer.attributeField) >= 0) {
                                                    switch (_self.options.legendDijit.layers[i].renderer.declaredClass) {
                                                        case "esri.renderer.UniqueValueRenderer":
                                                            _self.filterUniqueValueRenders(_self.options.legendDijit.layers[i], _self.legendFilter);
                                                            break;
                                                        case "esri.renderer.ClassBreaksRenderer":
                                                            _self.filterClassBreakRenders(_self.options.legendDijit.layers[i], _self.legendFilter);
                                                            break;
                                                        case "esri.renderer.SimpleRenderer":
                                                            break;
                                                        default:
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    dijit.byId("legendContentPane").addChild(_self.options.legendDijit);
                                }
                            }
                        } else {
                            _self.options.showLayersMenu = false;
                            _self.options.showLegendMenu = false;

	                    node = dom.byId('legendMenu');
	                    if (node) {
	                        node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.legend.menuTitle + '<div class="clear"></div></div><div class="legendMenuCon"><div class="slideScroll"><div id="legendContent"></div></div></div>';
	                    }
	                    if (dojo.isMobileDevice) {
	                        var legendContentNode = dom.byId('legendContentPane');
	                    } else {
	                    var legendContentNode = dom.byId('legendContent');
	                    }
	                    if (legendContentNode) {
	                        legendContentNode.innerHTML = i18n.viewer.errors.noLegend;
	                    }
                        }
                        if (!dojo.isMobileDevice) {
                            _self.options.scaleBar = new esri.dijit.Scalebar({
                                map: _self.options.map,
                                attachTo: "bottom-left",
                                scalebarUnit: i18n.viewer.main.scaleBarUnits
                            });
                            _self.configureLayerUI();
                        }
                    }
                },

                // create places item
                createPlacesListItem: function (i, listContainer) {
                    var _self = this;
                    if (dojo.isMobileDevice) {
                        for (var list = 0; list < i; list++) {
                            var item1 = new dojox.mobile.ListItem({
                                label: _self.options.itemInfo.itemData.bookmarks[list].name,
                                id: "list" + list,
                                tabIndex: '' + list,
                                moveTo: "mapcon",
                                class: "list"
                            });
                            dijit.byId("RoundRectList").addChild(item1);
                            dojo.connect(item1, "onClick", function (evt) {
                                var newExtent1 = new Extent(_self.options.itemInfo.itemData.bookmarks[this.tabIndex].extent);
                                _self.options.map.setExtent(newExtent1);
                                dojo.byId('divCont').style.display = "block";
                                dijit.byId("mapcon").show();
                                dijit.byId("mapTab").set('selected', true);
                                dijit.byId("mapcon").resize();
                            });
                        }

                    } else {
                        // default vars //
                        var html = '';
                        // list html
                        html += '<li data-index="' + i + '" class="layer sharedItem placesClick">';
                        html += _self.options.itemInfo.itemData.bookmarks[i].name.replace(/[\-_]/g, " ");
                        html += '</li>';
                        // insert list item
                        var node = dom.byId('placesList');
                        if (node) {
                            domConstruct.place(html, node, "last");
                        }
                    }
                },
                // zoom to location: zooms map to location point
                zoomToLocation: function (x, y, IPAccuracy) {
                    var _self = this;
                    var lod = 16;
                    // set point
                    var pt = webMercatorUtils.geographicToWebMercator(new esri.geometry.Point(x, y));
                    // zoom and center
                    _self.options.map.setScale(36112);
                    _self.options.map.centerAt(pt);
                    _self.setMarker(pt);
                },
                // geolocation error
                geoLocateMapError: function (error) {

                    switch (error.code) {
                        case error.TIMEOUT:
                            this.alertDialog(i18n.viewer.errors.geoLocationTimeOut);
                            break;
                        case error.PERMISSION_DENIED:
                            this.alertDialog(i18n.viewer.errors.permissionDenied);
                            break;
                        case error.POSITION_UNAVAILABLE:
                            this.alertDialog(i18n.viewer.errors.positionUnavailable);
                            break;
                        case error.UNKNOWN_ERROR:
                            this.alertDialog(i18n.viewer.errors.unknownError);
                            break;
                    }
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
                    on(dom.byId("placesList"), ".placesClick:click, .placesClick:keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            objIndex = query(this).attr('data-index');
                            if (objIndex !== -1) {
                                // create extent
                                var newExtent = new Extent(_self.options.itemInfo.itemData.bookmarks[objIndex].extent);
                                // set extent
                                _self.options.map.setExtent(newExtent);
                                _self.utils.hideAllMenus();
                            }
                        }
                    });
                    // places click
                    on(dom.byId("placesButton"), "click, keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.toggleMenus('places');
                        }
                    });
                },
                // configure places
                configurePlaces: function () {
                    var _self = this;
                    // if places

                    if (_self.options.showPlaces) {
                        if (dojo.isMobileDevice) {
                            var bookmarkView = new dojox.mobile.View(null, "bookmarkView");
                            var headingBookmark = new dojox.mobile.Heading({
                                label: i18n.viewer.buttons.bookmarks,
                                back: 'Back',
                                moveTo: 'mapcon',
                                transition: 'none'
                            });
                            bookmarkView.addChild(headingBookmark);

                            dojo.connect(headingBookmark.backButton, "onClick", function (evt) {
                                setTimeout(function () {
                                    dojo.byId('divCont').style.display = "block";
                                }, 300);
                            });
                            dojo.connect(bookmarkView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                                dijit.byId("bookmarkView").resize();
                            });

                            bookmarkView.startup();
                            var bookmarkScrollView = new dojox.mobile.ScrollableView({ class: "mobileScrollViews" });
                            bookmarkView.addChild(bookmarkScrollView);
                            bookmarkScrollView.startup();
                            var roundRecList = new dojox.mobile.RoundRectList({ id: "RoundRectList" });
                            var alertList = new dojox.mobile.ListItem({
                                label: i18n.viewer.buttons.home,
                                moveTo: "mapcon"
                            });
                            alertList.onClick = function () {
                                _self.options.map.setExtent(_self.options.startExtent);
                                dojo.byId('divCont').style.display = "block";
                                dijit.byId("mapcon").show();
                                dijit.byId("mapcon").resize();
                                dijit.byId("mapTab").set('selected', true);
                            };
                            roundRecList.addChild(alertList);
                            bookmarkScrollView.addChild(roundRecList);
                            if (_self.options.itemInfo.itemData.bookmarks && _self.options.itemInfo.itemData.bookmarks.length > 0) {
                                _self.createPlacesListItem(_self.options.itemInfo.itemData.bookmarks.length, bookmarkView);
                            }

                        } else {
                            if (_self.options.itemInfo.itemData.bookmarks && _self.options.itemInfo.itemData.bookmarks.length > 0) {
                                // create list
                                node = dom.byId('placesMenu');
                                if (node) {
                                    node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.places.menuTitle + '<div class="clear"></div></div><div class="scrollCont"><ul class="zebraStripes" id="placesList"></ul></div>';
                                }
                                // if share object
                                for (i = 0; i < _self.options.itemInfo.itemData.bookmarks.length; i++) {
                                    _self.createPlacesListItem(i);
                                }
                                // set on clicks
                                _self.placesOnClick();
                                _self.utils.zebraStripe(query('#placesList li.layer'));
                            } else {
                                _self.options.showPlaces = false;
                            }
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
                    _self.zoomToAttributes = point;
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
                            _self.options.map.addLayer(_self.options.locateLayer);
                        }
                        // graphic
                        locationGraphic.setAttributes({
                            "address": address
                        });
                        _self.options.locateLayer.add(locationGraphic);
                        var content = "<strong>" + address + "</strong>";
                        _self.options.customPopup.setContent(content);
                        _self.options.customPopup.setTitle(i18n.viewer.search.location);
                        _self.overridePopupTitle();
                        if (query('#inFlag')[0]) {
                            query('#inFlag')[0].style.display = "none";
                        }
                        query('.arrow').removeClass('hidden');
                    }
                },
                // resize map
                resizeMap: function () {
                    var _self = this;
                    if (_self.options.mapTimer) {
                        //clear any existing resize timer
                        clearTimeout(_self.options.mapTimer);
                    }
                    //create new resize timer with delay of 500 milliseconds
                    _self.options.mapTimer = setTimeout(function () {
                        if (_self.options.map) {
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
                            var windowWidth = vs.w;
                            var node = dom.byId('map');
                            if (node) {
                                domStyle.set(node, {
                                    "height": windowHeight - barHeight - chartHeight + 'px'
                                });
                            }
                            // resize
                            _self.options.map.resize();
                            _self.options.map.reposition();
                        }
                    }, 500);
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
                shareLink: function (fullLink) {
                    var _self = this;
                    var tinyResponse;
                    if(_self.options.TinyURLServiceURL && _self.options.TinyURLResponseAttribute){
                        var url = dojo.string.substitute(_self.options.TinyURLServiceURL, [fullLink]);
                        dojo.io.script.get({
                            url: url,
                            callbackParamName: "callback",
                            load: function (data) {
                                tinyResponse = data;
                                _self.tinyUrl = data;
                                var attr = _self.options.TinyURLResponseAttribute.split(".");
                                for (var x = 0; x < attr.length; x++) {
                                    _self.tinyUrl = _self.tinyUrl[attr[x]];
                                }
                            },
                            error: function (error) {
                                alert(error);
                            }
                        });
                    }
                    else{
                        _self.tinyUrl = fullLink;
                    }
                },
                //mail link
                setMailLink: function (mLink) {
                    var _self = this;
                    if (mLink) {
                        var fullLink;
                        var w = 650;
                        var h = 400;
                        var left = (screen.width / 2) - (w / 2);
                        var top = (screen.height / 2) - (h / 2);
                        fullLink = 'mailto:%20?subject=Check%20out%20this%20map!&body=' + mLink;
                        parent.location = fullLink;
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
                        fullLink = 'http://mobile.twitter.com/compose/tweet?status=' + shLink;
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
                        fullLink = 'http://www.facebook.com/sharer.php?u=' + fbLink;
                        window.open(fullLink, 'share', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, true);
                    }
                },
                createBottomMenu: function () {
                    var _self = this;
                    var uList = new dojox.mobile.TabBar(null, "uList");
                    var listItem1 = new dojox.mobile.TabBarButton({
                        icon1: "./images/ui/map.png",
                        icon2: "./images/ui/mapSelected.png",
                        label: i18n.viewer.buttons.map,
                        selected: true,
                        id: 'mapTab'
                    });
                    uList.addChild(listItem1);
                    dojo.connect(listItem1, "onClick", function () {
                        dojo.byId('divCont').style.display = "block";
                        dijit.byId("mapcon").show();
                        dijit.byId("mapcon").resize();
                    });

                    if (_self.options.showLayersMenu || _self.options.showSocialMenu || _self.options.showBasemapMenu) {
                        var listItem2 = new dojox.mobile.TabBarButton({
                            icon1: "./images/ui/layers.png",
                            icon2: "./images/ui/layerSelected.png",
                            label: i18n.viewer.buttons.layers,
                            moveTo: "layersView",
                            transition: "none"
                        });
                        uList.addChild(listItem2);
                    }
                    if (_self.options.showLegendMenu) {
                        var listItem3 = new dojox.mobile.TabBarButton({
                            icon1: "./images/ui/legend.png",
                            icon2: "./images/ui/legendSelected.png",
                            label: i18n.viewer.buttons.legend,
                            moveTo: "legendView",
                            transition: "none"
                        });
                        uList.addChild(listItem3);
                    }
                    if (_self.options.showAboutDialog) {
                        var listItem4 = new dojox.mobile.TabBarButton({
                            icon1: "./images/ui/about.png",
                            icon2: "./images/ui/aboutSelected.png",
                            label: i18n.viewer.buttons.about,
                            id: "aboutTab",
                            moveTo: "aboutView",
                            transition: "none"
                        });
                        uList.addChild(listItem4);

                    }
                    if (_self.options.showShareMenu) {
                        var listItem5 = new dojox.mobile.TabBarButton({
                            icon1: "./images/ui/shareS.png",
                            icon2: "./images/ui/shareSelected.png",
                            label: i18n.viewer.buttons.share
                        });
                        dojo.connect(listItem5, "onClick", function () {
                            dojo.byId('divCont').style.display = "none";
                            dijit.byId("shareView").show();
                            dijit.byId("shareView").resize();
                            _self.shareLink(encodeURIComponent(_self.options.shareURL));
                        });
                        uList.addChild(listItem5);
                        _self.createShareMenu();
                    }
                    uList.startup();
                    dojo.connect(dijit.byId("mapcon"), "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                        dijit.byId("mapcon").resize();
                        dijit.byId("mapTab").set('selected', true);
                    });
                },
                createLayersMenu: function () {

                    var _self = this;
                    var layersView = new dojox.mobile.View(null, "layersView");
                    var heading1 = new dojox.mobile.Heading({
                        label: i18n.viewer.buttons.layers,
                        back: 'Back',
                        moveTo: 'mapcon',
                        transition: "none"
                    });
                    layersView.addChild(heading1);
                    dojo.connect(heading1.backButton, "onClick", function (evt) {
                        event.stop(evt);
                        setTimeout(function () {
                            dojo.byId('divCont').style.display = "block";
                        }, 300);
                        dijit.byId("mapTab").set('selected', true);
                    });
                    var tabBar = new dojox.mobile.TabBar({
                        id: "tabList",
                        barType: "segmentedControl",
                        centre: true
                    });
                    //create basemap view
                    if (_self.options.showBasemapMenu) {
                        var tabBarBtn1 = new dojox.mobile.TabBarButton({
                            label: i18n.viewer.buttons.basemap,
                            id: 'basemapTab'
                        });
                        tabBar.addChild(tabBarBtn1);
                        dojo.connect(tabBarBtn1, "onClick", function () {
                            dijit.byId("basemapView").show();
                            dijit.byId("basemapView").resize();
                        });
                        var basemapView = new dojox.mobile.View({
                            align: "center",
                            id: "basemapView"
                        });
                        layersView.addChild(basemapView);
                        var basemapContent = new dojox.mobile.ContentPane({
                            center: true,
                            id: "basemapContent"
                        });

                        basemapView.startup();
                        basemapView.addChild(basemapContent);

                        dojo.connect(basemapView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                            dijit.byId("basemapView").resize();
                        });
                    }
                    //create operational layers view
                    if (_self.options.showLayersMenu) {
                        var tabBarBtn2 = new dojox.mobile.TabBarButton({
                            label: i18n.viewer.buttons.layers,
                            id: 'oplayerTab'
                        });
                        tabBar.addChild(tabBarBtn2);

                        dojo.connect(tabBarBtn2, "onClick", function () {
                            dijit.byId("operationalView").show();
                            dijit.byId("operationalView").resize();
                        });
                        var operationalView = new dojox.mobile.ScrollableView({
                            id: "operationalView"
                        });
                        layersView.addChild(operationalView);
                        var categ1 = new dojox.mobile.RoundRectCategory({
                            label: i18n.viewer.layers.menuTitle
                        });
                        operationalView.addChild(categ1);
                        var list1 = new dojox.mobile.RoundRectList();
                        for (var i = _self.options.itemInfo.itemData.operationalLayers.length - 1; i >= 0; i--) {
                            var itemList = new dojox.mobile.ListItem({
                                label: _self.options.itemInfo.itemData.operationalLayers[i].title,
                                moveTo: "layerView" + i
                            });
                            list1.addChild(itemList);
                        }
                        operationalView.addChild(list1);
                        operationalView.startup();
                        dojo.connect(operationalView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                            dijit.byId("operationalView").resize();
                        });
                    }
                    //create social layers view
                    if (_self.options.showSocialMenu) {
                        var tabBarBtn3 = new dojox.mobile.TabBarButton({
                            label: i18n.viewer.buttons.social,
                            id: 'socialTab'
                        });
                        tabBar.addChild(tabBarBtn3);
                        dojo.connect(tabBarBtn3, "onClick", function () {
                            dijit.byId("socialView").show();
                            dijit.byId("socialView").resize();
                        });
                        var socialView = new dojox.mobile.ScrollableView({
                            id: "socialView"
                        });
                        layersView.addChild(socialView);
                        var categSocial = new dojox.mobile.RoundRectCategory({
                            label: i18n.viewer.social.menuTitle
                        });
                        socialView.addChild(categSocial);

                        var listSocial = new dojox.mobile.RoundRectList({
                            id: "listSocial"
                        });
                        socialView.addChild(listSocial);
                        if (_self.options.showDisplaySwitch) {
                            var contentList = new dojox.mobile.TabBar({
                                id: "contentList",
                                barType: "segmentedControl"
                            });
                            var listItemCluster = new dojox.mobile.TabBarButton({
                                id: "cluster",
                                label: i18n.viewer.buttons.cluster,
                                icon: _self.options.clusterImage
                            });
                            contentList.addChild(listItemCluster);
                            if (_self.utils.isCanvasSupported()) {
                                var listItemDensity = new dojox.mobile.TabBarButton({
                                    id: "heatmap",
                                    label: i18n.viewer.buttons.heatmap,
                                    icon: "./images/ui/density.png"
                                });
                                contentList.addChild(listItemDensity);
                            }
                            var listItemPoint = new dojox.mobile.TabBarButton({
                                id: "point",
                                label: i18n.viewer.buttons.point,
                                icon: "./images/ui/location.png"
                            });
                            contentList.addChild(listItemPoint);
                            socialView.addChild(contentList);
                            contentList.startup();
                            dojo.connect(listItemCluster, "onClick", function (evt) {
                                _self.toggleDisplayAs(this);
                            });
                            dojo.connect(listItemDensity, "onClick", function (evt) {
                                _self.toggleDisplayAs(this);
                            });
                            dojo.connect(listItemPoint, "onClick", function (evt) {
                                _self.toggleDisplayAs(this);
                            });
                        }
                        socialView.startup();
                        dojo.connect(socialView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                            dijit.byId("socialView").resize();
                        });
                    }
                    tabBar.startup();
                    layersView.addChild(tabBar);

                    for (var i = _self.options.itemInfo.itemData.operationalLayers.length - 1; i >= 0; i--) {
                        var layerDiv = dojo.create("div", {
                            "id": "layerView" + i,
                            "class": "mobileViews"
                        }, dojo.body());

                        var layer1v = new dojox.mobile.View(null, "layerView" + i);
	                if (_self.options.itemInfo.itemData.operationalLayers[i].title.length > 25) {
	                    var _layerTitle = _self.options.itemInfo.itemData.operationalLayers[i].title.slice(0, 22).concat("...");
	                }
                        var headingLayer = new dojox.mobile.Heading({
	                    label: _layerTitle,
                            back: "Back",
                            moveTo: "layersView"
                        });

                        layer1v.addChild(headingLayer);
                        layer1v.startup();
                        dojo.connect(dijit.byId("layerView" + i), "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                            this.resize();
                        });
                        var layerScrollV = new dojox.mobile.View({
                            id: "scrollV" + i,
                            class: "mobileScrollViews"
                        });
                        layer1v.addChild(layerScrollV);
                        var content1 = new dojox.mobile.RoundRectList({
                            label: ""
                        });
                        var listItem = new dojox.mobile.ListItem({
                            label: i18n.viewer.buttons.layerVisible
                        });

                        var switchBtn = new Switch({
                            id: "sw" + i,
                            class: "mblSwSquareShape"
                        });
                        listItem.addChild(switchBtn);
                        if (_self.options.itemInfo.itemData.operationalLayers[i].visibility === true) {
                            switchBtn.set('value', 'on');
                        } else {
                            switchBtn.set('value', 'off');
                        }
                        content1.addChild(listItem);
                        layerScrollV.addChild(content1);

                        if (_self.options.itemInfo.itemData.operationalLayers[i].resourceInfo) {
                            var content2 = new dojox.mobile.ContentPane({
                                content: _self.options.itemInfo.itemData.operationalLayers[i].resourceInfo.description,
                                class: "scrollContentPane"
                            });
                            layerScrollV.addChild(content2);
                        }
                        layerScrollV.startup();
                        dojo.connect(layerScrollV, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                            dijit.byId("layerScrollV").resize();
                        });
                        dojo.connect(dijit.byId("sw" + i), "onStateChanged", function (newState) {
                            var index = (this.id).replace("sw", "");
                            var obj = _self.options.itemInfo.itemData.operationalLayers[index];
                            if(obj.featureCollection && obj.featureCollection.layers){
                                var layers = obj.featureCollection.layers;
                                for(var i = 0; i < layers.length; i++){
                                    var id = layers[i].id;
                                    _self.toggleMapLayer(id);
                                }
                            }
                            else{
                                _self.toggleMapLayer(_self.options.itemInfo.itemData.operationalLayers[index].id);
                            }
                            _self.setSharing();
                        });

                    }
                    layersView.startup();
                    dojo.connect(layersView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                        dojo.byId("divCont").style.display = "none";
                        dijit.byId("layersView").resize();
                    });
                    if (dijit.byId("operationalView")) {
                        dijit.byId("oplayerTab").set('selected', true);
                        dijit.byId("operationalView").show();
                    }
                    else if (dijit.byId("basemapView")) {
                        dijit.byId("basemapTab").set('selected', true);
                        dijit.byId("basemapView").show();
                    }
                    else if (dijit.byId("socialView")) {
                        dijit.byId("socialTab").set('selected', true);
                        dijit.byId("socialView").show();
                    }

                },
                createLegendMenu: function () {
                    var _self = this;
                    var divLegend = dojo.create("div", {
                        "id": "legendView",
                        "align": "center"
                    }, dojo.body());
                    var legendView = new dojox.mobile.View(null, "legendView");

                    var legendHeading = new dojox.mobile.Heading({
                        label: i18n.viewer.legend.menuTitle,
                        back: 'Back',
                        moveTo: 'mapcon',
                        transition: "none"
                    });
                    legendView.addChild(legendHeading);
                    dojo.connect(legendHeading.backButton, "onClick", function (evt) {
                        event.stop(evt);
                        setTimeout(function () {
                            dojo.byId('divCont').style.display = "block";
                        }, 300);
                    });
                    legendView.startup();
                    var legendScroll = new dojox.mobile.ScrollableView({
                        id: "legendScroll",
                        align: "center"
                    });
                    legendView.addChild(legendScroll);
                    var legendContent = new dojox.mobile.ContentPane({
                        center: true,
                        id: "legendContentPane"
                    });
                    legendScroll.addChild(legendContent);
                    legendScroll.startup();
                    dojo.connect(legendView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                        dojo.byId('divCont').style.display = "none";
                        dijit.byId("legendView").resize();
                    });
                },

                createAboutMenu: function () {
                    var _self = this;
                    var aboutDiv = dojo.create("div", {
                        "id": "aboutView"
                    }, dojo.body());
                    var aboutView = new dojox.mobile.View(null, "aboutView");
                    var aboutHeading = new dojox.mobile.Heading({
                        label: i18n.viewer.buttons.about
                    });
                    aboutView.addChild(aboutHeading);
                    var aboutScrollView = new dojox.mobile.View({
                        id: "aboutViewScroll"
                    });
                    aboutView.addChild(aboutScrollView);
                    var hashTagInfo = ' ';
                    if (_self.options.showFlickr) {
                        hashTagInfo += _self.options.flickrDescription + '  ' + i18n.viewer.layer.filteredBy + '  ' + '<span class="bold">' + _self.options.flickrSearch + "</span></br></br>";
                    }
                    if (_self.options.showTwitter) {
                        hashTagInfo += _self.options.twitterDescription + '  ' + i18n.viewer.layer.filteredBy + '  ' + '<span class="bold">' + _self.options.twitterSearch + "</span></br></br>";
                    }
                    if (_self.options.showYouTube) {
                        hashTagInfo += _self.options.youtubeDescription + '  ' + i18n.viewer.layer.filteredBy + '  ' + '<span class="bold">' + _self.options.youtubeSearch + "</span></br></br>";
                    }
                    var aboutContent1 = new dojox.mobile.ContentPane({
                        center: true,
                        id: "aboutContentPane1",
                        content: hashTagInfo
                    });
                    aboutScrollView.addChild(aboutContent1);
                    if (_self.options.itemInfo.item.description) {
                        var aboutContent = new dojox.mobile.ContentPane({
                            center: true,
                            id: "aboutContentPane",
                            content: _self.options.itemInfo.item.description
                        });
                        aboutScrollView.addChild(aboutContent);
                    }

                    if (_self.options.itemInfo.item.licenseInfo) {
                        var result = _self.options.itemInfo.item.licenseInfo.replace(/(<([^>]+)>)/ig, "");
                        var licenseInfo = ' ';
                        if (_self.options.itemInfo.item.licenseInfo && result) {
                            licenseInfo += '<h3>' + i18n.viewer.about.access + '</h3>';
                            licenseInfo += '<div class="license">' + _self.options.itemInfo.item.licenseInfo + '</div>';
                        }
                        var aboutLicenseInfo = new dojox.mobile.ContentPane({
                            center: true,
                            id: "aboutLicensePane",
                            content: licenseInfo
                        });
                        aboutScrollView.addChild(aboutLicenseInfo);
                    }
                    aboutScrollView.startup();
                    aboutView.startup();
                    dojo.connect(aboutView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                        dojo.byId('divCont').style.display = "none";
                        dijit.byId("aboutView").resize();
                    });
                    if (_self.options.showAboutDialogOnLoad) {
                        dijit.byId('aboutView').show();
                        dijit.byId('aboutView').resize();
                        dijit.byId("mapTab").set('selected', false);
                        dijit.byId("aboutTab").set('selected', true);
                    }
                },
                createShareMenu: function () {

                    var _self = this;
                    var shareDiv = dojo.create("div", {
                        "id": "shareView"
                    }, dojo.body());
                    var shareView = new dojox.mobile.View(null, "shareView");
                    var shareHeading = new dojox.mobile.Heading({
                        label: i18n.viewer.buttons.share,
                        back: 'Back',
                        moveTo: 'mapcon',
                        transition: 'none'
                    });
                    shareView.addChild(shareHeading);
                    dojo.connect(shareHeading.backButton, "onClick", function (evt) {
                        event.stop(evt);
                        setTimeout(function () {
                            dojo.byId('divCont').style.display = "block";
                        }, 300);
                    });
                    shareView.startup();
                    var shareViewScroll = new dojox.mobile.View({
                        id: "shareViewScroll",
                        class: "scrollView",
                        align: "center"
                    });
                    shareView.addChild(shareViewScroll);
                    var Container = new dojox.mobile.ContentPane({
                        center: true,
                        id: "shareImgGrid"
                    });
                    shareViewScroll.addChild(Container);
                    shareViewScroll.startup();

                    var item = new dojox.mobile.IconMenuItem({
                        id: "fbImg",
                        icon: "./images/ui/facebook.png"

                    });
                    Container.addChild(item);
                    item = new dojox.mobile.IconMenuItem({
                        id: "twImg",
                        icon: "./images/ui/twitter.png"
                    });
                    Container.addChild(item);
                    item = new dojox.mobile.IconMenuItem({
                        id: "mailImg",
                        icon: "./images/ui/mail.png"
                    });
                    Container.addChild(item);
                    var fbImg = dijit.byId("fbImg");
                    if (fbImg) {
                        on(fbImg, "click, keyup", function (event) {
                            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                _self.setFBLink(_self.tinyUrl);
                                return false;
                            }
                        });
                    }
                    var twImg = dijit.byId("twImg");
                    if (twImg) {
                        on(twImg, "click, keyup", function (event) {
                            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                _self.setTWLink(_self.tinyUrl);
                                return false;
                            }
                        });
                    }
                    var mailImg = dijit.byId("mailImg");
                    if (mailImg) {
                        on(mailImg, "click, keyup", function (event) {
                            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                _self.setMailLink(_self.tinyUrl);
                                return false;
                            }
                        });
                    }
                    dojo.connect(shareView, "onBeforeTransitionIn", null, function (moveTo, dir, transition, context, method) {
                        dijit.byId("shareView").resize();
                    });
                },

                // right side menu buttons
                rightSideMenuButtons: function () {

                    var _self = this;
                    var html = '';
                    var node;
                    if (!dojo.isMobileDevice) {
                        if (_self.options.showSearchBox) {
                            html += '<span tabindex="0" id="searchButton" class="barButton" data-menu="search" title="' + i18n.viewer.buttons.locator + '"><img src="./images/ui/searchImage.png"  class="headerIcon"/></span>';
                            node = dom.byId('searchMenu');
                            if (node) {

                                node.innerHTML = '<div class="menuClose">' + i18n.viewer.locator.menuTitle + '<div class="closeButton closeMenu"></div><div class="clear"></div></div><div class="slideScroll"><div id="geocoderSearchTool"></div></div>';
                            }
                        }
                        if (_self.options.showLayersMenu || _self.options.showBasemapMenu || _self.options.showSocialMenu) {
                            html += '<span tabindex="0" id="layersButton" data-menu="layers" class="barButton" title="' + i18n.viewer.buttons.layersTitle + '"><img src="./images/ui/layersImage.png"  class="headerIcon"/></span>';
                        }
                        if (_self.options.showLegendMenu) {
                            html += '<span tabindex="0" id="legendButton" data-menu="legend" class="barButton" title="' + i18n.viewer.buttons.legendTitle + '"><img src="./images/ui/legendImage.png"  class="headerIcon"/></span>';
                        }
                        if (_self.options.itemInfo.item.description && _self.options.showAboutDialog) {
                            html += '<span tabindex="0" id="aboutMap" class="barButton" title="' + i18n.viewer.buttons.aboutTitle + '"><img src="./images/ui/aboutImage.png"  class="headerIcon"/></span>';
                        }
                        if (_self.options.showShareMenu) {
                            html += '<span tabindex="0" id="shareIcon" data-menu="share" class="barButton" title="' + i18n.viewer.buttons.linkTitle + '"><img src="./images/ui/shareImage.png"  class="headerIcon"/></span>';
                        }
                        if (_self.options.showPlaces && _self.options.itemInfo.itemData.bookmarks && _self.options.itemInfo.itemData.bookmarks.length > 0) {
                            html += '<span tabindex="0" id="placesButton" class="barButton" data-menu="places" title="' + i18n.viewer.places.placesTitle + '"><img src="./images/ui/bookmarkImage.png"  class="headerIcon"/></span>';
                        }
                        node = dom.byId('menuList');
                        if (node) {
                            node.innerHTML = html;
                        }
                        var searchButton = dom.byId("searchButton");
                        if (searchButton) {
                            // Social MENU TOGGLE
                            on(searchButton, "click, keyup", function (event) {
                                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                    _self.toggleMenus('search');
                                }
                            });
                        }
                        var legendButton = dom.byId("legendButton");
                        if (legendButton) {
                            on(legendButton, "click, keyup", function (event) {
                                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
	                            if (_self.options.legendDijit) {
                                    _self.options.legendDijit.refresh();
	                            }
                                    _self.toggleMenus('legend');

                                }
                            });
                        }
                        var layersButton = dom.byId("layersButton");
                        if (layersButton) {
                            on(layersButton, "click, keyup", function (event) {
                                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                    _self.toggleMenus('layers');
                                }
                            });

                        }
                        // Show Default Menu
                        var node = dom.byId('layersMenu');
                        if (node) {
                            node.innerHTML = '<div class="menuClose"><div class="closeMenuIcon closeMenu"></div><ul id="layerTabBar"></ul><div class="clear"></div></div><div id="operationalMenu" class="listMenu menuClass"><div class="menuClose">'
                                 + i18n.viewer.layers.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="layersList"></ul></div><div id="socialMenu" class="listMenu menuClass"><div class="menuClose">'
                                 + i18n.viewer.social.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="socialList"></ul></div><div id="basemapDiv" class="listMenu menuClass"><div class="menuClose">'
                                 + i18n.viewer.basemap.menuTitle + '<div class="clear"></div></div><div class="bmMenuCon"><div id="baseContainer"></div></div>';

                            var c = 0;
                            var tabBar = new dojox.mobile.TabBar(null, "layerTabBar");
                            if (_self.options.showBasemapMenu) {
                                var listItem1 = new dojox.mobile.TabBarButton({
                                    label: i18n.viewer.buttons.basemap,
                                    id: 'basemapButton'
                                });
                                c = c + 1;
                                tabBar.addChild(listItem1);
                            }
                            if (_self.options.showLayersMenu) {
                                var listItem2 = new dojox.mobile.TabBarButton({
                                    label: i18n.viewer.buttons.layers,
                                    id: 'opLayersButton'
                                });
                                c = c + 1;
                                tabBar.addChild(listItem2);
                            }
                            if (_self.options.showSocialMenu) {
                                var listItem3 = new dojox.mobile.TabBarButton({
                                    label: i18n.viewer.buttons.social,
                                    id: 'socialButton'
                                });
                                c = c + 1;
                                tabBar.addChild(listItem3);
                            }
                            tabBar.startup();
                            var widthTabBarBtn = (dojo.isBrowser) ? 89 : 92;
                            var width = widthTabBarBtn * c + c + "px";
                            dojo.byId("layerTabBar").style.width = width;

                            if (dijit.byId("opLayersButton")) {
                                query(".menuClass").style('display', 'none');
                                dojo.byId('operationalMenu').style.display = "block";
                                dijit.byId("opLayersButton").set('selected', true);
                            }
                            else if (dijit.byId("basemapButton")) {
                                query(".menuClass").style('display', 'none');
                                dojo.byId('basemapDiv').style.display = "block";
                                dijit.byId("basemapButton").set('selected', true);
                            }
                            else if (dijit.byId("socialButton")) {
                                query(".menuClass").style('display', 'none');
                                dojo.byId('socialMenu').style.display = "block";
                                dijit.byId("socialButton").set('selected', true);
                            }
                            var basemapButton = dom.byId("basemapButton");
                            if (basemapButton) {
                                on(basemapButton, "click", function (event) {
                                    query(".menuClass").style('display', 'none');
                                    dojo.byId('basemapDiv').style.display = "block";
                                    dijit.byId("basemapButton").set('selected', true);
                                    _self.hideLayerInfo();
                                });
                            }
                            // Layers MENU TOGGLE
                            var opLayersButton = dijit.byId("opLayersButton");
                            if (opLayersButton) {
                                on(opLayersButton, "click", function (event) {
                                    query(".menuClass").style('display', 'none');
                                    dojo.byId('operationalMenu').style.display = "block";
                                    _self.hideLayerInfo();
                                });
                            }
                            var socialButton = dijit.byId("socialButton");
                            // Social MENU TOGGLE
                            if (socialButton) {
                                on(socialButton, "click", function (event) {
                                    query(".menuClass").style('display', 'none');
                                    dojo.byId('socialMenu').style.display = "block";
                                    _self.hideLayerInfo();
                                });
                            }
                        }
                        if (_self.options.defaultMenu) {
                            switch (_self.options.defaultMenu) {
                                case 'places':
                                    if (_self.options.showPlaces) {
                                        _self.toggleMenus(_self.options.defaultMenu);
                                    }
                                    break;
                                case 'basemap':
                                    if (_self.options.showBasemapMenu) {
                                        query(".menuClass").style('display', 'none');
                                        dojo.byId('basemapDiv').style.display = "block";
                                        dijit.byId("basemapButton").set('selected', true);
                                    }
                                    break;
                                case 'layers':
                                    if (_self.options.showLayersMenu) {
                                        query(".menuClass").style('display', 'none');
                                        dojo.byId('operationalMenu').style.display = "block";
                                        dijit.byId("opLayersButton").set('selected', true);
                                    }
                                    break;
                                case 'social':
                                    if (_self.options.showSocialMenu) {
                                        query(".menuClass").style('display', 'none');
                                        dojo.byId('socialMenu').style.display = "block";
                                        dijit.byId("socialButton").set('selected', true);
                                    }
                                    break;
                                case 'legend':
                                    if (_self.options.showLegendMenu) {
                                        _self.toggleMenus(_self.options.defaultMenu);
                                    }
                                    break;
                            }
                        }
                    }
                },

                // set up share menu
                configureShareMenu: function () {
                    var _self = this;
                    if (_self.options.showShareMenu) {
                        var html = '';
                        html += '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.shareMenu.menuTitle + '<div class="clear"></div></div>';
                        html += '<div class="shareContainer">';
                        html += '<div class="Pad">';
                        html += '<h3>' + i18n.viewer.shareMenu.shareHeader + '</h3><div class="tinyUrlBtn">' + i18n.viewer.buttons.tinyUrl + '</div>';
                        html += '<input tabindex="0" id="inputShare" value="" type="text" class="mapInput inputSingle" size="20" readonly/>';
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

                        var quickEmbedCode = dom.byId("quickEmbedCode");
                        if (quickEmbedCode) {
                            on(quickEmbedCode, "click", function (event) {
                                this.select();
                            });
                        }
                        var tinyUrlBtn = query('.tinyUrlBtn')[0];
                        if (tinyUrlBtn) {
                            dojo.connect(tinyUrlBtn, "onclick", function () {
                                _self.shareLink(encodeURIComponent(_self.options.shareURL));
                                var inputShare = dom.byId('inputShare');
                                if (inputShare) {
                                    setTimeout(function () {
                                        query(inputShare).attr('value', _self.tinyUrl);
                                        query('#inputShare')[0].style.display = "block";
                                        query('.tinyUrlBtn')[0].style.display = "none";
                                    }, 1500);
                                }
                            });
                        }
                        var inputShare = dom.byId("inputShare");
                        if (inputShare) {
                            if (dojo.isBrowser) {
                                inputShare.readOnly = true;
                            }
                            on(inputShare, "click", function (event) {
                                this.select();
                            });
                        }
                        // embed click
                        if (_self.options.previewPage) {
                            // on click
                            var embedOptions = dom.byId("embedOptions");
                            if (embedOptions) {
                                // on click
                                on(embedOptions, "click, keyup", function (event) {
                                    if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                        var w = _self.options.previewSize.width;
                                        var h = _self.options.previewSize.height;
                                        var left = (screen.width / 2) - (w / 2);
                                        var top = (screen.height / 2) - (h / 2);
                                        window.open(_self.options.previewPage + _self.options.shareParams, 'embed', 'scrollbars=yes', 'width=' + w + ',height=' + h + ',top=' + top + ',left=' + left, false);
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
                                    _self.setSharing();
                                    _self.shareLink(encodeURIComponent(_self.options.shareURL));
                                    query('#inputShare')[0].style.display = "none";
                                    query('.tinyUrlBtn')[0].style.display = "block";
                                }
                            });
                        }
                        // share buttons
                        var fbImage = dom.byId("fbImage");
                        if (fbImage) {
                            on(fbImage, "click, keyup", function (event) {
                                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                    _self.setFBLink(_self.tinyUrl);
                                    return false;
                                }
                            });
                        }
                        var twImage = dom.byId("twImage");
                        if (twImage) {
                            on(twImage, "click, keyup", function (event) {
                                if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                    _self.setTWLink(_self.tinyUrl);
                                    return false;
                                }
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
                        if (dojo.isMobileDevice) {
                            var divLocate = dojo.create("div", { "id": "geocoderSearchTool" }, dojo.byId("searchBox"));
                        }
                        var html = '<div id="spotlight" class="spotlight"></div>';
                        dojo.place(html, dojo.byId('map_container'), 'last');
                        _self._geocoder = new Geocoder({
                            map: _self.options.map,
                            theme: 'modernGrey',
                            autoComplete: true
                        }, dom.byId("geocoderSearchTool"));

                        // on select test
                        connect.connect(dojo.byId("geocoderSearchTool_input"), 'onkeyup', function (result) {

                            if (dojo.byId("geocoderSearchTool_input").value !== "") {
                                if (dojo.byId('imgBookmarks')) {
                                    dojo.byId('imgBookmarks').style.display = "none";
                                }
	                    }
	                });
	                connect.connect(dojo.byId("geocoderSearchTool_input"), 'onclick', function (result) {
	                    if (dojo.isMobileDevice) {
	                    if (domClass.contains("mapNotesContainer", "showMapNotesContainer")) {
	                        _self.hideMapnoteContainer();
	                        }
                            }
                        });
                        connect.connect(_self._geocoder, 'onSelect', function (result) {
                            if (dojo.byId('imgBookmarks')) {
                                setTimeout(function () {
                                    dojo.byId('imgBookmarks').style.display = "none";
                                }, 10);
                            }
                            var areaRange = result.extent.xmax - result.extent.xmin;
                            var extentRange = _self.options.ExtentRange || 15;
                            if (areaRange > extentRange) {

                                var spotlight = connect.connect(_self.options.map, 'onExtentChange', function () {
                                    var extent;
                                    if (dojo.isTablet) {
                                        extent = result.extent.expand(0.75);
                                    }
                                    else if (dojo.isMobileDevice) {
                                        extent = result.extent.expand(0.5);
                                    }
                                    else {
                                        extent = result.extent;
                                    }
                                    var geom = esri.geometry.toScreenGeometry(_self.options.map.extent, _self.options.map.width, _self.options.map.height, extent);
                                    var width = geom.xmax - geom.xmin;
                                    var height = geom.ymin - geom.ymax;
                                    var max = height;
                                    if (width > height) {
                                        max = width;
                                    }
                                    var margin = '-' + Math.floor(max / 2) + 'px 0 0 -' + Math.floor(max / 2) + 'px';
                                    setTimeout(function () {
                                        query('.spotlight').addClass('spotlight-active').style({
                                            width: max + 'px',
                                            height: max + 'px',
                                            margin: margin
                                        });
                                    }, 500);
                                    _self.setSharing();
                                    connect.disconnect(spotlight);
                                });
                            }
                            else {
                                var pt = result.feature.geometry;
                                _self.setMarker(pt, result.name);
                            }
                        });
                        dojo.connect(_self.options.map, "onClick", function (event) {
                            _self.removeSpotlight();
                        });
                        connect.connect(_self._geocoder, 'onFindResults', function (response) {
                            if (!response.results.length) {
                                _self.alertDialog(i18n.viewer.errors.noLocation);
                                _self.resetLocateLayer();
                            }
                        });
                        connect.connect(_self._geocoder, "_showLoading", function () {
                            if (dojo.byId('imgBookmarks')) {
                                dojo.byId('imgBookmarks').style.display = "none";
                            }
                        });
                        connect.connect(_self._geocoder, "_hideLoading", function () {
                        });
                        connect.connect(_self._geocoder, "_showResults", function () {
                            if (dojo.byId('imgBookmarks')) {
                                dojo.byId('imgBookmarks').style.display = "none";
                            }
                        });
                        connect.connect(_self._geocoder, "clear", function () {
                            if (dojo.byId('imgBookmarks')) {
                                dojo.byId('imgBookmarks').style.display = "block";
                            }
                        });
                        _self._geocoder.startup();
                        connect.connect(_self.options.map, 'onExtentChange', function () {
                            _self.removeSpotlight();
                        });
                        // on clear test
                        dojo.connect(_self._geocoder, 'onClear', function (evt) {
                            _self.removeSpotlight();
                            _self.resetLocateLayer();
                            _self.clearPopupValues();
                            _self.options.map.infoWindow.hide();
                        });
                        if (_self.options.locateName) {
                            _self._search.set('value', _self.options.locateName);
                        }
                    }
                },
                // show about button if url is set
                configureAboutText: function () {
                    var _self = this;
                    if (_self.options.itemInfo.item.description && _self.options.showAboutDialog) {
                        // insert html
                        node = dom.byId('aboutDialog');
                        var html = '';
                        html += '<div class="padContainer">';
                        html += '<h2 tabindex="0">' + _self.options.itemInfo.item.title + '</h2>';
                        html += '<div class="desc">' + _self.options.itemInfo.item.description + '</div>';
                        html += '<div class="clear"></div>';
                        // see if not just empty HTML tags
                        if (_self.options.itemInfo.item.licenseInfo) {
                            var result = _self.options.itemInfo.item.licenseInfo.replace(/(<([^>]+)>)/ig, "");
                            if (_self.options.itemInfo.item.licenseInfo && result) {
                                html += '<h3>' + i18n.viewer.about.access + '</h3>';
                                html += '<div class="license">' + _self.options.itemInfo.item.licenseInfo + '</div>';
                            }
                        }
                        html += '</div>';
                        if (node) {
                            node.innerHTML = html;
                        }
                        on(dom.byId("aboutMap"), "click, keyup", function (event) {
                            if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                                this.blur();
                                _self.utils.hideAllMenus();
                                _self.utils.toggleAboutMap(this);
                            }
                        });
                        var props = {
                            style: "width:52%; max-width:725px; min-width:215px;",
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
                    if (_self.options.showGeolocation && navigator.geolocation) {
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
                    on(dom.byId("homeExtent"), "click, keyup", function (event) {
                        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
                            _self.options.map.setExtent(_self.options.startExtent);
                        }
                    });
                    // geolocate click
                    var geolocateButton;
                    if (dojo.isMobileDevice) {
                        geolocateButton = dom.byId("imgGeoLocate");
                    } else {
                        geolocateButton = dom.byId("geoLocate");
                    }
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
                    dojo.connect(_self.options.map, "onUpdateEnd", function () {
                        setTimeout(function () {
                            if (_self.options.legendDijit) {
                                _self.options.legendDijit.refresh();
                            }
                            if (_self.basemapDijit) {
                                _self.basemapDijit._refreshUI();
                            }
                        }, 1500);
                    });
                    connect.connect(_self.options.map, "onZoomEnd", function (evt) {

                        var level = _self.options.map.getLevel();
                        if (level !== -1 && _self.options.mapZoomBar) {
                            _self.options.mapZoomBar.set("value", level);
                        }
                        setTimeout(dojo.hitch(this, function () {
                            for (var i in _self.legendFilter) {
                                var legendContainer = dojo.byId('legendContent_' + i);
                                if (legendContainer) {
                                    dojo.query(".esriLegendLayer", dojo.byId('legendContent_' + i)).forEach(function (node) {
                                        for (var j = _self.legendFilter[i].length - 1; j >= 0; j--) {
                                            node.deleteRow(_self.legendFilter[i][j]);
                                        }
                                    });
                                }
                            }
                        }), 1000);
                    });
                    var sliderMax;
                    var mapLevel;
                    if (_self.options.map.getLevel() !== -1) {
                        mapLevel = _self.options.map.getLevel();
                    }
                    if (_self.options.map._params && _self.options.map._params.lods) {
                        sliderMax = _self.options.map._params.lods.length - 1;
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
                                if (_self.options.map.getLevel() !== level) {
                                    _self.options.map.setLevel(level);
                                }
                            }
                        }, "customZoom");
                    }
                },
                hideLayerInfo: function () {
                    query('.listMenu ul li .infoHidden').style('display', 'none');
                    query('.listMenu ul li').removeClass('active');
                },
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
                                _self.utils.hideMenu(menuQuery);
                            } else {
                                _self.utils.hideAllMenus();
                                _self.utils.showMenu(menuQuery, buttonQuery);
                            }
                        }
                        _self.hideLayerInfo();
                    } else {
                        _self.utils.hideAllMenus();
                    }
                },
                // add menus to dom
                addSlideMenus: function () {
                    var html = '';
                    html += '<div id="dataMenuCon">';
                    html += '<div data-menu="autocomplete" id="autoComplete" class="slideMenu"></div>';
                    html += '<div data-menu="search" id="searchMenu" class="slideMenu"></div>';
                    html += '<div data-menu="basemap" id="basemapMenu" class="slideMenu"></div>';
                    html += '<div data-menu="layers" id="layersMenu" class="slideMenu"></div>';
                    html += '<div data-menu="legend" id="legendMenu" class="slideMenu"></div>';
                    html += '<div data-menu="share" id="shareControls" class="slideMenu"></div>';
                    html += '<div data-menu="places" id="placesMenu" class="slideMenu listMenu"></div>';
                    html += '</div>';
                    var node = query('#mapcon')[0];
                    if (node) {
                        domConstruct.place(html, node, "last");
                    }
                    query('#mapcon .slideMenu').style('display', 'none');
                },
                // webmap object returned. Create map data
                webmapReturned: function (response) {
                    var _self = this;
                    // webmapde
                    _self.options.map = response.map;
                    _self.options.itemInfo = response.itemInfo;

	            //Seperate map notes with operational layers.
	            array.some(_self.options.itemInfo.itemData.operationalLayers, function (lyr, index) {
	                    if (!lyr.url) {
	                        _self.mapNotesLayer = _self.options.itemInfo.itemData.operationalLayers.splice(index);
	                    return true;
	                }
	            });
                    _self.utils.setStartExtent();
                    _self.utils.setStartLevel();
                    _self.utils.setStartMarker();
                    _self.utils.configureAppTitle();
                    if (!dojo.isMobileDevice) {
                        _self.rightSideMenuButtons();
                        _self.configureShareMenu();
                        _self.configureAboutText();
                    } else {
                        _self.createBottomMenu();
                        _self.createLayersMenu();
                        _self.createLegendMenu();
                        if (_self.options.showAboutDialog) {
                            _self.createAboutMenu();
                        }
                    }
                    _self.configurePlaces();
                    // once map is loaded
                    if (_self.options.map.loaded) {
                        _self.mapIsLoaded();
                    } else {
                        connect.connect(_self.options.map, "onLoad", function () {
                            _self.mapIsLoaded();
                        });
                    }
                    connect.connect(_self.options.map, "onPanEnd", function (evt1) {
                        if (dojo.showInfoWindow) {
                            _self.options.map.infoWindow.show(_self.zoomToAttributes);
                        }
                    });
                    connect.connect(_self.options.map.infoWindow, "onHide", function () {
                        dojo.showInfoWindow = false;
                    });
                    connect.connect(_self.options.map.infoWindow, "onShow", function () {
	                if (!_self.mapnote.showInfoWindow) {
	                    return;
	                }
	                _self.mapnote.hideMapnoteDescription();
	                if (dojo.isBrowser) {
	                on(query('.titleButton.maximize')[0], 'click', function () {
	                    if (domClass.contains("mapNotesContainer", "showMapNotesContainer")) {
	                            _self.mapnote.hideMapnotePanel();
	                    }
	                });
	                }
                        setTimeout(function () {
                            _self.resizePopup();
                            var mapPoint = _self.options.map.infoWindow._location;
                            _self.zoomToAttributes = _self.options.map.infoWindow._location;
                            if (dojo.isMobileDevice) {
                                if (!mapPoint) {
                                    esri.show(_self.options.map.infoWindow.domNode);
                                    _self.options.map.infoWindow.isShowing = true;
                                    return;
                                }
                                var screenPoint;
                                if (mapPoint.spatialReference) {
                                    _self.options.map.infoWindow._location = mapPoint;
                                    screenPoint = _self.options.map.toScreen(mapPoint);
                                }
                                else {
                                    _self.options.map.infoWindow._location = map.toMap(mapPoint);
                                    screenPoint = mapPoint;
                                }
                                if (_self.options.map.infoWindow._maximized) {
                                    _self.options.map.infoWindow.restore();
                                }
                                else {
                                    _self.options.map.infoWindow._setPosition(screenPoint);
                                }
                                if (!_self.options.map.infoWindow.isShowing) {
                                    esri.show(_self.options.map.infoWindow.domNode);
                                    _self.options.map.infoWindow.isShowing = true;
                                    _self.options.map.infoWindow._followMap()
                                }
                            }
                            else {
                                if (window.innerWidth < 800) {
                                    if (_self.options.map.infoWindow.isShowing) {
                                        _self.utils.hideAllMenus();
                                    }
                                }
                                if (!mapPoint) {
                                    _self.options.map.infoWindow._setVisibility(true);
                                    _self.options.map.infoWindow.isShowing = true;
                                    return;
                                }
                                var screenPoint;
                                if (mapPoint.spatialReference) {
                                    _self.options.map.infoWindow._location = mapPoint;
                                    screenPoint = _self.options.map.toScreen(mapPoint);
                                }
                                else {
                                    _self.options.map.infoWindow._location = _self.options.map.toMap(mapPoint);
                                    screenPoint = mapPoint;
                                }
                                var frameWidth = _self.options.map._getFrameWidth();
                                if (frameWidth !== -1) {
                                    screenPoint.x = screenPoint.x % frameWidth;
                                    if (screenPoint.x < 0) {
                                        screenPoint.x += frameWidth;
                                    }
                                    if (_self.options.map.width > frameWidth) {
                                        var width = (_self.options.map.width - frameWidth) / 2;
                                        while (screenPoint.x < width) {
                                            screenPoint.x += frameWidth;
                                        }
                                    }
                                }
                                if (_self.options.map.infoWindow._maximized) {
                                    _self.options.map.infoWindow.restore();
                                }
                                else {
                                    _self.options.map.infoWindow._setPosition(screenPoint);
                                }
                                if (!_self.options.map.infoWindow.isShowing) {
                                    _self.options.map.infoWindow._setVisibility(true);
                                    _self.options.map.infoWindow.isShowing = true;
                                    _self.options.map.infoWindow._followMap();
                                }
                            }
	                    _self.options.map.centerAt(_self.options.map.infoWindow._location);
                        }, 500);
                    });
                },
                resizePopup: function () {
                    var _self = this;
                    if (!dojo.isMobileDevice) {
                        var w, h;
                        if (window.innerWidth < 650 || window.innerHeight < 500) {
                            w = window.innerWidth / 2 - 20;
                            h = window.innerHeight / 2 - 50;
                        } else {
                            w = 290;
                            h = 200;
                        }
                        if (window.innerWidth >= 650) {
                            w = 290;
                        }
                        _self.options.map.infoWindow.resize(w, h);
                    } else {
                        _self.options.map.infoWindow.resize();
                    }
                },
                onMapLoad: function () {
                    var _self = this;
                    if (dojo.isMobileDevice) {
                        _self.hideAddressBar();
                        _self.setViewHeight();
	                //If map note is set true in config, show map note button
	                if (_self.options.showMapNote) {
	                    if (dom.byId("mblMapnoteBtn")) {
	                        dom.byId("mblMapnoteBtn").style.display = "block";
	                        on(dom.byId("mblMapnoteBtn"), "click", function () {
	                            _self.toggleMapnoteButton();
	                        });
	                    }
	                }
	                dom.byId("mblZoomBtnContainer").style.display = "block";
	            } else if (dojo.isBrowser || dojo.isTablet) {
                        _self.resizeTopMenuBar();
	                //If map note is set true in config
	                if (_self.options.showMapNote) {
	                    if (dom.byId("mapNotesButton")) {
	                        domStyle.set("mapNotesButton", "display", "block");
	                        domClass.add("mapNotesButton", "barButton");
	                        domConstruct.create("div", { class: "headerIcon", id: "mapNoteHeaderIcon" }, "mapNotesButton", "first");
	                        on(dom.byId("mapNotesButton"), "click", function () {
	                            if (domClass.contains("mapNotesButton", "mapnoteSelected")) {
	                                domClass.remove("mapNotesButton", "mapnoteSelected");
	                            } else {
	                                domClass.add("mapNotesButton", "mapnoteSelected");
	                            }
	                            _self.mapnote.toggleLeftPanel();
	                        });
	                    }
	                }
                    }
                },
	        toggleMapnoteButton: function () {
	            var _self = this;
	            if (domClass.contains("mapNotesContainer", "showMapNotesContainer")) {
	                _self.hideMapnoteContainer();
	            } else {
	                if (domClass.contains("mapNotesContainer", "hideMapNotesContainer")) {
	                    _self.showMapnoteContainer();
	                } else {
	                    domClass.add("mapNotesContainer", ["showMapNotesContainer", "transition"]);
	                    domClass.add("mblMapnoteBtn", ["slideBtnRight", "transition"]);
	                    domClass.add("mblZoomBtnContainer", ["slideBtnRight", "transition"]);
	                }
	            }
	        },

	        hideMapnoteContainer: function () {
	            domClass.replace("mapNotesContainer", "hideMapNotesContainer", "showMapNotesContainer");
	            domClass.replace("mblMapnoteBtn", "slideBtnLeft", "slideBtnRight");
	            domClass.replace("mblZoomBtnContainer", "slideBtnLeft", "slideBtnRight");
	        },

	        showMapnoteContainer: function () {
	            domClass.replace("mapNotesContainer", "showMapNotesContainer", "hideMapNotesContainer");
	            domClass.replace("mblMapnoteBtn", "slideBtnRight", "slideBtnLeft");
	            domClass.replace("mblZoomBtnContainer", "slideBtnRight", "slideBtnLeft");
	        },

                mapIsLoaded: function () {
                    var _self = this;
                    //configure map animation to be faster
                    config.defaults.map.panDuration = 50;
                    config.defaults.map.panRate = 5;
                    config.defaults.map.zoomDuration = 100;
                    config.defaults.map.zoomRate = 5;
                    if (dojo.isBrowser) {
                        dojo.connect(query('#expandName')[0], "onclick", function (element) {
                            element.currentTarget.style.display = "none";
                            query('#mapTitle')[0].style.width = "auto";
                            query('#menuList')[0].style.display = "none";
                            query('#collapseName')[0].style.display = "block";
                        });
                        dojo.connect(query('#collapseName')[0], "onclick", function (element) {
                            element.currentTarget.style.display = "none";
                            query('#mapTitle')[0].style.width = "60px";
                            query('#menuList')[0].style.display = "block";
                            query('#expandName')[0].style.display = "block";
                        });
                    }
                    // map connect functions
                    _self.createCustomSlider();
                    _self.setSharing();
                    // create basemap gallery widget
                    _self.configureLayers();
                    // set up social media
                    _self.configureSocialMedia();
                    // set up layer menu
                    _self.createBMGallery(_self.options.map);
                    // resize map
                    _self.resizeMap();
                    _self.updateSocialLayers();
                    _self.configureSearchBox();
	            if (dojo.isBrowser || dojo.isTablet) {
	                // set up map note panel
	            _self.mapnote.configureMapNotes(_self.mapNotesLayer);
	            } else {
	                _self.configureMapNotes();
	                on(dom.byId("zoomInBtn"), "click", function () {
	                    var mapLevel = _self.options.map.getLevel();
	                    _self.options.map.setLevel(mapLevel + 1);
	                });
	                on(dom.byId("zoomOutBtn"), "click", function () {
	                    var mapLevel = _self.options.map.getLevel();
	                    _self.options.map.setLevel(mapLevel - 1);
	                });
	            }
                    setTimeout(function () {
                        connect.connect(_self.options.map, "onExtentChange", function (extent) {
                            // hide about panel if open
                            _self.utils.hideAboutMap();
                            // update current extent
                            _self.options.extent = [extent.xmin, extent.ymin, extent.xmax, extent.ymax];
                            // update sharing link
                            _self.setSharing();
                            // reset refresh timer for social media
                            _self.resetSocialRefreshTimer();
                            if (dojo.isMobileDevice) {
                                if (dojo.byId('imgRefresh')) {
                                    dojo.byId('imgRefresh').src = "./images/ui/ReloadBlue.png";
                                }
                                if (dojo.byId('divMessage')) {
                                    dojo.byId('divMessage').style.display = "block";
                                }
                            }
                        });
                    }, 4000);
	            on(_self.options.map, "PanStart,ZoomStart", function () { _self.mapnote.hideMapnoteTooltip(); });
                    if (dojo.isMobileDevice) {
                        dojo.byId("zoomSlider").style.display = "none";
                        query('#topMenuBar').style('display', 'none');
                        query('#mblHeader').style('display', 'block');
                        var html = ' ';
                        if (_self.options.showPlaces) {
                            html = '<div><img id="imgBookmarks" class="imgBookmarks" src="./images/ui/BookmarkBlue32.png"/></div>';
                            if (_self.options.showSearchBox) {
                                domConstruct.place(html, query('.esriGeocoder')[query('.esriGeocoder').length - 1], 'first');
                                var imgBookmark = dojo.byId('imgBookmarks');
                                if (imgBookmark) {
                                    dojo.connect(imgBookmark, 'onclick', function () {
                                        dijit.byId("mapTab").set('selected', false);
                                        dijit.byId('bookmarkView').show();
                                        dojo.byId("divCont").style.display = "none";
                                        dijit.byId('bookmarkView').resize();
                                    });
                                }
                            }
                        }

                        if (_self.options.showGeolocation) {
                            var img = dojo.create("img", {
                                "class": "homeImage",
                                "src": "./images/ui/GeolocateBlue.png"
                            }, dojo.byId("imgGeoLocate"));
                            dojo.byId("imgGeoLocate").style.display = "block";
                        }

                        dojo.connect(dojo.byId('imgRefreshContainer'), "onclick", function () {
                            dojo.byId('imgRefresh').src = "./images/ui/Refresh-New.gif";
                            if (dojo.byId('divMessage')) {
                                dojo.byId('divMessage').style.display = "none";
                            }
                            _self.updateSocialLayers();
                        });
                    }
                    else {
                        query('#topMenuBar').style('display', 'block');
                        query('#mblHeader').style('display', 'none');
                    }

                    dojo.query(".esriMobileNavigationBar").forEach(function (node) {
                        dojo.query(".right", node).forEach(function (node1) {
                            dojo.query("img", node1).forEach(function (img) {
                                img.src = "images/ui/min.png";
                            });
                        });
                    });
                    // map loaded.
                    _self.onMapLoad();
                    if (dojo.isMobileDevice) {
                        if (_self.options.updateSocialLayersOnPan === false) {
                            var imgRefresh = dojo.create("img", { "src": "./images/ui/refresh.png", "id": "imgRefresh" }, dojo.byId('imgRefreshContainer'));
                            dojo.byId('imgRefreshContainer').style.display = "block";
                            var divMessage = dojo.create("div", { "class": "divMessage", "id": "divMessage" }, dojo.byId('mapcon'));
                            divMessage.innerHTML = i18n.viewer.buttons.refreshContext;
                        }
                        if (_self.options.showGeolocation && (!_self.options.updateSocialLayersOnPan)) {
                            if (dojo.byId("searchBox")) {
	                        dojo.byId("searchBox").style.left = "66px";
                            }
                        }
                        else if ((!_self.options.showGeolocation) && _self.options.updateSocialLayersOnPan) {
                            if (dojo.byId("searchBox")) {
                                dojo.byId("searchBox").style.left = "5px";
                            }
                        }
                    }
                },
                resizeTopMenuBar: function () {
                    var _self = this;
                    if (window.innerWidth <= 520) {
                        if (query('#collapseName')[0].style.display === "none") {
                            query('#mapTitle')[0].style.width = "60px";
                            query('#expandName')[0].style.display = "block";
                        }
                    } else {
                        query('#mapTitle')[0].style.width = "auto";
                        query('#menuList')[0].style.display = "block";
                        query('#collapseName')[0].style.display = "none";
                        query('#expandName')[0].style.display = "none";
                    }
                    var ht = window.innerHeight - 60;

                    if (ht < 350) {
                        if (query('.legendMenuCon .slideScroll')[0]) {
                            query('.legendMenuCon .slideScroll')[0].style.maxHeight = (ht - 75) + 'px';
                        }
                        if (query('#operationalMenu')[0]) {
                            query('#operationalMenu')[0].style.maxHeight = (ht - 75) + 'px';
                        }
                        if (query('#socialMenu')[0]) {
                            query('#socialMenu')[0].style.maxHeight = (ht - 75) + 'px';
                        }
                        if (query('#basemapDiv')[0]) {
                            query('#basemapDiv')[0].style.maxHeight = (ht - 75) + 'px';
                        }
                        if (query('#placesMenu .scrollCont')[0]) {
                            query('#placesMenu .scrollCont')[0].style.maxHeight = (ht - 75) + 'px';
                        }
                    } else {

                        if (query('.legendMenuCon .slideScroll')[0]) {
                            query('.legendMenuCon .slideScroll')[0].style.maxHeight = '280px';
                        }
                        if (query('#basemapDiv')[0]) {
                            query('#basemapDiv')[0].style.maxHeight = '280px';
                        }
                        if (query('#operationalMenu')[0]) {
                            query('#operationalMenu')[0].style.maxHeight = '280px';
                        }
                        if (query('#socialMenu')[0]) {
	                    query('#socialMenu')[0].style.maxHeight = '350px';
                        }
                        if (query('#placesMenu .scrollCont')[0]) {
                            query('#placesMenu .scrollCont')[0].style.maxHeight = '280px';
                        }
                    }
                    if (window.innerWidth < 650) {
                        _self.hideLayerInfo();
                        query('.listMenu .cBinfo').style('display', 'none');
                    } else {
                        query('.listMenu .cBinfo').style('display', 'block');
                    }
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
                    _self.options.customPopup = (dojo.isMobileDevice) ? new PopupMobile(null, dojo.create("div")) : new esri.dijit.Popup({
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
                    _self.addReportInAppButton();
                    if (dojo.isMobileDevice) {
                        connect.connect(_self.options.customPopup, "onSelectionChange", function () {
                            _self.overridePopupTitle();
                            _self.overridePopupHeader();
	                    _self.changeSelection();
                        });
                        connect.connect(_self.options.customPopup, "maximize", function () {
                            _self.overridePopupHeader();
                        });
                        connect.connect(_self.options.customPopup, "onHide", function () {
                            _self.overridePopupHeader();
                            dojo.byId('divCont').style.display = "block";
	                });
	                connect.connect(_self.options.customPopup, "onShow", function () {
	                    _self.changeSelection();
	                    if (!_self.options.customPopup.features) {
	                        _self.options.customPopup.hide();
	                    }
                        });
	                aspect.before(_self.options.customPopup, "_setPosition", function (evt) {
	                    _self.zoomToAttributes = _self.options.map.toMap(evt);
	                });
                        // connects for popup
                    } else {
                        connect.connect(_self.options.customPopup, "maximize", function () {
                            _self.utils.hideAllMenus();
                        });
                        connect.connect(_self.options.customPopup, "onSelectionChange", function () {
                            _self.overridePopupTitle();
                        });
                        connect.connect(_self.options.customPopup, "onHide", function () {
                            _self.clearPopupValues();
                        });
                        // popup theme
                        domClass.add(_self.options.customPopup.domNode, "modernGrey");
                    }
                },
	        changeSelection: function () {
	            var _self = this;
	            if (_self.options.customPopup.getSelectedFeature()) {
	                var mapnoteAttribute = _self.options.customPopup.getSelectedFeature().attributes;
	                var mapnoteID = mapnoteAttribute.TITLE + mapnoteAttribute.OBJECTID;
	                array.forEach(_self.mapnote.mapNotesList, function (list) {
	                    if (list.id == mapnoteID) {
	                        list.set('open', true);
	                        domClass.add(list.titleNode, "listExpand");
	                    } else {
	                        list.set('open', false);
	                        _self.mapnote.swapCSS(list.titleNode);
	                    }
	                });
	            }
	        },

                // Create the map object for the template
                createWebMap: function () {
                    var _self = this;

                    _self.configurePopup();
                    // create map deferred with options
                    var mapDeferred = arcgisUtils.createMap(_self.options.webmap, 'map', {
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
	                dojo.place(_self.options.customPopup.domNode, response.map.root);
                    });
                    // on error response
                    mapDeferred.addErrback(function (error) {
                        _self.alertDialog(i18n.viewer.errors.createMap + ": " + error.message);
                    });
                },
                init: function () {
                    var _self = this;
                    // Overwrite from url values
                    var mapconDiv = new dojox.mobile.View(null, "mapcon");
                    // add menus
                    _self.addSlideMenus();
                    // Create Map
                    _self.createWebMap();
                    _self.setOptions();
                    _self.setSharing();
                    // filtering
                    if (_self.options.bannedUsersService && _self.options.flagMailServer) {
                        _self.filterUsers = true;
                        _self.utils.createSMFOffensive();
                    }
                    if (_self.options.bannedWordsService) {
                        _self.filterWords = true;
                        _self.utils.createSMFBadWords();
                    }
                },
                overridePopupHeader: function () {
                    dojo.query(".esriMobileNavigationBar").forEach(function (node) {
                        dojo.query(".right1", node).forEach(function (node0) {
                            dojo.query("img", node0).forEach(function (img) {
                                img.src = "images/ui/rightlongarrow.png";
                            });
                        });
                        dojo.query(".right2", node).forEach(function (node2) {
                            dojo.query("img", node2).forEach(function (img) {
                                img.src = "images/ui/leftlongarrow.png";
                            });
                        });
                        dojo.query(".right", node).forEach(function (node1) {
                            dojo.query("img", node1).forEach(function (img) {
                                img.src = "images/ui/min.png";
                            });
                        });
                    });
                },
                filterUniqueValueRenders: function (layer, legendFilter) {

                    var handle = dojo.connect(layer, "onUpdateEnd", function () {
                        dojo.disconnect(handle);
                        var availableRenderers = {};
                        var count = 0;
                        for (var j in this.graphics) {
                            if (!availableRenderers[this.graphics[j].attributes[this.renderer.attributeField]]) {
                                count++;
                                availableRenderers[this.graphics[j].attributes[this.renderer.attributeField]] = {};
                            }
                            if (count === this.renderer.infos.length) {
                                return;
                            }
                        }
                        var unavailableRenderer = [];
                        for (var i in layer.renderer.values) {
                            if (!availableRenderers[layer.renderer.values[i]]) {
                                unavailableRenderer.push(layer.renderer.values[i]);
                            }
                        }
                        var legend = [];
                        var legendContainer = dojo.byId('legendContent_' + layer.id);
                        dojo.query(".esriLegendLayer", dojo.byId('legendContent_' + layer.id)).forEach(function (node) {
                            for (var i = node.rows.length - 1; i >= 0; i--) {
                                for (var j in unavailableRenderer) {
                                    if (node.rows[i].innerHTML.indexOf(unavailableRenderer[j]) >= 0) {
                                        node.deleteRow(i);
                                        legend.push(i);
                                        break;
                                    }
                                }
                            }
                        });
                        layer.removeLegendRows = legend;
                        _self.legendFilter[layer.id] = legend.sort();
                    });
                },

                filterClassBreakRenders: function (layer, legendFilter) {
                    var handle = dojo.connect(layer, "onUpdateEnd", function () {
                        dojo.disconnect(handle);
                        var availableRenderers = {};
                        var count = 0;
                        var rendererField = this.renderer.attributeField;
                        var breaks = dojo.clone(layer.renderer.breaks);
                        for (var j in this.graphics) {
                            for (var i in breaks) {
                                if (this.graphics[j].attributes[rendererField] >= breaks[i][0] && this.graphics[j].attributes[rendererField] <= breaks[i][1]) {
                                    delete breaks[i];
                                }
                            }
                        }
                        var legend = [];
                        for (var i in breaks) {
                            legend.push(i);
                        }
                        var legendContainer = dojo.byId('legendContent_' + layer.id);
                        dojo.query(".esriLegendLayer", dojo.byId('legendContent_' + layer.id)).forEach(function (node) {
                            for (var i = legend.length - 1; i >= 0; i--) {
                                node.deleteRow(legend[i]);
                            }
                        });
                        _self.legendFilter[layer.id] = legend;
                    });
                }
            });
            return Widget;
        });