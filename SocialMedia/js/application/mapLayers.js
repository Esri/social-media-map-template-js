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

// change active layers
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

// layers ui
function configureLayerUI() {
    dojo.query(document).delegate("#layersList li:not(.cLoading) .toggle", "onclick,keyup", function (event) {
        if (event.type === 'click' || (event.type === 'keyup' && event.keyCode === 13)) {
            toggleChecked(this);
            var changeMapVal = dojo.query(this).parent('li').attr('data-layer')[0];
            var splitVals = changeMapVal.split(',');
            if (splitVals) {
                for (var i = 0; i < splitVals.length; i++) {
                    toggleMapLayer(splitVals[i]);
                }
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

    // Close Menus
    dojo.query(document).delegate(".slideMenu .menuClose .closeMenu", "onclick,keyup", function (event) {
        hideAllMenus();
    });

    // Close ToolTips
    dojo.query(document).delegate(".listMenu ul li .ihClose", "onclick,keyup", function (event) {
        hideLayerInfo();
    });

    // config settings
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

// toggle map layer on and off
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

function addLayerToUI(layerToAdd, index) {
    // each layer
    var layerClass;
    // URL layers variable
    var urlLayers = false;
    // if visible layers set in URL
    if (urlObject.query.hasOwnProperty('layers')) {
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
                        map.getLayer(layerToAdd.featureCollection.layers[k].id).hide();
                        // for each visible layer array item
                        for (key in configOptions.layers) {
                            // if current layer ID matches visible layer item
                            if (configOptions.layers[key] === layerToAdd.featureCollection.layers[k].id) {
                                // set visibility to true
                                layerToAdd.featureCollection.layers[k].visibility = true;
                                map.getLayer(layerToAdd.featureCollection.layers[k].id).show();
                            }
                        }
                    }
                    // if layer visibility is true
                    if (layerToAdd.featureCollection.layers[k].visibility === true) {
                        // set layer class to checked
                        layerClass = 'layer checked';
                        // add to active layers array
                        addToActiveLayers(layerToAdd.featureCollection.layers[k].id);
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
                    map.getLayer(layerToAdd.id).hide();
                    layerToAdd.visibility = false;
                    // for each visible layer array item
                    for (key in configOptions.layers) {
                        // if current layer ID matches visible layer item
                        if (configOptions.layers[key] === layerToAdd.id) {
                            // set visibility to true
                            layerToAdd.visibility = true;
                            map.getLayer(layerToAdd.id).show();
                        }
                    }
                }
                // if layer visibility is true
                if (layerToAdd.visibility === true) {
                    // set layer class to checked
                    layerClass = 'layer checked';
                    // add to active layers array
                    addToActiveLayers(layerToAdd.id);
                }
                // data layer attrubute
                dataLayers += layerToAdd.id;
            }
        } else {
            // if URL layers set
            if (urlLayers) {
                layerToAdd.visibility = false;
                map.getLayer(layerToAdd.id).hide();
                // for each visible layer array item
                for (key in configOptions.layers) {
                    // if current layer ID matches visible layer item
                    if (configOptions.layers[key] === layerToAdd.id) {
                        // set visibility to true
                        layerToAdd.visibility = true;
                        map.getLayer(layerToAdd.id).show();
                    }
                }
            }
            // if layer visibility is true
            if (layerToAdd.visibility === true) {
                // set layer class to checked
                layerClass = 'layer checked';
                // add to active layers array
                addToActiveLayers(layerToAdd.id);
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
    node = dojo.byId('layersList');
    if (node) {
        dojo.place(html, node, "last");
    }
}

function addLayerTransparencySlider(theLayer, index) {
    // if layer object
    if (theLayer) {
        // init sliders
        var slider = new dijit.form.HorizontalSlider({
            name: "slider",
            value: parseFloat(theLayer.opacity * 100),
            minimum: 1,
            showButtons: false,
            maximum: 100,
            dataLayers: theLayer.dataLayers,
            discreteValues: 20,
            intermediateChanges: true,
            style: "width:100px; display:inline-block; *display:inline; vertical-align:middle;",
            onChange: transparencyChange
        }, "layerSlider" + index);
    }
}

// create layer items
function configureLayers() {
    // if operational layers
    if (configOptions.itemLayers) {
        // if operational layers of at least 1
        if (configOptions.itemLayers.length > 0) {
            // build layers
            configOptions.layerInfos = buildLayersList(configOptions.itemLayers);
			var node;
            if (configOptions.showLegendMenu) {
                node = dojo.byId('legendMenu');
                if (node) {
                    node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.legend.menuTitle + '<div class="clear"></div></div><div class="legendMenuCon"><div class="slideScroll"><div id="legendContent"></div></div></div>';
                }
                // Build Legend
                if (configOptions.layerInfos && configOptions.layerInfos.length > 0) {
                    configOptions.legendDijit = new esri.dijit.Legend({
                        map: map,
                        layerInfos: configOptions.layerInfos
                    }, "legendContent");
                    configOptions.legendDijit.startup();
                } else {
                    var legendContentNode = dojo.byId('legendContent');
                    if (legendContentNode) {
                        legendContentNode.innerHTML = i18n.viewer.errors.noLegend;
                    }
                }
            }
            // ADD URL
            node = dojo.byId('layersMenu');
            if (node) {
                node.innerHTML = '<div class="menuClose"><div class="closeButton closeMenu"></div>' + i18n.viewer.layers.menuTitle + '<div class="clear"></div></div><ul class="zebraStripes" id="layersList"></ul>';
            }
            // for each layer
            for (var i = 0; i < configOptions.itemLayers.length; i++) {
                addLayerToUI(configOptions.itemLayers[i], i);
                addLayerTransparencySlider(configOptions.itemLayers[i], i);
            }
            zebraStripe(dojo.query('#layersList li.layer'));
        } else {
            configOptions.showLayersMenu = false;
            configOptions.showLegendMenu = false;
        }
        configOptions.scaleBar = new esri.dijit.Scalebar({
            map: map,
            attachTo: "bottom-left",
            scalebarUnit: i18n.viewer.main.scaleBarUnits
        });
        configureLayerUI();
    }
}

// slidder transparency change
function transparencyChange(value) {
    var layerID = this.dataLayers;
    var newValue = (value / 100);
    var splitVals = layerID.split(',');
    if (splitVals) {
        for (var j = 0; j < splitVals.length; j++) {
            map.getLayer(splitVals[j]).setOpacity(newValue);
        }
    }
}