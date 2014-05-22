define([
    "dojo/_base/kernel",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/connect",
    "esri/lang",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom",
    "dojo/query",
    "dojo/i18n!./nls/template.js",
    "dojo/fx",
    "dojo/dom-class",
    "dojo/date",
    "dojo/on",
    "dojo/io-query",
    "dojo/date/locale",
    "esri", // We're not directly using anything defined in esri.js but geometry, locator and utils are not AMD. So, the only way to get reference to esri object is through esri module (ie. esri/main)
    "config/commonConfig",
    "dojo/cookie",
    "dojo/json",
    "esri/config",
    "esri/arcgis/utils",
    "esri/tasks/GeometryService",
    "esri/geometry/Extent",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "esri/tasks/QueryTask",
    "esri/tasks/query",
    "esri/urlUtils",
    "esri/geometry",
    "esri/utils"
  ],
  function (dojo, declare, lang, connect, esriLang, arr, lang, event, dom, query, i18n, coreFx, domClass, date, on, ioQuery, locale, esri, templateConfig, cookie, JSON, config, arcgisUtils, GeometryService, Extent, Point, SpatialReference, QueryTask, Query, urlUtils) {
      var Widget = declare("modules.utils", null, {
          constructor: function (options) {
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
          createOptions: function() {
            var _self = this;
            var hasEsri = false,
                geocoders = lang.clone(templateConfig.helperServices.geocode);
              //only use geocoders with a url defined
            geocoders = arr.filter(geocoders, function (geocoder) {
                if (geocoder.url) {
                    return true;
                }
                else{
                    return false;
                }
            });
            arr.forEach(geocoders, function(geocoder, index) {
                if (geocoder && geocoder.url && geocoder.url.indexOf(".arcgis.com/arcgis/rest/services/World/GeocodeServer") > -1) {
                    hasEsri = true;
                    geocoder.name = "Esri World Geocoder";
                    geocoder.outFields = "Match_addr, stAddr, City";
                    geocoder.singleLineFieldName = "SingleLine";
                    geocoder.esri = true;
                    geocoder.placefinding = true;
                }
            });
            //only use geocoders with a singleLineFieldName that allow placefinding
            geocoders = arr.filter(geocoders, function(geocoder) {
                return (esriLang.isDefined(geocoder.singleLineFieldName) && esriLang.isDefined(geocoder.placefinding) && geocoder.placefinding);
            });
            var esriIdx;
            if (hasEsri) {
                for (var i = 0; i < geocoders.length; i++) {
                    if (esriLang.isDefined(geocoders[i].esri) && geocoders[i].esri === true) {
                        esriIdx = i;
                        break;
                    }
                }
            }
            var options = {
                map: _self.options.map,
                theme: 'modernGrey',
                autoComplete:hasEsri
            };
            //If the World geocoder is primary enable auto complete 
            if (hasEsri && esriIdx === 0) {
                options.autoComplete = true;
                options.minCharacters = 0;
                options.maxLocations = 5;
                options.searchDelay = 100;
                options.arcgisGeocoder = geocoders.splice(0, 1)[0]; //geocoders[0];
                if (geocoders.length > 0) {
                    options.geocoders = geocoders;
                }
            } else {
                if(geocoders.length){
                    options.arcgisGeocoder = false;
                    options.geocoders = geocoders;   
                }
                else{
                    options.arcgisGeocoder = true;
                    options.geocoders = null;
                    options.autoComplete = true;
                }
            }
            return options;
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
            document.title = _self.options.itemInfo.item.title;
            var node = dom.byId('mapTitle');
            if (node) {
                node.innerHTML = _self.options.itemInfo.item.title;
                query(node).attr('title', _self.options.itemInfo.item.title);
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
          }

      });
      return Widget;
  });