define([
    "dojo/_base/kernel",
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/query",
    "dojo/i18n!./nls/template.js",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/html",
    "esri", // We're not directly using anything defined in esri.js but geometry, locator and utils are not AMD. So, the only way to get reference to esri object is through esri module (ie. esri/main)
    "esri/arcgis/utils",
    "dijit/TitlePane",
    "dojo/dom-attr",
    "dojox/widget/TitleGroup",
    "dijit/TooltipDialog",
    "esri/geometry/Extent",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "dojo/dom-geometry",
    "dojo/aspect",
    "dojo/dom-style"
  ],
  function (dojo, declare, array, dom, query, i18n, domClass, domConstruct, on, html, esri, arcgisUtils, TitlePane, domAttr, TitleGroup, TooltipDialog, Extent, Point, SpatialReference, domGeom, aspect, domStyle) {
      var Widget = declare("modules.mapnote", null, {
          constructor: function (options) {
              this.mapNotesLayer = [];
              this.mapNotesList = [];
              this.currentTitlePane = [];
              declare.safeMixin(this, options);
          },
          configureMapNotes: function (mapNoteLayers) {
              var _self = this;
              if (_self.options.mapNotesTitle.length > 0) {
                  for (var i = mapNoteLayers.length - 1; i > -1; i--) {
                      array.some(_self.options.mapNotesTitle, function (title) {
                          if (title == mapNoteLayers[i].title) {
                              _self.mapNotesLayer.push(mapNoteLayers[i]);
                              mapNoteLayers.splice(i, 1);
                              return true;
                          }
                      });
                  }
              }
              else {
                  _self.mapNotesLayer = mapNoteLayers;
              }
              domConstruct.create("div", { class: "tabContainer", id: "tabContainer" }, "mapNotesContainer", "first");
              var _headerTitle = domConstruct.create("div", { class: "mapNoteTitle" }, "tabContainer", "first");
              var _mapNoteListContainer = domConstruct.create("div", { class: "mapNoteListContainer" }, "mapNotesContainer", "last");
              //If mapnotes are present
              if (_self.mapNotesLayer.length > 0) {
                  html.set(_headerTitle, i18n.viewer.buttons.mapnote);
                  domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.mapNoteTitle);
                  var titleGroup = new TitleGroup({});
                  _mapNoteListContainer.appendChild(titleGroup.domNode);
                  array.forEach(_self.mapNotesLayer, function (mapNote, i) {
                      array.forEach(mapNote.featureCollection.layers, function (mapNoteLayer, j) {
                          var _mapNoteFeature = mapNoteLayer.layerObject;
                          // Setting title and description for each mapnote
                          array.forEach(mapNoteLayer.featureSet.features, function (item, k) {
                              _self._createMapnoteList(item, k, titleGroup, mapNoteLayer);
                          });
                          _mapNoteFeature.onClick = function (evt) {
                              var _geometryType = mapNoteLayer.featureSet.geometryType;
                          }
                      });
                  });
              }
              //If mapnotes are unavailable bookmarks panel will be created
              else if (_self.options.itemInfo.itemData.bookmarks) {
                  html.set(_headerTitle, i18n.viewer.buttons.bookmarks);
                  _self._createBookmarkList(_self.options.itemInfo.itemData.bookmarks, _mapNoteListContainer);
              }
              //If both, mapnotes and bookmarks are unavailable, destroy button
              else {
                  domConstruct.destroy("mapNotesButton");
              }
              on(_self.options.map, "click", function () {
                  _self.checkLayer(_self.options.map.infoWindow);
              });
              aspect.after(_self.options.map.infoWindow, "show", function () {
                  on(query(".close")[0], "click", function () {
                      _self.hideMapnoteDescription();
                  });
                  if (_self.options.map.infoWindow.features) {
                      _self._updateMapNoteTitle();
                  }
              });
              aspect.after(_self.options.map.infoWindow, "hide", function () {
              });
              on(_self.options.map.infoWindow._prevFeatureButton, "click", function () {
                  _self._setMapNoteDescription();
              });
              on(_self.options.map.infoWindow._nextFeatureButton, "click", function () {
                  _self._setMapNoteDescription();
              });
          },
          _setMapNoteDescription: function () {
              array.some(_self.currentTitlePane, function (currentPane) {
                  if (currentPane.open) {
                      currentPane.set('open', false);
                      domClass.replace(currentPane.titleNode, "listCollapse", "listExpand");
                      return true;
                  }
              });
              var isMapNoteFeature = false;
              array.some(_self.currentTitlePane, function (titlePane) {
                  if (titlePane.id == _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.TITLE + _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.OBJECTID) {
                      isMapNoteFeature = true;
                      return true;
                  }
              });
              if (isMapNoteFeature) {
                  array.some(_self.currentTitlePane, function (titlePane) {
                      if (titlePane.id == _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.TITLE + _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.OBJECTID) {
                          titlePane.set('open', true);
                          domClass.replace(titlePane.titleNode, "listExpand", "listCollapse");
                          return true;
                      }
                  });
                  query(".actionsPane")[0].style.display = "none";
              }
              else {
                  query(".actionsPane")[0].style.display = "block";
              }
          },
          _createMapnoteList: function (feature, index, listContainer, mapNoteLayer) {
              var _self = this, titlePaneContent = "";
              if (feature.attributes.DESCRIPTION) {
                  titlePaneContent = feature.attributes.DESCRIPTION + "\n";
              }
              if (feature.attributes.IMAGE_URL) {
                  if (feature.attributes.IMAGE_LINK_URL) {
                      titlePaneContent = titlePaneContent + "<a target=_blank href =" + feature.attributes.IMAGE_LINK_URL + ">" + "<image src= " + feature.attributes.IMAGE_URL + " height=100px width=180px alt='No Image Found'>" + "</a>";
                  }
                  else {
                      titlePaneContent = titlePaneContent + "<image src= " + feature.attributes.IMAGE_URL + " height=100px width=180px alt='No Image Found'>";
                  }
              }
              var _titlePane = new TitlePane({ title: feature.attributes.TITLE, content: titlePaneContent, open: false });
              _titlePane.id = feature.attributes.TITLE + feature.attributes.OBJECTID;
              if (_titlePane.content == "") {
                  _titlePane.setContent(i18n.viewer.settings.descriptionUnavailable);
              }
              _self.mapNotesList.push(_titlePane);
              listContainer.domNode.appendChild(_titlePane.domNode);
              domClass.add(_titlePane.titleNode, "titleNode");
              domClass.add(_titlePane.hideNode, "contentNode");
              domClass.add(_titlePane.domNode, "bottomBorder");
              domClass.add(_titlePane.containerNode, "descriptionNode");
              this.currentTitlePane.push(_titlePane);
              _titlePane.titleBarNode.onclick = function () {
                  _self._toggleMapnoteDescription(_titlePane, mapNoteLayer, index, feature);
              }
          },
          _toggleMapnoteDescription: function (_titlePane, mapNoteLayer, index, feature) {
              var _self = this;
              array.forEach(_self.mapNotesList, function (list) {
                  if (domClass.contains(list.titleNode, "listExpand")) {
                      domClass.replace(list.titleNode, "listCollapse", "listExpand");
                  }
              });
              if (_titlePane.open) {
                  domClass.add(_titlePane.titleNode, "listExpand");
                  var geometryType = mapNoteLayer.featureSet.geometryType;
                  _self._zoomToMapnote(geometryType, mapNoteLayer.layerObject.graphics[index].geometry, true, feature);
                  _self._showMapnoteDescription(mapNoteLayer, index);
              } else {
                  domClass.add(_titlePane.titleNode, "listCollapse");
                  if (_self.options.map.infoWindow.features == null) {
                      _self.options.map.infoWindow.hide();
                  }
              }
          },
          _zoomToMapnote: function (geometryType, center, isMapCenter, feature) {
              var _self = this; _self.options.map.infoWindow.hide();
              switch (geometryType) {
                  case "esriGeometryPolygon":
                      var anchorPointIndex = Math.floor(feature.geometry.rings[0].length / 2);
                      var point = new Point(center.rings[0][anchorPointIndex], _self.options.map.spatialReference);
                      _self.options.map.setExtent(center.getExtent().expand(1.5));
                      _self.options.map.infoWindow.setContent("<b>" + feature.attributes.TITLE + "</b>");
                      _self.options.map.infoWindow.setTitle("");
                      _self.options.map.infoWindow._updateWindow();
                      _self.options.map.infoWindow.show(center.getExtent().getCenter());
                      break;
                  case "esriGeometryPolyline":
                      var anchorPointIndex = Math.floor(center.paths[0].length / 2);
                      var point = new Point(center.paths[0][anchorPointIndex], _self.options.map.spatialReference);
                      _self.options.map.setExtent(center.getExtent().expand(1.5));
                      _self.options.map.infoWindow.setContent("<b>" + feature.attributes.TITLE + "</b>");
                      _self.options.map.infoWindow._updateWindow();
                      _self.options.map.infoWindow.show(point);
                      break;
                  default:
                      var point = new Point(feature.geometry.x, feature.geometry.y, _self.options.map.spatialReference);
                      _self.options.map.infoWindow.setContent("<b>" + feature.attributes.TITLE + "</b>");
                      _self.options.map.infoWindow.setTitle("");
                      _self.options.map.infoWindow._zoomToFeature(true);
                      _self.options.map.infoWindow._updateWindow();
                      _self.options.map.infoWindow.show(point);
                      isMapCenter ? _self.options.map.centerAndZoom(feature.geometry, _self.options.zoomLevel) : _self.options.map.centerAt(center);
              }
          },
          _createBookmarkList: function (bookmarkList, listContainer) {
              var _self = this;
              domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.bookmarksTitle);
              array.forEach(bookmarkList, function (content, index) {
                  var _bookmark = domConstruct.create("div", { class: "bookmarkList bottomBorder", innerHTML: content.name }, listContainer, "last");
                  var _newExtent = new Extent(content.extent);
                  on(_bookmark, 'click', function (evt) {
                      _self.options.map.setExtent(_newExtent);
                  });
              });
          },
          //Open description panel in the map note list
          _showMapnoteDescription: function (mapNoteLayer, k) {
              var _self = this;
              query(".actionsPane")[0].style.display = "none";
          },
          //Close description panel in the map note list
          hideMapnoteDescription: function () {
              var _self = this;
              array.some(_self.mapNotesList, function (list) {
                  if (list.open) {
                      list.set('open', false);
                      _self.replaceClass(list.titleNode);
                      return true;
                  }
              });
          },
          // Update (highlight) title in the map note list
          _updateMapNoteTitle: function (mapNote) {
              var _self = this;
              array.some(_self.currentTitlePane, function (currentPane) {
                  if (currentPane.open) {
                      currentPane.set('open', false);
                      domClass.replace(currentPane.titleNode, "listCollapse", "listExpand");
                      return true;
                  }
              });
              var isMapNoteFeature = false;
              array.some(_self.currentTitlePane, function (titlePane) {
                  if (titlePane.id == _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.TITLE + _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.OBJECTID) {
                      isMapNoteFeature = true;
                      return true;
                  }
              });
              if (isMapNoteFeature) {
                  array.some(_self.currentTitlePane, function (titlePane) {
                      if (titlePane.id == _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.TITLE + _self.options.map.infoWindow.features[_self.options.map.infoWindow.selectedIndex].attributes.OBJECTID) {
                          titlePane.set('open', true);
                          domClass.replace(titlePane.titleNode, "listExpand", "listCollapse");
                          return true;
                      }
                  });
                  query(".actionsPane")[0].style.display = "none";
              }
              else {
                  query(".actionsPane")[0].style.display = "block";
              }
          },
          //Show/hide left panel
          toggleLeftPanel: function () {
              var _self = this;
              if (domClass.contains("mapNotesContainer", "showMapNotesContainer")) {
                  _self.hideMapnotePanel();
              } else {
                  _self._showMapnotePanel();
              }
          },
          //Show map note panel and slide zoom slider and scalebar to the right
          _showMapnotePanel: function () {
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
          },
          replaceClass: function (node) {
              domClass.replace(node, "listCollapse", "listExpand");
          },
          checkLayer: function (infoWindow) {
              _self = this;
              array.forEach(infoWindow.features, function (curentFeature) {
                  var currentLayer = curentFeature.getLayer();
                  array.forEach(_self.mapNotesList, function (mapNoteLayer) {
                      if (mapNoteLayer.id == curentFeature.attributes.TITLE + curentFeature.attributes.OBJECTID) {
                          curentFeature.attributes.DESCRIPTION = "";
                          if (curentFeature.attributes.IMAGE_LINK_URL) {
                              curentFeature.attributes.IMAGE_LINK_URL = "";
                          }
                          if (curentFeature.attributes.IMAGE_URL) {
                              curentFeature.attributes.IMAGE_URL = "";
                          }
                          _self.options.map.centerAt(curentFeature._extent.getCenter());
                      }
                      _self.options.map.infoWindow._updateWindow();
                  });
              });
          }
      });
  });