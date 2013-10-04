define([
    "dojo/_base/kernel",
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom",
    "dojo/query",
    "dojo/i18n!./nls/template.js",
    "dojo/fx",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/date",
    "dojo/on",
    "dojo/io-query",
    "dojo/date/locale",
    "dojo/html",
    "esri", // We're not directly using anything defined in esri.js but geometry, locator and utils are not AMD. So, the only way to get reference to esri object is through esri module (ie. esri/main)
    "config/commonConfig",
    "dojo/cookie",
    "dojo/json",
    "esri/config",
    "esri/arcgis/utils",
    "esri/tasks/GeometryService",
    "dijit/TitlePane",
    "dojo/dom-attr",
    "dojox/widget/TitleGroup",
    "dijit/TooltipDialog",
    "esri/geometry/Extent",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/urlUtils",
    "esri/geometry",
    "esri/utils",
    "dojo/has"
  ],
  function (dojo, declare, connect, array, lang, event, dom, query, i18n, coreFx, domClass, domConstruct, date, on, ioQuery, locale, html, esri, templateConfig, cookie, JSON, config, arcgisUtils, GeometryService, TitlePane, domAttr, TitleGroup, TooltipDialog, Extent, Point, SpatialReference, domGeom, domStyle, QueryTask, Query, urlUtils, has) {
      var Widget = declare("modules.utils", null, {
          constructor: function (options) {
              this.mapNotesLayer = [];
              this.mapNotesList = [];
              declare.safeMixin(this, options);
          },
          removeReportInAppButton: function () {
              query('#inFlag').orphan();
          },
          replaceFlag: function () {
              var node = dom.byId('inFlag');
              if (node) {
                  node.innerHTML = '<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>';
              }
              if (dojo.isReferrer) {
                  if ((window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) <= 450) {
                      node.innerHTML = '<span id="inFlagComplete"><span class="LoadingComplete" title="' + i18n.viewer.buttons.contentFlagged + '"></span></span>';
                  }
              }
          },
          replaceFlagError: function () {
              var node = dom.byId('inFlag');
              if (node) {
                  node.innerHTML = 'Error flagging content.';
              }
          },

          // Set initial extent for future use
          setStartExtent: function () {
              var _self = this;
              _self.options.startExtent = _self.options.map.extent;
              // if extent is a string
              if (_self.options.extent && typeof _self.options.extent === 'string') {
                  var splitExtent = _self.options.extent.split(',');
                  // Loaded from URL
                  _self.options.startExtent = new Extent({
                      xmin: parseFloat(splitExtent[0]),
                      ymin: parseFloat(splitExtent[1]),
                      xmax: parseFloat(splitExtent[2]),
                      ymax: parseFloat(splitExtent[3]),
                      spatialReference: _self.options.map.extent.spatialReference
                  });
              }
              _self.options.map.setExtent(_self.options.startExtent);
          },
          setStartLevel: function () {
              var _self = this;
              if (_self.options.level) {
                  _self.options.map.setLevel(parseInt(_self.options.level, 10));
              }
          },
          setStartMarker: function () {
              var _self = this;
              if (_self.options.locatePoint[0] && _self.options.locatePoint[1]) {
                  var point = new Point([_self.options.locatePoint[0], _self.options.locatePoint[1]], new SpatialReference({
                      wkid: _self.options.map.spatialReference.wkid
                  }));
                  if (point) {
                      _self.setMarker(point, _self.options.locateName);
                  }
              }
          },
          createSMFOffensive: function () {
              var _self = this;
              if (_self.options.bannedUsersService) {
                  // offensive users task
                  _self.options.bannedUsersTask = new QueryTask(_self.options.bannedUsersService);
                  // offensive users query
                  _self.options.bannedUsersQuery = new Query();
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
                  _self.options.bannedWordsTask = new QueryTask(_self.options.bannedWordsService);
                  _self.options.bannedWordsQuery = new Query();
                  _self.options.bannedWordsQuery.where = '1=1';
                  _self.options.bannedWordsQuery.returnGeometry = false;
                  _self.options.bannedWordsQuery.outFields = ["word"];
                  _self.options.bannedWordsTask.execute(_self.options.bannedWordsQuery, function (fset) {
                      for (var i = 0; i < fset.features.length; i++) {
                          _self.options.filterWords.push(fset.features[i].attributes.word);
                      }
                  });
              }
          },

          getUrlObject: function () {
              var params = urlUtils.urlToObject(document.location.href);
              // make sure it's an object
              params.query = params.query || {};
              return params;
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
          configureAppTitle: function() {
            var _self = this;
              document.title = i18n.viewer.applicationTitle.PIM;
            var node = dom.byId('mapTitle');
            if (node) {
                  node.innerHTML = i18n.viewer.applicationTitle.PIM;
                  query(node).attr('title', i18n.viewer.applicationTitle.PIM);
            }
            query('meta[name="Description"]').attr('content', _self.options.itemInfo.item.snippet);
            query('meta[property="og:image"]').attr('content', arcgisUtils.arcgisUrl + '/' + _self.options.itemInfo.item.id + '/info/' + _self.options.itemInfo.item.thumbnail);
        },
          transparencyChange: function (value, layerID) {
              var _self = this;
              var newValue = (value / 100);
              var splitVals = layerID.split(',');
              if (splitVals) {
                  for (var j = 0; j < splitVals.length; j++) {
                      var layer = _self.options.map.getLayer(splitVals[j]);
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

          // hide all dropdown menus
          hideAllMenus: function () {
              var _self = this;
              query('#topMenuCon .barButton').removeClass('barSelected');
              query('#mapcon .menuSelected').forEach(function (selectTag) {
                  _self.hideMenu(selectTag);
              });
          },

          hideMenu: function (menuObj) {
              if (menuObj) {
                  coreFx.wipeOut({
                      node: menuObj,
                      duration: 200
                  }).play();
                  var buttons = query('#mapcon .barButton');
                  for (var i = 0; i < buttons.length; i++) {
                      buttons[i].blur();
                  }
                  query(menuObj).removeClass('menuSelected');
              }
          },

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

          // zebra stripe css object
          zebraStripe: function (obj) {
              obj.removeClass("stripe");
              obj.filter(":nth-child(even)").addClass("stripe");
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

          getUshahidCategory: function (id) {
              var _self = this;
              if (_self.ushahidiCategoryArray.length) {
                  for (var i = 0; i < _self.ushahidiCategoryArray.length; i++) {
                      if (parseInt(_self.ushahidiCategoryArray[i].category.id, 10) === parseInt(id, 10)) {
                          console.log('yes');
                          return _self.ushahidiCategoryArray[i].category;
                      }
                  }
              }
              return false;
          },

          // set defaults for config
          setDefaultOptions: function () {
              var _self = this;
              _self.options.templateVersion = "3.01";
              if (!_self.options.locateName) {
                  _self.options.locateName = "";
              }
              _self.options.locatorserviceurl = location.protocol + '//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer';
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
              if (dojo.isBrowser) {
                  _self.options.flickrIcon = "images/social/flickr16x16.png";
              } else {
                  _self.options.flickrIcon = "images/ui/flickrBtn.png";
              }
              _self.options.flickrSymbol = {
                  "url": "images/map/flickr25x30.png",
                  "width": "18.75",
                  "height": "22.5"
              };
              _self.options.twitterID = "twitter";
              _self.options.twitterTitle = i18n.viewer.twitter.title;
              _self.options.twitterDescription = i18n.viewer.twitter.description;
              if (dojo.isBrowser) {
                  _self.options.twitterIcon = "images/social/twitter16x16.png";
              } else {
                  _self.options.twitterIcon = "images/ui/twitterBtn.png";
              }
              _self.options.twitterSymbol = {
                  "url": "images/map/twitter25x30.png",
                  "width": "18.75",
                  "height": "22.5"
              };
              _self.options.panoramioID = "panoramio";
              _self.options.panoramioTitle = i18n.viewer.panoramio.title;
              _self.options.panoramioDescription = i18n.viewer.panoramio.description;
              if (dojo.isBrowser) {
                  _self.options.panoramioIcon = "images/social/panoramio16x16.png";
              }
              else {
                  _self.options.panoramioIcon = "images/ui/panoramio20x20.png";
              }
              _self.options.panoramioSymbol = {
                  "url": "images/map/panoramio25x30.png",
                  "width": "18.75",
                  "height": "22.5"
              };
              _self.options.youtubeID = "youtube";
              _self.options.youtubeTitle = i18n.viewer.youtube.title;
              _self.options.youtubeDescription = i18n.viewer.youtube.description;
              if (dojo.isBrowser) {
                  _self.options.youtubeIcon = "images/social/youtube16x16.png";
              }
              else {
                  _self.options.youtubeIcon = "images/ui/youtubeBtn.png";
              }
              _self.options.youtubeSymbol = {
                  "url": "images/map/youtube25x30.png",
                  "width": "18.75",
                  "height": "22.5"
              };
              _self.options.ushahidiID = "ushahidi";
              _self.options.ushahidiTitle = i18n.viewer.ushahidi.title;
              _self.options.ushahidiDescription = i18n.viewer.ushahidi.description;
              if (dojo.isBrowser) {
                  _self.options.ushahidiIcon = "images/social/ushahidi16x16.png";
              } else {
                  _self.options.ushahidiIcon = "images/ui/ushahidi20x20.png";
              }
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
                  _self.options.isRightToLeft = true;
                  // _self.options.isRightToLeft property setting to true when the locale is 'ar'
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

          getSocialLayer: function (id) {
              var _self = this;
              for (var i = 0; i < _self.options.socialLayers.length; i++) {
                  if (_self.options.socialLayers[i].options.id === id) {
                      return _self.options.socialLayers[i];
                  }
              }
              return false;
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

          smLayerChange: function (id) {
              var _self = this;
              if (id) {
                  var layer = _self.getSocialLayer(id);
                  if (layer) {
                      layer.change();
                  }
              }
          },

          validateConfig: function () {
              var _self = this;
                var appLocation = location.pathname.indexOf("/apps/");
                if (appLocation === -1) {
                    appLocation = location.pathname.indexOf("/home/");
                }
                //app is hosted and no sharing url is defined so let's figure it out.
                if (appLocation !== -1) {
                    // org app
                    var instance = location.pathname.substr(0, appLocation); //get the portal instance name
                    arcgisUtils.arcgisUrl = location.protocol + '//' + location.host + instance + "/sharing/rest/content/items";
                    _self.options.proxyUrl = location.protocol + '//' + location.host + instance + "/sharing/proxy";
                }
                else{
                    //default (Not Hosted no org specified)
                    arcgisUtils.arcgisUrl = location.protocol + "//www.arcgis.com/sharing/rest/content/items";
                }
              //if the sharing url is set overwrite value
              if (_self.options.sharingurl) {
                  arcgisUtils.arcgisUrl = _self.options.sharingurl + 'sharing/rest/content/items';
              }
              // Set geometry to HTTPS if protocol is used
              if (templateConfig.helperServices.geometry.url && location.protocol === "https:") {
                  templateConfig.helperServices.geometry.url = templateConfig.helperServices.geometry.url.replace('http:', 'https:');
              }
              // https locator url
              if (templateConfig.helperServices.geocode.url && location.protocol === "https:") {
                  templateConfig.helperServices.geocode.url = templateConfig.helperServices.geocode.url.replace('http:', 'https:');
              }
              config.defaults.geometryService = new GeometryService(templateConfig.helperServices.geometry.url);
              config.defaults.io.proxyUrl = _self.options.proxyUrl;
              config.defaults.io.corsEnabledServers = [location.protocol + '//' + location.host];
              config.defaults.io.alwaysUseProxy = false;
          },

          // Folder Layer CheckBoxes
          toggleChecked: function (obj) {
              var list = query(obj).parent('li');
              if (domClass.contains(list[0], "checked")) {
                  list.removeClass('cLoading');
              } else {
                  list.addClass('cLoading');
              }
              domClass.toggle(list[0], 'checked');
          },

          _twitterWindow: function (page, forceLogin) {

              var pathRegex = new RegExp(/\/[^\/]+$/);
              var redirect_uri = encodeURIComponent(location.protocol + '//' + location.host + location.pathname.replace(pathRegex, '') + '/oauth-callback.html');
              var w = screen.width / 2;
              var h = screen.height / 1.5;
              var left = (screen.width / 2) - (w / 2);
              var top = (screen.height / 2) - (h / 2);
              if (page) {
                  page += '?';
                  if (forceLogin) {
                      page += 'force_login=true';
                  }
                  if (forceLogin && redirect_uri) {
                      page += '&';
                  }
                  if (redirect_uri) {
                      page += 'redirect_uri=' + redirect_uri;
                  }
                  window.open(page, "twoAuth", 'scrollbars=yes, resizable=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left, true);

                  window.oAuthCallback = function () {
                      window.location.reload();
                  };
              }
          },
          //List will be created for every mapnote showing title
          configureMapNotes: function (mapNoteLayers) {
              var _self = this;
              _self.mapNotesLayer = mapNoteLayers;
              array.forEach(_self.options.itemInfo.itemData.operationalLayers, function (layer, index) {
                  layer.layerObject.onClick = function () {
                      _self.showInfoWindow = true;
          }
              });
              domConstruct.create("div", { class: "tabContainer", id: "tabContainer" }, "mapNotesContainer", "first");
              var _headerTitle = domConstruct.create("div", { class: "mapNoteTitle" }, "tabContainer", "first");
              var _mapNoteListContainer = domConstruct.create("div", { class: "mapNoteListContainer" }, "mapNotesContainer", "last");
              //If mapnotes are present
              if (_self.mapNotesLayer.length > 0) {
                  _self.createMapnoteList(_self.mapNotesLayer);
                  html.set(_headerTitle, i18n.viewer.buttons.mapnote);
                  domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.mapNoteTitle);
                  var titleGroup = new TitleGroup({ title: i18n.viewer.buttons.mapnote });
                  _mapNoteListContainer.appendChild(titleGroup.domNode);
                  array.forEach(_self.mapNotesLayer, function (mapNote, i) {
                      array.forEach(mapNote.featureCollection.layers, function (mapNoteLayer, j) {
                          var _mapNoteFeature = mapNoteLayer.layerObject;
                          // Setting title and description for each mapnote
                          array.forEach(mapNoteLayer.featureSet.features, function (item, k) {
                              var _titlePane = new TitlePane({ title: item.attributes.TITLE, content: item.attributes.DESCRIPTION, open: false });
                              _titlePane.id = item.attributes.TITLE + item.attributes.OBJECTID;
                              if (_titlePane.content == undefined) {
                                  _titlePane.setContent(i18n.viewer.settings.descriptionUnavailable);
                              }
                              _self.mapNotesList.push(_titlePane);
                              titleGroup.domNode.appendChild(_titlePane.domNode);
                              domClass.add(_titlePane.titleNode, "titleNode");
                              domClass.add(_titlePane.hideNode, "contentNode");
                              domClass.add(_titlePane.domNode, "bottomBorder");
                              domClass.add(_titlePane.containerNode, "descriptionNode");
                              _titlePane.titleBarNode.onclick = function () {
                                  array.forEach(_self.mapNotesList, function (list) {
                                      if (domClass.contains(list.titleNode, "listExpand")) {
                                          domClass.replace(list.titleNode, "listCollapse", "listExpand");
                                          domClass.add(list.titleNode, "listCollapse");
                                      }
                                  });
                                  if (_titlePane.open) {
                                      domClass.add(_titlePane.titleNode, "listExpand");
                                      var geometryType = mapNoteLayer.featureSet.geometryType;
                                      switch (geometryType) {
                                          case "esriGeometryPolygon":
                                              _self.options.map.centerAndZoom(mapNoteLayer.layerObject.graphics[k].geometry.getExtent().getCenter(), _self.options.zoomLevel);
                                              break;
                                          case "esriGeometryPolyline":
                                              var anchorPointIndex = Math.floor(mapNoteLayer.layerObject.graphics[k].geometry.paths[0].length / 2);
                                              var point = new Point(mapNoteLayer.layerObject.graphics[k].geometry.paths[0][anchorPointIndex], _self.options.map.spatialReference);
                                              _self.options.map.centerAndZoom(point, _self.options.zoomLevel);
                                              break;
                                          default:
                                              _self.options.map.centerAndZoom(item.geometry, _self.options.zoomLevel);
                                      }
                                      _self.showMapnoteDescription(mapNoteLayer, k);
                                  } else {
                                      _self.hideMapnoteTooltip();
                                      domClass.add(_titlePane.titleNode, "listCollapse");
                                  }
                              }
                          });
                          _mapNoteFeature.onClick = function (evt) {
                              _self.showInfoWindow = false;
                              on(_self.options.map.infoWindow, "show", function () {
                                  if (!_self.showInfoWindow) {
                                      _self.options.map.infoWindow.hide();
                                  }
                              });
                              var _geometryType = mapNoteLayer.featureSet.geometryType;
                              _self.showTooltip(evt, _geometryType);                              
                          }
                      });
                  });
              }
              //If mapnotes are unavailable bookmarks panel will be created
              else if (_self.options.itemInfo.itemData.bookmarks) {
                  html.set(_headerTitle, i18n.viewer.buttons.bookmarks);
                  domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.bookmarksTitle);
                  _self.createBookmarkList(_self.options.itemInfo.itemData.bookmarks, _mapNoteListContainer);
              }
              //If both, mapnotes and bookmarks are unavailable, destroy button
              else {
                  domConstruct.destroy("mapNotesButton");
              }
          },
          createMapnoteList: function (mapNoteLayers) {
              var _self = this;
              _self.mapNotesLayer = mapNoteLayers;
          },
          showTooltip: function (evt, _geometryType) {
              var _self = this;
                              switch (_geometryType) {
                                  case "esriGeometryPolygon":
                                      _self.options.map.centerAt(evt.graphic.geometry.getExtent().getCenter());
                                      break;
                                  case "esriGeometryPolyline":
                                      var anchorPointIndex = Math.floor(evt.graphic.geometry.paths[0].length / 2);
                                      var point = new Point(evt.graphic.geometry.paths[0][anchorPointIndex][0], evt.graphic.geometry.paths[0][anchorPointIndex][1], _self.options.map.spatialReference);
                                      _self.options.map.centerAt(point);
                                      break;
                                  default:
                                      _self.options.map.centerAt(evt.graphic.geometry);
                              }
                              setTimeout(function () {
                  _self.createTooltip(evt.graphic.attributes.TITLE);
                              }, 0);
                              _self.updateMapNoteTitle(evt);
                              _self.showMapnotePanel();
          },

          createBookmarkList: function (bookmarkList, listContainer) {
              var _self = this;
              array.forEach(bookmarkList, function (content, index) {
                  var _bookmark = domConstruct.create("div", { class: "bookmarkList bottomBorder", innerHTML: content.name }, listContainer, "last");
                      var _newExtent = new Extent(content.extent);
                      on(_bookmark, 'click', function (evt) {
                          _self.options.map.setExtent(_newExtent);
                      });
                  });
          },
          //Open description panel in the map note list
          showMapnoteDescription: function (mapNoteLayer, k) {
              var _self = this;
              if (_self.options.map.infoWindow.isShowing) {
                  _self.options.map.infoWindow.hide();
              }
              _self.hideMapnoteTooltip();
              _self.createTooltip(mapNoteLayer.layerObject.graphics[k].attributes.TITLE);
          },
          //Close description panel in the map note list
          hideMapnoteDescription: function () {
              var _self = this;
              array.some(_self.mapNotesList, function (list) {
                  if (list.open) {
                      list.set('open', false);
                      domClass.replace(list.titleNode, "listCollapse", "listExpand");
                      return true;
                  }
              });
          },
          // Update (highlight) title in the map note list
          updateMapNoteTitle: function (mapNote) {
              var _self = this;
              _self.hideMapnoteDescription();
              _self.hideMapnoteTooltip();
              array.some(_self.mapNotesList, function (list) {
                  var graphicID = mapNote.graphic.attributes.TITLE + mapNote.graphic.attributes.OBJECTID;
                  if (list.id == graphicID) {
                      list.set('open', true);
                      domClass.add(list.titleNode, "listExpand");
                      query('.mapNoteListContainer')[0].scrollTop = list.domNode.offsetTop - 37;
                      return true;
                  }
              });
          },
          // Create mapnote tooltip and set the position on the map
          createTooltip: function (title) {
              var _self = this;
              var anchorPoint = _self.options.map.toScreen(_self.options.map.extent.getCenter());
              var dialog = new TooltipDialog({
                  id: "toolTipDialog",
                  class: "claro",
                  content: '<div style="display: inline-block;"><span style="color: #fff;">' + title + '</span><div class="toolTipCloseButton"></span></div>',
                  style: "position: absolute;"
              });
              dijit.place.at(dialog.domNode, { x: anchorPoint.x, y: anchorPoint.y }, ["TL", "BL", "TR", "BR"], { x: 15, y: domGeom.getMarginBox(dom.byId('topMenuBar')).h - 15 });
              on(query('.toolTipCloseButton')[0], "click", function () {
                  _self.hideMapnoteTooltip();
                  _self.hideMapnoteDescription();
              });
          },
          //Hide map note tooltip
          hideMapnoteTooltip: function () {
              if (dijit.byId('toolTipDialog')) {
                  dijit.byId('toolTipDialog').destroy();
              }
          },
          //Show/hide left panel
          toggleLeftPanel: function () {
              var _self = this;
              if (domClass.contains("mapNotesContainer", "showMapNotesContainer")) {
                  _self.hideMapnotePanel();
              } else {
                  _self.showMapnotePanel();
              }
          },
          //Show map note panel and slide zoom slider and scalebar to the right
          showMapnotePanel: function () {
              if (domClass.contains("mapNotesContainer", "hideMapNotesContainer")) {
                  domClass.replace("mapNotesContainer", "showMapNotesContainer", "hideMapNotesContainer");
                  domClass.replace("zoomSlider", "shiftRight", "shiftLeft");
                  domClass.replace(query('.esriScalebar')[0], "scalebarShiftRight", "scalebarShiftLeft");
              } else {
                  domClass.add("mapNotesContainer", ["showMapNotesContainer", "transition"]);
                  domClass.add("zoomSlider", ["shiftRight", "transition"]);
                  domClass.add(query('.esriScalebar')[0], ["scalebarShiftRight", "transition"]);
              }
          },
          //Hide map note panel and slide zoom slider and scalebar to the left
          hideMapnotePanel: function () {
              if (domClass.contains("mapNotesContainer", "showMapNotesContainer")) {
              domClass.replace("mapNotesContainer", "hideMapNotesContainer", "showMapNotesContainer");
              domClass.replace("zoomSlider", "shiftLeft", "shiftRight");
              domClass.replace(query('.esriScalebar')[0], "scalebarShiftLeft", "scalebarShiftRight");
              domClass.add(query('.esriScalebar')[0], ["scalebarShiftLeft", "transition"]);
              }
          }
      });
      return Widget;
  });