define([
    "dojo/_base/declare",
    "dojo/_base/connect",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom-geometry",
    "dojo/io-query",
    "esri/InfoTemplate",
    "esri/layers/FeatureLayer",
    "esri/tasks/QueryTask",
    "esri/geometry/Extent",
    "esri/geometry/mathUtils",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/Point",
    "esri/request",
    "esri/graphic",
    "esri/symbols/PictureMarkerSymbol",
    "dojo/date/locale"
],
function (declare, connect, arr, lang, event, domGeom, ioQuery, InfoTemplate, FeatureLayer, QueryTask, Extent, mathUtils, webMercatorUtils, Point, esriRequest, Graphic, PictureMarkerSymbol, locale) {
    var Widget = declare("modules.panoramio", null, {
        constructor: function (options) {
            var _self = this;
            this.options = {
                autopage: true,
                maxpage: 2,
                limit: 100,
                title: '',
                id: 'panoramio',
                datePattern: "MMM d, yyyy",
                timePattern: "h:mma",
                searchTerm: '',
                symbolUrl: '',
                symbolHeight: 22.5,
                symbolWidth: 18.75
            };
            declare.safeMixin(this.options, options);
            if (this.options.map === null) {
                throw 'Reference to esri.Map object required';
            }
            if (location.protocol === "https:") {
                this.baseurl = "https://www.panoramio.com/map/get_panoramas.php";
            } else {
                this.baseurl = "http://www.panoramio.com/map/get_panoramas.php";
            }
            this.featureCollection = {
                layerDefinition: {
                    "geometryType": "esriGeometryPoint",
                    "drawingInfo": {
                        "renderer": {
                            "type": "simple",
                            "symbol": {
                                "type": "esriPMS",
                                "url": this.options.symbolUrl,
                                "contentType": "image/" + this.options.symbolUrl.substring(this.options.symbolUrl.lastIndexOf(".") + 1),
                                "width": this.options.symbolWidth,
                                "height": this.options.symbolHeight
                            }
                        }
                    },
                    "fields": [{
                        "name": "OBJECTID",
                        "type": "esriFieldTypeOID"
                    }, {
                        "name": "smType",
                        "type": "esriFieldTypeString",
                        "alias": "smType",
                        "length": 100
                    }, {
                        "name": "id",
                        "type": "esriFieldTypeString",
                        "alias": "photo_id",
                        "length": 100
                    }, {
                        "name": "owner_name",
                        "type": "esriFieldTypeString",
                        "alias": "User",
                        "length": 100
                    }, {
                        "name": "latitude",
                        "type": "esriFieldTypeDouble",
                        "alias": "latitude",
                        "length": 1073741822
                    }, {
                        "name": "longitude",
                        "type": "esriFieldTypeDouble",
                        "alias": "longitude",
                        "length": 1073741822
                    }, {
                        "name": "photo_title",
                        "type": "esriFieldTypeString",
                        "alias": "Title",
                        "length": 1073741822
                    }, {
                        "name": "photo_url",
                        "type": "esriFieldTypeString",
                        "alias": "URL",
                        "length": 1073741822
                    }, {
                        "name": "photo_file_url",
                        "type": "esriFieldTypeString",
                        "alias": "Photo URL",
                        "length": 1073741822
                    }, {
                        "name": "width",
                        "type": "esriFieldTypeString",
                        "alias": "width",
                        "length": 1073741822
                    }, {
                        "name": "height",
                        "type": "esriFieldTypeString",
                        "alias": "height",
                        "length": 1073741822
                    }, {
                        "name": "upload_date",
                        "type": "esriFieldTypeString",
                        "alias": "upload_date",
                        "length": 1073741822
                    }, {
                        "name": "owner_id",
                        "type": "esriFieldTypeString",
                        "alias": "owner_id",
                        "length": 1073741822
                    }, {
                        "name": "owner_name",
                        "type": "esriFieldTypeString",
                        "alias": "owner_name",
                        "length": 1073741822
                    }, {
                        "name": "owner_url",
                        "type": "esriFieldTypeString",
                        "alias": "owner_url",
                        "length": 1073741822
                    }],
                    "globalIdField": "photo_id",
                    "displayField": "photo_title"
                },
                featureSet: {
                    "features": [],
                    "geometryType": "esriGeometryPoint"
                }
            };
            this.infoTemplate = new InfoTemplate();
            this.infoTemplate.setTitle(function (graphic) {
                return _self.options.title;
            });
            this.infoTemplate.setContent(function (graphic) {
                return _self.getWindowContent(graphic, _self);
            });
            this.featureLayer = new FeatureLayer(this.featureCollection, {
                id: this.options.id,
                outFields: ["*"],
                infoTemplate: this.infoTemplate,
                visible: true
            });
            this.options.map.addLayer(this.featureLayer);
            connect.connect(this.featureLayer, "onClick", lang.hitch(this, function (evt) {
                event.stop(evt);
                var query = new QueryTask();
                query.geometry = this.pointToExtent(this.options.map, evt.mapPoint, this.options.symbolWidth);
                var deferred = this.featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
                this.options.map.infoWindow.setFeatures([deferred]);
                this.options.map.infoWindow.show(evt.mapPoint);
                this.adjustPopupSize(this.options.map);
            }));
            this.stats = {
                geoPoints: 0,
                geoNames: 0,
                noGeo: 0
            };
            this.dataPoints = [];
            this.deferreds = [];
            this.geocoded_ids = {};
            this.loaded = true;
        },
        update: function (options) {
            declare.safeMixin(this.options, options);
            this.constructQuery(this.options.searchTerm);
        },
        pointToExtent: function (map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference);
        },
        clear: function () {
            // cancel any outstanding requests
            this.query = null;
            arr.forEach(this.deferreds, function (def) {
                def.cancel();
            });
            if (this.deferreds) {
                this.deferreds.length = 0;
            }
            // remove existing Photos
            if (this.options.map.infoWindow.isShowing) {
                this.options.map.infoWindow.hide();
            }
            if (this.featureLayer.graphics.length > 0) {
                this.featureLayer.applyEdits(null, null, this.featureLayer.graphics);
            }
            // clear data
            this.stats = {
                geoPoints: 0,
                noGeo: 0,
                geoNames: 0
            };
            this.dataPoints = [];
            this.geocoded_ids = {};
            this.onClear();
        },
        getStats: function () {
            var x = this.stats;
            x.total = this.stats.geoPoints + this.stats.noGeo + this.stats.geoNames;
            return x;
        },
        // Parse Links
        parseURL: function (text) {
            return text.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function (url) {
                return '<a target="_blank" href="' + url + '">' + url + '</a>';
            });
        },
        getPoints: function () {
            return this.dataPoints;
        },
        show: function () {
            this.featureLayer.setVisibility(true);
        },
        hide: function () {
            this.featureLayer.setVisibility(false);
        },
        setVisibility: function (val) {
            if (val) {
                this.show();
            } else {
                this.hide();
            }
        },
        // Format Date Object
        formatDate: function (dateObj) {
            var _self = this;
            if (dateObj) {
                return locale.format(dateObj, {
                    datePattern: _self.options.timePattern,
                    selector: "date"
                }).toLowerCase() + ' &middot; ' + locale.format(dateObj, {
                    datePattern: _self.options.datePattern,
                    selector: "date"
                });
            }
        },
        adjustPopupSize: function(map) {
            var box = domGeom.getContentBox(map.container);
            var width = 270, height = 300, // defaults
            newWidth = Math.round(box.w * 0.60),             
            newHeight = Math.round(box.h * 0.45);        
            if (newWidth < width) {
                width = newWidth;
            }
            if (newHeight < height) {
                height = newHeight;
            }
            map.infoWindow.resize(width, height);
        },
        getRadius: function () {
            var map = this.options.map;
            var extent = this.options.map.extent;
            var center = extent.getCenter();
            this.maxRadius = 600;
            var radius = Math.min(this.maxRadius, Math.ceil(mathUtils.getLength(Point(extent.xmin, extent.ymin, map.spatialReference), Point(extent.xmax, extent.ymin, map.spatialReference)) * 3.281 / 5280 / 2));
            var dist = (radius) / 2;
            dist = dist * 10;
            dist = (dist * 160.934).toFixed(3);
            dist = parseFloat(dist);
            var minPoint, maxPoint;
            var geoPoint = Point(center.x, center.y, map.spatialReference);
            minPoint = webMercatorUtils.webMercatorToGeographic(Point(geoPoint.x - dist, geoPoint.y - dist, map.spatialReference));
            maxPoint = webMercatorUtils.webMercatorToGeographic(Point(geoPoint.x + dist, geoPoint.y + dist, map.spatialReference));
            return {
                minPoint: minPoint,
                maxPoint: maxPoint
            };
        },
        getWindowContent: function (graphic, _self) {
            var date = locale.parse(graphic.attributes.upload_date, {
                selector: "date",
                datePattern: "d MMMM y"
            });
            var html = '';
            html += '<div class="panoramio">';
            html += '<a tabindex="0" class="prLink" href="' + graphic.attributes.photo_url + '" target="_blank">';
            html += '<img width="' + graphic.attributes.width + '" height="' + graphic.attributes.height + '" src="' + graphic.attributes.photo_file_url + '">';
            html += '</a>';
            html += '<h3 class="title">' + graphic.attributes.photo_title + '</h3>';
            html += '<div class="username"><a tabindex="0" href="' + graphic.attributes.owner_url + '" target="_blank">' + graphic.attributes.owner_name + '</a></div>';
            html += '<div class="date">' + this.formatDate(date) + '</div>';
            html += '</div>';
            return html;
        },
        constructQuery: function (searchValue) {
            var search = lang.trim(searchValue);
            if (search.length === 0) {
                search = "";
            }
            var radius = this.getRadius();
            this.query = {
                minx: radius.minPoint.x,
                miny: radius.minPoint.y,
                maxx: radius.maxPoint.x,
                maxy: radius.maxPoint.y,
                mapFilter: false,
                from: 0,
                to: this.options.limit,
                set: "public",
                size: "small"
            };
            // make the actual API call
            this.pageCount = 1;
            this.sendRequest(this.baseurl + "?" + ioQuery.objectToQuery(this.query));
        },
        sendRequest: function (url) {
            // get the results for each page
            var deferred = esriRequest({
                url: url,
                handleAs: "json",
                timeout: 10000,
                callbackParamName: "callback",
                load: lang.hitch(this, function (data) {
                    if (data.count) {
                        this.mapResults(data);
                        // display results for multiple pages
                        if ((this.options.autopage) && (this.options.maxpage > this.pageCount) && (data.has_more) && (this.query)) {
                            this.pageCount++;
                            this.query.to = this.query.to + this.options.limit;
                            this.query.from = this.query.from + this.options.limit;
                            this.sendRequest(this.baseurl + "?" + ioQuery.objectToQuery(this.query));
                        } else {
                            this.onUpdateEnd();
                        }
                    } else {
                        // No results found, try another search term
                        this.onUpdateEnd();
                    }
                }),
                error: lang.hitch(this, function (e) {
                    if (deferred.canceled) {
                        console.log('Search Cancelled');
                    } else {
                        console.log('Search error' + ": " + e.message.toString());
                    }
                    this.onError(e);
                })
            });
            this.deferreds.push(deferred);
        },
        unbindDef: function (dfd) {
            // if deferred has already finished, remove from deferreds array
            var index = arr.indexOf(this.deferreds, dfd);
            if (index === -1) {
                return; // did not find
            }
            this.deferreds.splice(index, 1);
            if (!this.deferreds.length) {
                return 2; // indicates we received results from all expected deferreds
            }
            return 1; // found and removed
        },
        mapResults: function (j) {
            var _self = this;
            if (j.error) {
                console.log("mapResults error: " + j.error);
                this.onError(j.error);
                return;
            }
            var b = [];
            var k = j.photos;
            arr.forEach(k, lang.hitch(this, function (result) {
                result.smType = this.options.id;
                // eliminate geo photos which we already have on the map
                if (this.geocoded_ids[result.photo_id]) {
                    return;
                }
                this.geocoded_ids[result.photo_id] = true;
                var geoPoint = null;
                if (result.latitude) {
                    var g = [result.latitude, result.longitude];
                    geoPoint = Point(parseFloat(g[1]), parseFloat(g[0]));
                }
                if (geoPoint) {
                    if (isNaN(geoPoint.x) || isNaN(geoPoint.y)) {
                        this.stats.noGeo++;
                    } else {
                        // convert the Point to WebMercator projection
                        var a = new webMercatorUtils.geographicToWebMercator(geoPoint);
                        // make the Point into a Graphic
                        var graphic = new Graphic(a);
                        graphic.setAttributes(result);
                        b.push(graphic);
                        this.dataPoints.push({
                            geometry: {
                                x: a.x,
                                y: a.y
                            },
                            symbol: PictureMarkerSymbol(this.featureCollection.layerDefinition.drawingInfo.renderer.symbol),
                            attributes: result
                        });
                        this.stats.geoPoints++;
                    }
                } else {
                    this.stats.noGeo++;
                }
            }));
            this.featureLayer.applyEdits(b, null, null);
            this.onUpdate();
        },
        onClear: function () {},
        onError: function (info) {
            this.onUpdateEnd();
        },
        onUpdate: function () {},
        onUpdateEnd: function () {
            this.query = null;
        }
    });
    return Widget;
});