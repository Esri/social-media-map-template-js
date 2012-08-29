dojo.requireLocalization("esriTemplate", "flickr");
dojo.provide("social.flickr");
dojo.addOnLoad(function () {
    dojo.declare("social.flickr", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        constructor: function (options) {
            this.i18n = dojo.i18n.getLocalization("esriTemplate", "flickr");
            this._map = options.map || null;
            if (this._map === null) {
                throw this.i18n.error.reference;
            }
            var socialInstance = this;
            this.autopage = options.autopage || true;
            this.maxpage = options.maxpage || 2;
            this.limit = 100;
            if (location.protocol === "https:") {
                this.baseurl = "http://api.flickr.com/services/rest/";
            } else {
                this.baseurl = "https://secure.flickr.com/services/rest/";
            }
            this.title = options.title || '';
            this.id = options.id || 'flickr';
            this.searchTerm = options.searchTerm || '';
            this.symbolUrl = options.symbolUrl;
            this.symbolHeight = options.symbolHeight || 22.5;
            this.symbolWidth = options.symbolWidth || 18.75;
            this.popupHeight = options.popupHeight || 300;
            this.popupWidth = options.popupWidth || 400;
            this.dateFrom = options.dateFrom || '';
            this.dateTo = options.dateTo || '';
            this.apiKey = options.apiKey || '';
            this.getWindowContentCallback = options.getWindowContentCallback || false;
            this.onClearFunction = options.onClear || false;
            this.onUpdateEndFunction = options.onUpdateEnd || false;
            this.onSetTitleFunction = options.onSetTitle || false;
            this.distance = options.distance;
            this.featureCollection = {
                layerDefinition: {
                    "geometryType": "esriGeometryPoint",
                    "drawingInfo": {
                        "renderer": {
                            "type": "simple",
                            "symbol": {
                                "type": "esriPMS",
                                "url": this.symbolUrl,
                                "contentType": "image/" + this.symbolUrl.substring(this.symbolUrl.lastIndexOf(".") + 1),
                                "width": this.symbolWidth,
                                "height": this.symbolHeight
                            }
                        }
                    },
                    "fields": [{
                        "name": "OBJECTID",
                        "type": "esriFieldTypeOID"
                    }, {
                        "name": "id",
                        "type": "esriFieldTypeString",
                        "alias": "id",
                        "length": 100
                    }, {
                        "name": "owner",
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
                        "name": "title",
                        "type": "esriFieldTypeString",
                        "alias": "Title",
                        "length": 1073741822
                    }],
                    "globalIdField": "id",
                    "displayField": "title"
                },
                featureSet: {
                    "features": [],
                    "geometryType": "esriGeometryPoint"
                }
            };
            this.infoTemplate = new esri.InfoTemplate();
            this.infoTemplate.setTitle(function (graphic) {
                if (this.onSetTitleFunction && typeof this.onSetTitleFunction === 'function') {
                    return this.onSetTitleFunction(graphic);
                } else {
                    return socialInstance.title;
                }
            });
            this.infoTemplate.setContent(function (graphic) {
                return socialInstance.getWindowContent(graphic, socialInstance);
            });
            this.featureLayer = new esri.layers.FeatureLayer(this.featureCollection, {
                id: this.id,
                outFields: ["*"],
                infoTemplate: this.infoTemplate,
                visible: false
            });
            this._map.addLayer(this.featureLayer);
            dojo.connect(this.featureLayer, "onClick", dojo.hitch(this, function (evt) {
                var query = new esri.tasks.Query();
                query.geometry = this.pointToExtent(this._map, evt.mapPoint, this.symbolWidth);
                var deferred = this.featureLayer.selectFeatures(query, esri.layers.FeatureLayer.SELECTION_NEW);
                this._map.infoWindow.setFeatures([deferred]);
                this._map.infoWindow.show(evt.mapPoint);
                this._map.infoWindow.resize(this.popupWidth, this.popupHeight);
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
            if (options) {
                this.searchTerm = options.searchTerm || this.searchTerm;
                this.distance = options.distance || this.distance;
                this.socialSourceX = options.socialSourceX;
                this.socialSourceY = options.socialSourceY;
                this.dateFrom = options.dateFrom;
                this.dateTo = options.dateTo;
            }
            this.constructQuery(this.searchTerm);
        },
        pointToExtent: function (map, point, toleranceInPixel) {
            var pixelWidth = map.extent.getWidth() / map.width;
            var toleraceInMapCoords = toleranceInPixel * pixelWidth;
            return new esri.geometry.Extent(point.x - toleraceInMapCoords, point.y - toleraceInMapCoords, point.x + toleraceInMapCoords, point.y + toleraceInMapCoords, map.spatialReference);
        },
        clear: function () {
            // cancel any outstanding requests
            this.query = null;
            dojo.forEach(this.deferreds, function (def) {
                def.cancel();
            });
            if (this.deferreds) {
                this.deferreds.length = 0;
            }
            // remove existing Photos  
            if (this._map.infoWindow.isShowing) {
                this._map.infoWindow.hide();
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
            if (dateObj) {
                return dojo.date.locale.format(dateObj, {
                    datePattern: "h:mma",
                    selector: "date"
                }).toLowerCase() + ' &middot; ' + dojo.date.locale.format(dateObj, {
                    datePattern: "d MMM yy",
                    selector: "date"
                });
            }
        },
        getExtent: function () {
            return esri.graphicsExtent(this.featureLayer.graphics);
        },
        getRadius: function () {
            var extent = this.extent || this._map.extent;
            return {
                radius: 0,
                center: extent.getCenter(),
                units: "bbox"
            };
        },
        setSearchExtent: function (extent) {
            this.extent = extent;
        },
        getWindowContent: function (graphic, socialInstance) {
            if (socialInstance.getWindowContentCallback) {
                if (typeof socialInstance.getWindowContentCallback === 'function') {
                    socialInstance.getWindowContentCallback(graphic);
                }
            }
            var date = new Date(parseInt(graphic.attributes.dateupload * 1000, 10));
            var html = '';
            html += '<div class="flContent">';
            html += '<a tabindex="0" class="flImgA" href="' + location.protocol + '//www.flickr.com/photos/' + graphic.attributes.owner + '/' + graphic.attributes.id + '/in/photostream" target="_blank">';
            html += '<img width="' + graphic.attributes.width_s + '" height="' + graphic.attributes.height_s + '" src="' + graphic.attributes.url_s + '">';
            html += '</a>';
            html += '<h3 class="title">' + graphic.attributes.title + '</h3>';
            html += '<div class="username"><a tabindex="0" href="' + location.protocol + '//www.flickr.com/photos/' + graphic.attributes.owner + '/" target="_blank">' + graphic.attributes.ownername + '</a></div>';
            if (graphic.attributes.description._content) {
                html += '<div class="content">' + graphic.attributes.description._content + '</div>';
            }
            html += '<div class="date">' + this.formatDate(date) + '</div>';
            html += '</div>';
            return html;
        },
        constructQuery: function (searchValue) {
            var map = this._map;
            var extent = this.extent || map.extent;
            var search = dojo.trim(searchValue);
            var apiKey = this.apiKey;
            if (search.length === 0) {
                search = "";
            }
            var dist = (this.distance) / 2;
            dist = dist * 10;
            dist = (dist * 160.934).toFixed(3);
            dist = parseFloat(dist);
            var geoPoint;
            // adjust for incoming geoSocialPoints
            if (this.socialSourceX && this.socialSourceY) {
                geoPoint = esri.geometry.geographicToWebMercator(new esri.geometry.Point(this.socialSourceX, this.socialSourceY, map.spatialReference));
                minPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(geoPoint.x - dist, geoPoint.y - dist, map.spatialReference));
                maxPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(geoPoint.x + dist, geoPoint.y + dist, map.spatialReference));
            } else {
                var center = extent.getCenter();
                geoPoint = new esri.geometry.Point(center.x, center.y, map.spatialReference);
                minPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(geoPoint.x - dist, geoPoint.y - dist, map.spatialReference));
                maxPoint = esri.geometry.webMercatorToGeographic(new esri.geometry.Point(geoPoint.x + dist, geoPoint.y + dist, map.spatialReference));
            }
            var startDate = this.dateFrom;
            var endDate = this.dateTo;
            this.query = {
                bbox: minPoint.x + "," + minPoint.y + "," + maxPoint.x + "," + maxPoint.y,
                extras: "description, date_upload, owner_name, geo, url_s",
                per_page: this.limit,
                sort: 'date-posted-desc',
                safe_search: 2,
                tags: search,
                method: "flickr.photos.search",
                api_key: apiKey,
                has_geo: 1,
                page: 1,
                format: "json"
            };
            if (endDate && startDate) {
                this.query.max_taken_date = endDate.valueOf();
                this.query.min_taken_date = startDate.valueOf();
            }
            // make the actual Flickr API call
            this.pageCount = 1;
            this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
        },
        sendRequest: function (url) {
            var flTitle = this.title;
            // get the results from Flickr for each page
            var deferred = esri.request({
                url: url,
                handleAs: "json",
                timeout: 10000,
                callbackParamName: "jsoncallback",
                preventCache: true,
                load: dojo.hitch(this, function (data) {
                    if (data.stat !== 'fail') {
                        if (data.photos.photo.length > 0) {
                            this.mapResults(data);
                            // display results for multiple pages
                            if ((this.autopage) && (this.maxpage > this.pageCount) && (data.photos.page < data.photos.pages) && (this.query)) {
                                this.pageCount++;
                                this.query.page++;
                                this.sendRequest(this.baseurl + "?" + dojo.objectToQuery(this.query));
                            } else {
                                this.onUpdateEnd();
                            }
                        } else {
                            // No results found, try another search term
                            this.onUpdateEnd();
                        }
                    } else {
                        if (data.code === 100) {
                            console.log(data.code + ' - ' + flTitle + ': ' + data.message);
                        }
                        // No results found, try another search term
                        this.onUpdateEnd();
                    }
                }),
                error: dojo.hitch(this, function (e) {
                    if (deferred.canceled) {
                        console.log(this.i18n.error.cancelled);
                    } else {
                        console.log(this.i18n.error.general + ": " + e.message);
                    }
                    this.onError(e);
                })
            });
            this.deferreds.push(deferred);
        },
        unbindDef: function (dfd) {
            // if deferred has already finished, remove from deferreds array
            var index = dojo.indexOf(this.deferreds, dfd);
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
            var id = this.id;
            var socialInstance = this;
            if (j.error) {
                console.log("mapResults error: " + j.error);
                this.onError(j.error);
                return;
            }
            var b = [];
            var k = j.photos.photo;
            dojo.forEach(k, dojo.hitch(this, function (result) {
                result.smType = id;
                // eliminate geo photos which we already have on the map
                if (this.geocoded_ids[result.id]) {
                    return;
                }
                this.geocoded_ids[result.id] = true;
                var geoPoint = null;
                if (result.latitude) {
                    var g = [result.latitude, result.longitude];
                    geoPoint = new esri.geometry.Point(parseFloat(g[1]), parseFloat(g[0]));
                }
                if (geoPoint) {
                    if (isNaN(geoPoint.x) || isNaN(geoPoint.y)) {
                        this.stats.noGeo++;
                    } else {
                        // convert the Point to WebMercator projection
                        var a = new esri.geometry.geographicToWebMercator(geoPoint);
                        // make the Point into a Graphic
                        var graphic = new esri.Graphic(a);
                        graphic.setAttributes(result);
                        b.push(graphic);
                        this.dataPoints.push({
                            x: a.x,
                            y: a.y,
                            symbol: esri.symbol.PictureMarkerSymbol(this.featureCollection.layerDefinition.drawingInfo.renderer.symbol),
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
        onClear: function () {
            if (this.onClearFunction) {
                if (typeof this.onClearFunction === 'function') {
                    this.onClearFunction();
                }
            }
        },
        onError: function (info) {
            this.onUpdateEnd();
        },
        onUpdate: function () {},
        onUpdateEnd: function () {
            this.query = null;
            if (this.onUpdateEndFunction) {
                if (typeof this.onUpdateEndFunction === 'function') {
                    this.onUpdateEndFunction(this.dataPoints.length);
                }
            }
        }
    }); // end of class declaration
}); // end of addOnLoad