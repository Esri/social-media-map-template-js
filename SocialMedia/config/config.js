define(["esri/layers/ArcGISDynamicMapServiceLayer"], function(ArcGISDynamicMapServiceLayer) {
    var config = {
        "appid": "",
        "webmap": "4ff792a3962547caad2d924413c40985",
        "socialDisplay": "point",
        "showFlickr": true,
        "showFlickrConfig": true,
        "flickrChecked": true,
        "flickrSearch": "weather",
        "flickrRange": "this_month",
        "flickrKey": "404ebea7d5bc27aa5251d1207620e99b",
        "showYouTube": false,
        "showYouTubeConfig": true,
        "youtubeChecked": true,
        "youtubeSearch": "weather",
        "youtubeRange": "this_month",
        "youtubeKey": "AI39si5AmNrzX3VKNKo4Kcet9BVemrvyjl4B13ezBbNLsvKOlw9Vh3eL_57dZ2vC6M9PwV9i3bHm6emtZLr_BhQ8qtnTbvwzCw",
        "showTwitter": true,
        "showTwitterConfig": true,
        "twitterChecked": true,
        "twitterSearch": "weather",
        "twitterUrl": location.protocol + "//utility.arcgis.com/tproxy/proxy/1.1/search/tweets.json",
        "twitterSigninUrl": location.protocol + "//utility.arcgis.com/tproxy/signin",
        "showPanoramio": false,
        "panoramioChecked": false,
        "showUshahidi": false,
        "ushahidiChecked": true,
        "showUshahidiConfig": true,
        "ushahidiCategory": 0,
        "ushahidiUrl": "",
        "useArcGISOnlineBasemaps": true,
        "basemapGroupTitle": "Community Basemaps",
        "basemapGroupOwner": "esri",
        "clusterImage": "images/map/cluster72x72.png",
        "clusterHoverImage": "images/map/clusterHover72x72.png",
        "pointGraphic": "images/map/bluepoint21x29.png",
        "proxyUrl": "",
        "sharingurl": "",
        "defaultMenu": "social",
        "showSearchBox": true,
        "showShareMenu": true,
        "showSocialMenu": true,
        "showBasemapMenu": true,
        "showLayersMenu": true,
        "showLegendMenu": true,
        "showDisplaySwitch": true,
        "showPlaces": true,
        "showGeolocation": true,
        "showAboutDialog": true,
        "showAboutDialogOnLoad": false,
        "updateSocialLayersOnPan": false,
/*
        "securedLayers": [
            {
                title: "Precipitation",
                index: 0,
                layerObject: ArcGISDynamicMapServiceLayer('http://tm2-elb-1378978824.us-east-1.elb.amazonaws.com/ArcGIS/rest/services/Secured/Precip/MapServer?token=Y8RuXnlQg1YQNlD2src5St2fvNAqAkdxdXD9bZ1ug_ZLo7V1aUJrTuGvT5FeWsVVrBFh59Jx1Nyp0-UlBRKDxQ..', {
                    id: "precip",
                    visible: true,
                    opacity: 0.4
                })
            }
        ],
        */
    };
    return config;
});