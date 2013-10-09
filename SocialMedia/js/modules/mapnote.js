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
    "dojo/dom-style"
  ],
  function (dojo, declare, array, dom, query, i18n, domClass, domConstruct, on, html, esri, arcgisUtils, TitlePane, domAttr, TitleGroup, TooltipDialog, Extent, Point, SpatialReference, domGeom, domStyle) {
      var Widget = declare("modules.mapnote", null, {
          constructor: function (options) {
              this.mapNotesLayer = [];
              this.mapNotesList = [];
              declare.safeMixin(this, options);
          },
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
                  html.set(_headerTitle, i18n.viewer.buttons.mapnote);
                  domAttr.set(dom.byId("mapNotesButton"), "title", i18n.viewer.buttons.mapNoteTitle);
                  var titleGroup = new TitleGroup({ title: i18n.viewer.buttons.mapnote });
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
                              _self._hideInfoWindow(_self);
                              _self._showTooltip(evt, _geometryType);
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
          },
          _hideInfoWindow: function (_self) {
              _self.showInfoWindow = false;
              on(_self.options.map.infoWindow, "show", function () {
                  if (!_self.showInfoWindow) {
                      _self.options.map.infoWindow.hide();
                  }
              });
          },
          _createMapnoteList: function (feature, index, listContainer, mapNoteLayer) {
              var _self = this;
              var _titlePane = new TitlePane({ title: feature.attributes.TITLE, content: feature.attributes.DESCRIPTION, open: false });
              _titlePane.id = feature.attributes.TITLE + feature.attributes.OBJECTID;
              if (_titlePane.content == undefined) {
                  _titlePane.setContent(i18n.viewer.settings.descriptionUnavailable);
              }
              _self.mapNotesList.push(_titlePane);
              listContainer.domNode.appendChild(_titlePane.domNode);
              domClass.add(_titlePane.titleNode, "titleNode");
              domClass.add(_titlePane.hideNode, "contentNode");
              domClass.add(_titlePane.domNode, "bottomBorder");
              domClass.add(_titlePane.containerNode, "descriptionNode");
              _titlePane.titleBarNode.onclick = function () {
                  _self._toggleMapnoteDescription(_titlePane, mapNoteLayer, index, feature);
              }
          },
          _toggleMapnoteDescription: function (_titlePane, mapNoteLayer, index, feature) {
              var _self = this;
              array.forEach(_self.mapNotesList, function (list) {
                  if (domClass.contains(list.titleNode, "listExpand")) {
                      domClass.replace(list.titleNode, "listCollapse", "listExpand");
                      domClass.add(list.titleNode, "listCollapse");
                  }
              });
              if (_titlePane.open) {
                  domClass.add(_titlePane.titleNode, "listExpand");
                  var geometryType = mapNoteLayer.featureSet.geometryType;
                  _self._zoomToMapnote(geometryType, mapNoteLayer.layerObject.graphics[index].geometry, true, feature);
                  _self._showMapnoteDescription(mapNoteLayer, index);
              } else {
                  _self.hideMapnoteTooltip();
                  domClass.add(_titlePane.titleNode, "listCollapse");
              }
          },
          _zoomToMapnote: function (geometryType, center, isMapCenter, feature) {
              var _self = this;
              switch (geometryType) {
                  case "esriGeometryPolygon":
                      isMapCenter ? _self.options.map.centerAndZoom(center.getExtent().getCenter(), _self.options.zoomLevel) : _self.options.map.centerAt(center.getExtent().getCenter());
                      break;
                  case "esriGeometryPolyline":
                      var anchorPointIndex = Math.floor(center.paths[0].length / 2);
                      var point = new Point(center.paths[0][anchorPointIndex], _self.options.map.spatialReference);
                      isMapCenter ? _self.options.map.centerAndZoom(point, _self.options.zoomLevel) : _self.options.map.centerAt(point);
                      break;
                  default:
                      isMapCenter ? _self.options.map.centerAndZoom(feature.geometry, _self.options.zoomLevel) : _self.options.map.centerAt(center);
              }
          },
          _showTooltip: function (evt, _geometryType) {
              var _self = this;
              _self._zoomToMapnote(_geometryType, evt.graphic.geometry, false);
              setTimeout(function () {
                  _self._createTooltip(evt.graphic.attributes.TITLE);
              }, 0);
              _self._updateMapNoteTitle(evt);
              _self._showMapnotePanel();
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
              if (_self.options.map.infoWindow.isShowing) {
                  _self.options.map.infoWindow.hide();
              }
              _self.hideMapnoteTooltip();
              _self._createTooltip(mapNoteLayer.layerObject.graphics[k].attributes.TITLE);
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
          _updateMapNoteTitle: function (mapNote) {
              var _self = this;
              _self.hideMapnoteDescription();
              _self.hideMapnoteTooltip();
              array.some(_self.mapNotesList, function (list) {
                  var graphicID = mapNote.graphic.attributes.TITLE + mapNote.graphic.attributes.OBJECTID;
                  if (list.id == graphicID) {
                      list.set('open', true);
                      domClass.add(list.titleNode, "listExpand");
                      query('.mapNoteListContainer')[0].scrollTop = list.domNode.offsetTop - domGeom.getMarginBox(query('.mapNoteTitle')[0]).h;
                      return true;
                  }
              });
          },
          // Create mapnote tooltip and set the position on the map
          _createTooltip: function (title) {
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
          }
      });
  });