// host path regular expression
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');

// Dojo Config
var dojoConfig = {
    //locale: "ar",
    parseOnLoad: true,
    packages: [{
        name: "esriTemplate",
        location: locationPath
    }]
};

// Global Variables
var i18n, configOptions, map, urlObject;

// Layers
var clusterLayer, heatLayer;

// todo: Arabic CSS RTL.