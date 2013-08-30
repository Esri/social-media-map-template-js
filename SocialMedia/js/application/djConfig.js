var path_location = location.pathname.replace(/\/[^/]+$/, '');
var path_location_tc = path_location + '/config';
if (path_location.search(/\/apps\/|\/home\//) !== -1) {
    path_location_tc = path_location.substr(0, path_location.lastIndexOf('/SocialMedia'));    
}
// Dojo Config
var dojoConfig = {
    parseOnLoad: true,
    //locale: 'ar',
    packages: [{
        name: "modules",
        location: path_location + '/js/modules'
    }, {
        name: "application",
        location: path_location + '/js/application'
    },
    {
        name: "config",
        location: path_location + '/config'
    }, {
        name: "templateConfig",
        location: path_location_tc
    }]
};