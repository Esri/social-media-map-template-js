define([
    "dojo/_base/declare",
    "dojo/query",
    "dojo/dom",
    "dojo/on",
    "dojo/json",
    "dojo/i18n!./nls/template.js",
    "esri/arcgis/utils"
],
function (declare, query, dom, on, JSON, i18n, arcgisUtils) {
    var Widget = declare('application.test', null, {
        constructor: function (options) {
            var _self = this;
            this.options = {};
            declare.safeMixin(_self.options, options);
            dom.byId('mapcon').innerHTML = "";
            _self.init();
        },

        init: function () {
            var _self = this;
            // create map deferred with options
            var mapDeferred = arcgisUtils.createMap(_self.options.webmap, 'mapcon', {
                mapOptions: {
                    slider: true,
                    wrapAround180: true,
                    logo: true,
                    isScrollWheelZoom: true
                }
            });
            // on successful response
            mapDeferred.addCallback(function (response) {
                _self.map = response.map;
                _self.options.map = response.map;
                on(_self.map, "resize", function () {
                    setTimeout(function () {
                        if (_self.options.startExtent) {
                            _self.map.setExtent(_self.options.startExtent);
                        }
                    }, 500);
                });
                query('body').removeClass('modernGrey');
            });
            // on error response
            mapDeferred.addErrback(function (error) {
                console.log(i18n.viewer.errors.createMap + ": ", JSON.stringify(error));
            });
        }
    });
    return Widget;
});