dojo.require("dojo.number");
dojo.provide("modules.ClusterLayer");
dojo.addOnLoad(function () {
    dojo.declare("modules.ClusterLayer", null, {
        // Doc: http://docs.dojocampus.org/dojo/declare#chaining
        "-chains-": {
            constructor: "manual"
        },
        // constructor
        constructor: function (data, options) {
            var instance = this;
            this.data = data;
            // GRID SIZE. 144 so the 72x72 icons won't overlap much
            this.pxgrid = options.pixelsSquare || 144;
            // number of break point ranges
            this.numRangeBreaks = options.numRangeBreaks || 5; // minimum 2.
            // use dynamic ranges. If off, uses static range values.
            this.useDynamicRanges = options.useDynamicRanges || true;
            // minimum graphic size in points
            this.minDynamicGraphicSize = options.minDynamicGraphicSize || 24; // 32 x 32
            // maximum grahpic size in points
            this.maxDynamicGraphicSize = options.maxDynamicGraphicSize || 54; // 72 x 72
            // offset from corners of grid
            this.cornerOffset = options.cornerOffset || 15;
            // default text color
            this.clusterTextColor = options.clusterTextColor || [255, 255, 255];
            // text size
            this.clusterTextSize = options.clusterTextSize || "12px";
            // text style
            this.clusterTextStyle = esri.symbol.Font.STYLE_NORMAL;
            // text variant
            this.clusterTextVariant = esri.symbol.Font.VARIANT_NORMAL;
            // text weight
            this.clusterTextWeight = esri.symbol.Font.WEIGHT_NORMAL;
            // text font family
            this.clusterTextFamily = options.clusterTextFamily || "Arial, Helvetica, sans-serif";
            // default static ranges variable
            this.staticRanges = options.staticRanges || [
            // 0
            {
                min: 2,
                max: 5,
                width: 24,
                height: 24,
                textrgb: [255, 255, 255]
            },
            // 1
            {
                min: 6,
                max: 25,
                width: 39,
                height: 39,
                textrgb: [255, 255, 255]
            },
            // 2
            {
                min: 26,
                max: 999,
                width: 54,
                height: 54,
                textrgb: [255, 255, 255]
            }];
            // break point pattern variable
            this.pattern = [];
            // map
            this._map = options.map;
            // graphics
            this.graphics = new esri.layers.GraphicsLayer({
                id: "ClusterGraphicsLayer"
            });
            // if loaded
            if (this._map.loaded) {
                // add graphics layer
                this._map.addLayer(this.graphics);
            } else {
                // onload
                dojo.connect(this._map, "onLoad", dojo.hitch(this, function () {
                    // add graphics layer
                    this._map.addLayer(this.graphics);
                }));
            }
            // set global max
            this.globalMax = true;
            // regrid connect
            dojo.connect(this._map, "onZoomEnd", this, this.regrid);
            // calculate break points
            this.setClusterBreaks();
            // draw
            this.draw();
            // set loaded
            this.loaded = true;
            // default cluster image
            this.clusterImage = options.clusterImage || '/images/map/cluster72x72.png';
            // cluster hover image
            this.clusterHoverImage = options.clusterHoverImage || '/images/map/clusterHover72x72.png';
            // cluster hover            
            dojo.connect(this.graphics, "onMouseOver", function (evt) {
                if (evt.graphic.attributes.parent) {
                    evt.graphic = evt.graphic.attributes.parent;
                }
                var symbol = evt.graphic.symbol;
                if (symbol.url === instance.clusterImage) {
                    symbol.url = instance.clusterHoverImage;
                    evt.graphic.setSymbol(symbol);
                }
            });
            dojo.connect(this.graphics, "onMouseOut", function (evt) {
                var symbol = evt.graphic.symbol;
                if (symbol.url === instance.clusterHoverImage) {
                    symbol.url = instance.clusterImage;
                    evt.graphic.setSymbol(symbol);
                }
            });
        },
        setOpacity: function (opacity) {
            if (this.opacity !== opacity) {
                this.onOpacityChange(this.opacity = opacity);
            }
        },
        regrid: function () {
            this.setData(this.lastDataset);
        },
        // Set Data
        setData: function (dataPoints) {
            this.lastDataset = dataPoints;
            var clusteredData = {};
            var gridSquaresWide = (parseInt(dojo.coords(this._map.id).w, 10)) / (parseInt(this.pxgrid, 10));
            var gridSquareDivisor = (this._map.extent.xmax - this._map.extent.xmin) / gridSquaresWide;
            clusteredData.gridsquare = gridSquareDivisor;
            dojo.forEach(dataPoints, function (geoPoint) {
                var geoKey = Math.round(geoPoint.y / gridSquareDivisor) + "|" + Math.round(geoPoint.x / gridSquareDivisor);
                if (clusteredData[geoKey]) {
                    clusteredData[geoKey].count += 1;
                    clusteredData[geoKey].avgx += ((geoPoint.x - clusteredData[geoKey].avgx) / clusteredData[geoKey].count);
                    clusteredData[geoKey].avgy += ((geoPoint.y - clusteredData[geoKey].avgy) / clusteredData[geoKey].count);
                } else {
                    clusteredData[geoKey] = {
                        count: 1,
                        avgx: geoPoint.x,
                        avgy: geoPoint.y,
                        symbol: geoPoint.symbol,
                        attributes: geoPoint.attributes
                    };
                }
            });
            this.data = {
                data: clusteredData,
                noDataValue: [0]
            };
            clusteredData = {};
            this.setClusterBreaks();
            this.draw();
        },
        clear: function () {
            this.graphics.clear();
        },
        getRange: function () {
            var data = this.data;
            if (!data) {
                return;
            }
            var dataArray = data.data,
                noDataValue = data.noDataValue[0];
            var maxValue = 0;
            var minValue = 0;
            var map = this._map;
            var key;
            for (key in dataArray) {
                if (dataArray.hasOwnProperty(key)) {
                    var val = dataArray[key];
                    if (val !== noDataValue) {
                        var onMapPix;
                        if (!this.globalMax) {
                            if (key.split("|").length === 4) {
                                onMapPix = map.toScreen(esri.geometry.Point(((parseFloat(key.split("|")[0], 10) + parseFloat(key.split("|")[1], 10)) * dataArray.gridsquare / 2), ((parseFloat(key.split("|")[2], 10) + parseFloat(key.split("|")[3], 10)) * dataArray.gridsquare / 2), map.spatialReference));
                            } else if (key.split("|").length === 2) {
                                onMapPix = map.toScreen(esri.geometry.Point(key.split("|")[1] * dataArray.gridsquare / 2, key.split("|")[0] * dataArray.gridsquare / 2), map.spatialReference);
                            }
                            if (onMapPix) {
                                if (val > maxValue) {
                                    maxValue = val;
                                }
                                if (val < minValue) {
                                    minValue = val;
                                }
                            }
                        } else {
                            if (val > maxValue) {
                                maxValue = val;
                            }
                            if (val < minValue) {
                                minValue = val;
                            }
                        }
                    }
                }
            }
            return {
                min: minValue,
                max: maxValue
            };
        },
        setVisibility: function (val) {
            this.graphics.setVisibility(val);
        },
        setClusterBreaks: function () {
            // clear thiz
            this.clear();
            // No date
            if (!this.data) {
                return;
            }
            // data
            var data = this.data,
                dataArray = data.data;
            // default variables
            var clusterNums = [];
            var breaks = 0;
            var graphicBreaks = 0;
            var minNum = 0;
            var maxNum = 0;
            var minGraphic = this.minDynamicGraphicSize;
            var maxGraphic = this.maxDynamicGraphicSize;
            // set pattern for singles with no clusters
            this.pattern[0] = {};
            this.pattern[0].min = 0;
            this.pattern[0].max = 1;
            var key;
            for (key in dataArray) {
                if (dataArray.hasOwnProperty(key)) {
                    var breakCount;
                    // cluster size
                    var count = parseInt(dataArray[key].count, 10);
                    // if dynamic ranges
                    if (this.useDynamicRanges) {
                        // set break count
                        breakCount = this.numRangeBreaks;
                        if (breakCount < 2) {
                            breakCount = 2;
                        }
                    } else {
                        // set static break count
                        breakCount = this.staticRanges.length;
                    }
                    // if cluster
                    if (count && count > 1) {
                        // cluster count array
                        clusterNums.push(count);
                        // cluster min/max
                        minNum = Math.min.apply(Math, clusterNums);
                        maxNum = Math.max.apply(Math, clusterNums);
                        // calculate breaks
                        breaks = Math.ceil((maxNum - minNum) / breakCount);
                        graphicBreaks = Math.ceil((maxGraphic - minGraphic) / (breakCount - 1));
                        // dynamic breaks
                        if (this.useDynamicRanges) {
                            // set patterns for clusters
                            for (i = 1; i <= breakCount; i++) {
                                // set common
                                this.pattern[i] = {};
                                this.pattern[i].symbol = {
                                    "type": "esriPMS",
                                    "url": this.clusterImage,
                                    "contentType": "image/" + this.clusterImage.substring(this.clusterImage.lastIndexOf(".") + 1)
                                };
                                // if first
                                if (i === 1) {
                                    this.pattern[i].min = minNum;
                                    this.pattern[i].max = (breaks);
                                    this.pattern[i].symbol.width = minGraphic;
                                    this.pattern[i].symbol.height = minGraphic;
                                }
                                // if last
                                else if (i === breakCount) {
                                    this.pattern[i].min = (breaks * (i - 1)) + 1;
                                    this.pattern[i].max = maxNum;
                                    this.pattern[i].symbol.width = maxGraphic;
                                    this.pattern[i].symbol.height = maxGraphic;
                                }
                                // otherwise
                                else {
                                    this.pattern[i].min = (breaks * (i - 1)) + 1;
                                    this.pattern[i].max = (breaks * i);
                                    this.pattern[i].symbol.width = minGraphic + ((i - 1) * graphicBreaks);
                                    this.pattern[i].symbol.height = minGraphic + ((i - 1) * graphicBreaks);
                                }
                            }
                        }
                        // static breaks
                        else {
                            // for each static breakpoint
                            for (i = 0; i < breakCount; i++) {
                                // breakpoint var
                                this.pattern[i + 1] = {};
                                // set symbol
                                this.pattern[i + 1].symbol = {
                                    "type": "esriPMS",
                                    // image
                                    "url": this.clusterImage,
                                    // image type
                                    "contentType": "image/" + this.clusterImage.substring(this.clusterImage.lastIndexOf(".") + 1),
                                    // width
                                    "width": this.staticRanges[i].width,
                                    // height
                                    "height": this.staticRanges[i].height
                                };
                                // min and max
                                this.pattern[i + 1].min = this.staticRanges[i].min;
                                this.pattern[i + 1].max = this.staticRanges[i].max;
                            }
                        }
                    }
                }
            }
        },
        // Draw
        draw: function () {
            // clear
            this.clear();
            // if no data, commence zombie apocalypse
            if (!this.data) {
                // die
                return;
            }
            // data var
            var data = this.data,
                dataArray = data.data;
            // Statistics
            var range = this.getRange();
            var minValue = range.min,
                maxValue = range.max;
            if ((minValue === maxValue) && (maxValue === 0)) {
                return;
            }
            var map = this._map;
            var key;
            // Draw
            for (key in dataArray) {
                // if key
                if (dataArray.hasOwnProperty(key) && key.indexOf("|") !== -1) {
                    // extent
                    var gridExtent = new esri.geometry.Extent({
                        "xmin": dataArray.gridsquare * key.split("|")[1] - dataArray.gridsquare / 2,
                        "ymin": dataArray.gridsquare * key.split("|")[0] - dataArray.gridsquare / 2,
                        "xmax": dataArray.gridsquare * key.split("|")[1] + dataArray.gridsquare / 2,
                        "ymax": dataArray.gridsquare * key.split("|")[0] + dataArray.gridsquare / 2,
                        "spatialReference": {
                            "wkid": 102113
                        }
                    });
                    // lat/long
                    var centerLNG = dataArray.gridsquare * key.split("|")[1];
                    var centerLAT = dataArray.gridsquare * key.split("|")[0];
                    // calculate square
                    if ((centerLNG + dataArray.gridsquare / 2) - dataArray[key].avgx <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgx = centerLNG + dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    if (dataArray[key].avgx - (centerLNG - dataArray.gridsquare / 2) <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgx = centerLNG - dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    if ((centerLAT + dataArray.gridsquare / 2) - dataArray[key].avgy <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgy = centerLAT + dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    if (dataArray[key].avgy - (centerLAT - dataArray.gridsquare / 2) <= this.cornerOffset / this.pxgrid * dataArray.gridsquare) {
                        dataArray[key].avgy = centerLAT - dataArray.gridsquare * (this.pxgrid * 0.4) / this.pxgrid;
                    }
                    // point
                    var onMapPix = new esri.geometry.Point(dataArray[key].avgx, dataArray[key].avgy, map.spatialReference);
                    // point count
                    var pointCount = dataArray[key].count;
                    // symbol
                    var symb;
                    // default text color
                    var textcolor = this.clusterTextColor;
                    var breakCount;
                    // if dynamic ranges
                    if (this.useDynamicRanges) {
                        // set break count
                        breakCount = this.numRangeBreaks;
                        if (breakCount < 2) {
                            breakCount = 2;
                        }
                    } else {
                        // set static break count
                        breakCount = this.staticRanges.length;
                    }
                    // if 1 point cluster
                    if (pointCount <= this.pattern[0].max) {
                        // set extent
                        dataArray[key].attributes.extent = gridExtent;
                        // add symbol
                        this.graphics.add(new esri.Graphic(onMapPix, dataArray[key].symbol, dataArray[key].attributes));
                    } else {
                        // each break
                        for (i = 1; i <= breakCount; i++) {
                            // if point count is less than max
                            if (pointCount <= this.pattern[i].max) {
                                // if text color is set
                                if (this.pattern[i].textrgb) {
                                    // set text color
                                    textcolor = this.pattern[i].textrgb;
                                }
                                // create symbol
                                symb = this.pattern[i].symbol;
                                // end
                                break;
                            }
                        }
                        var graphic = new esri.Graphic(onMapPix, new esri.symbol.PictureMarkerSymbol(symb), {
                            extent: gridExtent
                        });
                        // add graphic symbol
                        this.graphics.add(graphic);
                        // text graphic
                        var textGraphic = new esri.Graphic(onMapPix, new esri.symbol.TextSymbol(dojo.number.format(pointCount), new esri.symbol.Font(this.clusterTextSize, this.clusterTextStyle, this.clusterTextVariant, this.clusterTextWeight, this.clusterTextFamily), new dojo.Color(textcolor)).setOffset(0, - 4), {
                            extent: gridExtent,
                            parent: graphic
                        });
                        // add graphic text
                        this.graphics.add(textGraphic);
                    }
                }
            }
            // clear data array
            dataArray = null;
        }
    }); // end of class declaration
}); // end of addOnLoad