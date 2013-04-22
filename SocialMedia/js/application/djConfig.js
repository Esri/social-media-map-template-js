// host path regular expression
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');
// Dojo Config
var dojoConfig = {
    //locale: "ar",
    parseOnLoad: true,
    packages: [
    {
        name: "modules",
        location: locationPath + '/js/modules/'
    },
    {
        name: "application",
        location: locationPath + '/js/application/'
    },
    {
        name: "config",
        location: locationPath + '/config'
    },
    {
        name: "appconfig",
        location: locationPath + '/config'
    }]
};