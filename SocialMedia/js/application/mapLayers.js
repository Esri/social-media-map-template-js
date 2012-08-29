// Folder Layer CheckBoxes
function toggleChecked(obj) {
    var list = dojo.query(obj).parent('li');
    if (dojo.hasClass(list[0], "checked")) {
        list.removeClass('cLoading');
    } else {
        list.addClass('cLoading');
    }
    dojo.toggleClass(list[0], 'checked');
}

// removes layer from list of visible layers
function removeFromActiveLayers(layerid) {
    var theIndex = getActiveLayerIndex(layerid);
    for (theIndex; theIndex > -1; theIndex = getActiveLayerIndex(layerid)) {
        configOptions.layers.splice(theIndex, 1);
    }
    setSharing();
}

// Build a list of layers for the incoming web map.
function buildLayersList(layers) {
    //layers  arg is  response.itemInfo.itemData.operationalLayers;
    var layerInfos = [];
    dojo.forEach(layers, function (mapLayer, index) {
        var layerInfo = {};
        if (mapLayer.featureCollection && mapLayer.type !== "CSV") {
            if (mapLayer.featureCollection.showLegend === true) {
                dojo.forEach(mapLayer.featureCollection.layers, function (fcMapLayer) {
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
                var hideLayers = dojo.map(dojo.filter(mapLayer.layers, function (lyr) {
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
}

// CHANGE ACTIVE LAYERS
function getActiveLayerIndex(layerid) {
    var indexNum = dojo.indexOf(configOptions.layers, layerid);
    return indexNum;
}

// adds layer to list of visible layers
function addToActiveLayers(layerid) {
    var theIndex = getActiveLayerIndex(layerid);
    if (theIndex === -1) {
        configOptions.layers.push(layerid);
    }
    setSharing();
}

// LAYERS UI
function configureLayerUI() {
    dojo.query(document).delegate("#layersList li:not(.cLoading) .toggle", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleChecked(this);
            var changeMapVal = dojo.query(this).parent('li').attr('data-layer')[0];
            var splitVals = changeMapVal.split(',');
            for (var i = 0; i < splitVals.length; i++) {
                toggleMapLayer(splitVals[i]);
            }
            hideLoading(dojo.query('#layersList li[data-layer*="' + changeMapVal + '"]'));
        }
    });

    // ToolTips
    dojo.query(document).delegate(".listMenu ul li .cBinfo", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            var toolTip = dojo.query(this).parent('li').children('.infoHidden');
            dojo.query('.listMenu ul li .cBinfo').removeClass('cBinfoAnim');
            if (toolTip[0]) {
                if (toolTip.style('display')[0] === 'none') {
                    dojo.query('.infoHidden').style('display', 'none');
                    dojo.query('.listMenu ul li').removeClass('active');
                    dojo.query(this).parent('li').addClass('active');
                    toolTip.style('display', 'block');
                    dojo.query(this).addClass('cBinfoAnim');
                } else {
                    toolTip.style('display', 'none');
                    dojo.query(this).parent('li').removeClass('active');
                }
            }
        }
    });

    // CONFIG SETTINGS
    dojo.query(document).delegate(".listMenu ul li .cBconfig", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            hideLayerInfo();
            dojo.query('.listMenu ul li .cBconfig').removeClass('cBconfigAnim');
            var parentLi = dojo.query(this).parent('li').attr('data-layer')[0];
            var panelObj = dojo.query('#settingsDialog .cfgPanel[data-layer=' + parentLi + ']');
            var panelBtn = dojo.query('#cfgMenu .mapButton[data-layer=' + parentLi + ']');
            dojo.query('#cfgMenu span').removeClass('buttonSelected');
            panelBtn.addClass('buttonSelected');
            configOptions.customPopup.hide();
            dojo.query(this).addClass('cBconfigAnim');
            dojo.query("#settingsDialog .cfgPanel").style('display', 'none');
            panelObj.style('display', 'block');
            dojo.query('#collapseIcon').removeClass('iconDown');
            dojo.query('#settingsDialog .dijitDialogPaneContent').style('display', 'block');
            if (!configOptions.settingsDialog.get('open')) {
                configOptions.settingsDialog.show();
            } else if (configOptions.currentSettingsTab === parentLi) {
                configOptions.settingsDialog.hide();
            }
            configOptions.currentSettingsTab = parentLi;
        }
    });
}

// TOGGLE MAP LAYER ON AND OFF
function toggleMapLayer(layerid) {
    var layer = map.getLayer(layerid);
    if (layer) {
        //if visible hide the layer
        if (layer.visible === true) {
            layer.hide();
            removeFromActiveLayers(layerid);
        }
        //otherwise show and add to layers
        else {
            layer.show();
            addToActiveLayers(layerid);
        }
    }
}

// CREATE LAYER ITEMS
function configureLayers() {
    // if operational layers
    if (configOptions.itemLayers) {
        // if operational layers of at least 1
        if (configOptions.itemLayers.length > 0) {
            // build layers
            configOptions.layerInfos = buildLayersList(configOptions.itemLayers);
            if (configOptions.showLegendMenu) {
                // Build Legend
                if (configOptions.layerInfos.length > 0) {
                    var legendDijit = new esri.dijit.Legend({
                        map: map,
                        layerInfos: configOptions.layerInfos
                    }, "legendContent");
                    legendDijit.startup();
                } else {
                    var legendContentNode = dojo.byId('legendContent');
                    if (legendContentNode) {
                        legendContentNode.innerHTML = i18n.viewer.errors.noLegend;
                    }
                }
            }
            // ADD URL
            var node = dojo.byId('layersMenu');
            if (node) {
                node.innerHTML = '<ul class="zebraStripes" id="layersList"></ul>';
            }
            // EACH LAYER
            var layerClass;
            // URL layers variable
            var urlLayers = false;
            // if visible layers set in URL
            if (urlObject.query.hasOwnProperty('layers')) {
                urlLayers = true;
            }
            // for each layer
            for (var i = 0; i < configOptions.itemLayers.length; i++) {
                // GENERATE LAYER HTML
                var html = '';
                // if layer object
                if (configOptions.itemLayers[i]) {
                    // default layer class
                    layerClass = 'layer';
                    // layer ids
                    var dataLayers = '';
                    // key variable
                    var key;
                    if (configOptions.itemLayers[i].featureCollection) {
                        // if feature collection layers
                        if (configOptions.itemLayers[i].featureCollection.layers) {
                            // for each feature collection
                            for (var k = 0; k < configOptions.itemLayers[i].featureCollection.layers.length; k++) {
                                // if URL layers set
                                if (urlLayers) {
                                    // set layer visibility to false
                                    configOptions.itemLayers[i].featureCollection.layers[k].visibility = false;
                                    map.getLayer(configOptions.itemLayers[i].featureCollection.layers[k].id).hide();
                                    // for each visible layer array item
                                    for (key in configOptions.layers) {
                                        // if current layer ID matches visible layer item
                                        if (configOptions.layers[key] === configOptions.itemLayers[i].featureCollection.layers[k].id) {
                                            // set visibility to true
                                            configOptions.itemLayers[i].featureCollection.layers[k].visibility = true;
                                            map.getLayer(configOptions.itemLayers[i].featureCollection.layers[k].id).show();
                                        }
                                    }
                                }
                                // if layer visibility is true
                                if (configOptions.itemLayers[i].featureCollection.layers[k].visibility === true) {
                                    // set layer class to checked
                                    layerClass = 'layer checked';
                                    // add to active layers array
                                    addToActiveLayers(configOptions.itemLayers[i].featureCollection.layers[k].id);
                                }
                                // data layer attrubute
                                dataLayers += configOptions.itemLayers[i].featureCollection.layers[k].id;
                                // if not last feature collection add comma for splitting
                                if (k !== (configOptions.itemLayers[i].featureCollection.layers.length - 1)) {
                                    dataLayers += ",";
                                }
                            }
                        }
                        // csv
                        else {
                            // if URL layers set
                            if (urlLayers) {
                                map.getLayer(configOptions.itemLayers[i].id).hide();
                                configOptions.itemLayers[i].visibility = false;
                                // for each visible layer array item
                                for (key in configOptions.layers) {
                                    // if current layer ID matches visible layer item
                                    if (configOptions.layers[key] === configOptions.itemLayers[i].id) {
                                        // set visibility to true
                                        configOptions.itemLayers[i].visibility = true;
                                        map.getLayer(configOptions.itemLayers[i].id).show();
                                    }
                                }
                            }
                            // if layer visibility is true
                            if (configOptions.itemLayers[i].visibility === true) {
                                // set layer class to checked
                                layerClass = 'layer checked';
                                // add to active layers array
                                addToActiveLayers(configOptions.itemLayers[i].id);
                            }
                            // data layer attrubute
                            dataLayers += configOptions.itemLayers[i].id;
                        }
                    } else {
                        // if URL layers set
                        if (urlLayers) {
                            configOptions.itemLayers[i].visibility = false;
                            map.getLayer(configOptions.itemLayers[i].id).hide();
                            // for each visible layer array item
                            for (key in configOptions.layers) {
                                // if current layer ID matches visible layer item
                                if (configOptions.layers[key] === configOptions.itemLayers[i].id) {
                                    // set visibility to true
                                    configOptions.itemLayers[i].visibility = true;
                                    map.getLayer(configOptions.itemLayers[i].id).show();
                                }
                            }
                        }
                        // if layer visibility is true
                        if (configOptions.itemLayers[i].visibility === true) {
                            // set layer class to checked
                            layerClass = 'layer checked';
                            // add to active layers array
                            addToActiveLayers(configOptions.itemLayers[i].id);
                        }
                        // data layer attrubute
                        dataLayers += configOptions.itemLayers[i].id;
                    }
                    // Set data layers
                    configOptions.itemLayers[i].dataLayers = dataLayers;
                    // COMPOSE HTML LIST STRING
                    html += '<li class="' + layerClass + '" data-layer="' + dataLayers + '">';
                    html += '<div class="cover"></div>';
                    html += '<span tabindex="0" class="cBinfo" title="' + i18n.viewer.layer.information + '"></span>';
                    html += '<span tabindex="0" class="toggle cBox"></span>';
                    html += '<span tabindex="0" class="toggle cBtitle" title="' + configOptions.itemLayers[i].title + '">' + configOptions.itemLayers[i].title.replace(/[\-_]/g, " ") + '</span>';
                    html += '<div class="clear"></div>';
                    html += '<div class="infoHidden">';
                    if (configOptions.itemLayers[i].resourceInfo) {
                        html += '<div class="infoHiddenScroll">';
                        if (configOptions.itemLayers[i].resourceInfo.serviceDescription || configOptions.itemLayers[i].resourceInfo.description) {
                            if (configOptions.itemLayers[i].resourceInfo.serviceDescription) {
                                html += decodeURIComponent(configOptions.itemLayers[i].resourceInfo.serviceDescription);
                            }
                            if (configOptions.itemLayers[i].resourceInfo.description) {
                                html += decodeURIComponent(configOptions.itemLayers[i].resourceInfo.description);
                            }
                        }
                        html += '</div>';
                    } else {
                        html += '<div>No description.</div>';
                    }
                    html += '<div class="transSlider"><span class="transLabel">' + i18n.viewer.layer.transparency + '</span><span id="layerSlider' + i + '" data-layer-id="' + dataLayers + '" class="uiSlider slider"></span></div>';
                    html += '</div>';
                }
                html += '</li>';
                // APPEND HTML
                node = dojo.byId('layersList');
                if (node) {
                    dojo.place(html, node, "last");
                }
                setSharing();
            }
            // build sliders
            for (i = 0; i < configOptions.itemLayers.length; i++) {
                // if layer object
                if (configOptions.itemLayers[i]) {
                    // INIT SLIDERS
                    var slider = new dijit.form.HorizontalSlider({
                        name: "slider",
                        value: parseFloat(configOptions.itemLayers[i].opacity * 100),
                        minimum: 1,
                        showButtons: false,
                        maximum: 100,
                        dataLayers: configOptions.itemLayers[i].dataLayers,
                        discreteValues: 20,
                        intermediateChanges: true,
                        style: "width:100px; display:inline-block; *display:inline; vertical-align:middle;",
                        onChange: transparencyChange
                    }, "layerSlider" + i);
                }
            }
            zebraStripe(dojo.query('#layersList li.layer'));
        } else {
            configOptions.showLayersMenu = false;
        }
        configOptions.scaleBar = new esri.dijit.Scalebar({
            map: map,
            attachTo: "bottom-left",
            scalebarUnit: 'metric'
        });
        configureLayerUI();
    }
}

// slidder transparency change
function transparencyChange(value) {
    var layerID = this.dataLayers;
    var newValue = (value / 100);
    var splitVals = layerID.split(',');
    for (var j = 0; j < splitVals.length; j++) {
        map.getLayer(splitVals[j]).setOpacity(newValue);
    }
}
// END