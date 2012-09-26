{
   "configurationSettings":[
      {
         "category":"<b>General Options</b>",
         "fields":[
            {
               "type":"string",
               "fieldName":"webmap",
               "label":"Webmap ID",
               "tooltip":"Webmap ID",
               "placeHolder":""
            },
            {
               "type":"paragraph",
               "value":"The ID of the webmap to use for this template."
            },
            {
               "type":"string",
               "fieldName":"defaultMenu",
               "tooltip":"Default Menu",
               "label":"Default Menu:",
               "options":[
                  {
                     "label":"Places",
                     "value":"places"
                  },
                  {
                     "label":"Basemap",
                     "value":"basemap"
                  },
                  {
                     "label":"Layers",
                     "value":"layers"
                  },
                  {
                     "label":"Social",
                     "value":"social"
                  },
                  {
                     "label":"Legend",
                     "value":"legend"
                  },
                  {
                     "label":"None",
                     "value":"none"
                  }
               ]
            },
            {
               "type":"paragraph",
               "value":"The menu that is shown initially."
            },
            {
               "type":"boolean",
               "fieldName":"showSearchBox",
               "label":"Show Search Box",
               "tooltip":"Show Search Box"
            },
            {
               "type":"boolean",
               "fieldName":"showShareMenu",
               "label":"Show Share Menu",
               "tooltip":"Show Share Menu"
            },
            {
               "type":"boolean",
               "fieldName":"showSocialMenu",
               "label":"Show Social Menu",
               "tooltip":"Show Social Menu"
            },
            {
               "type":"boolean",
               "fieldName":"showBasemapMenu",
               "label":"Show Basemap Menu",
               "tooltip":"Show Basemap Menu"
            },
            {
               "type":"boolean",
               "fieldName":"showLayersMenu",
               "label":"Show Layers Menu",
               "tooltip":"Show Layers Menu"
            },
            {
               "type":"boolean",
               "fieldName":"showLegendMenu",
               "label":"Show Legend Menu",
               "tooltip":"Show Legend Menu"
            },
            {
               "type":"boolean",
               "fieldName":"showPlaces",
               "label":"Show Places Menu",
               "tooltip":"Show Places Menu"
            },
            {
               "type":"boolean",
               "fieldName":"showGeolocation",
               "label":"Show Geolocate Option",
               "tooltip":"Show Geolocate Option"
            },
            {
               "type":"boolean",
               "fieldName":"showAboutDialog",
               "label":"Show About Dialog",
               "tooltip":"Show About Dialog"
            },
            {
               "type":"paragraph",
               "value":"Show the about button and dialog."
            },
            {
               "type":"boolean",
               "fieldName":"showAboutDialogOnLoad",
               "label":"Open About Dialog On Load",
               "tooltip":"Open About Dialog"
            },
            {
               "type":"paragraph",
               "value":"Opens the about dialog on page load."
            },
            {
               "type":"string",
               "fieldName":"socialDisplay",
               "tooltip":"Social Display",
               "label":"Social Display:",
               "options":[
                  {
                     "label":"Cluster",
                     "value":"cluster"
                  },
                  {
                     "label":"Heatmap",
                     "value":"heatmap"
                  }
               ]
            },
            {
               "type":"paragraph",
               "value":"Display social media as clusters or density."
            },
            {
               "type":"string",
               "fieldName":"sourceCountry",
               "label":"Locator Source Country",
               "tooltip":"Locator Source Country",
               "placeHolder":""
            },
            {
               "type":"paragraph",
               "value":"A value representing the country. Providing this value increases geocoding speed. View the list of <a target=\"_blank\" href=\"http:\/\/geocode.arcgis.com\/arcgis\/geocoding.html#countries\">country codes<\/a>."
            }
         ]
      },
      {
         "category":"<b>Twitter Options</b>",
         "fields":[
            {
               "type":"boolean",
               "fieldName":"showTwitter",
               "label":"Show Twitter",
               "tooltip":"Show Twitter"
            },
            {
               "type":"paragraph",
               "value":"Show Twitter on this template."
            },
            {
               "type":"boolean",
               "fieldName":"showTwitterConfig",
               "label":"Show Config",
               "tooltip":"Show Config"
            },
            {
               "type":"paragraph",
               "value":"Allow configuration keywords to be changed."
            },
            {
               "type":"boolean",
               "fieldName":"twitterChecked",
               "label":"Checked",
               "tooltip":"Checked"
            },
            {
               "type":"paragraph",
               "value":"Turn this layer on by default."
            },
            {
               "type":"string",
               "fieldName":"twitterSearch",
               "label":"Search Keywords",
               "tooltip":"Search Keywords",
               "placeHolder":""
            },
            {
               "type":"paragraph",
               "value":"<a href=\"http:\/\/support.twitter.com\/articles\/71577-how-to-use-advanced-twitter-search\" target=\"_blank\">Advanced search<\/a>."
            }
         ]
      },
      {
         "category":"<b>Flickr Options</b>",
         "fields":[
            {
               "type":"boolean",
               "fieldName":"showFlickr",
               "label":"Show Flickr",
               "tooltip":"Show Flickr"
            },
            {
               "type":"paragraph",
               "value":"Show Flickr on this template."
            },
            {
               "type":"boolean",
               "fieldName":"showFlickrConfig",
               "label":"Show Config",
               "tooltip":"Show Config"
            },
            {
               "type":"paragraph",
               "value":"Allow configuration keywords to be changed."
            },
            {
               "type":"boolean",
               "fieldName":"flickrChecked",
               "label":"Checked",
               "tooltip":"Checked"
            },
            {
               "type":"paragraph",
               "value":"Turn this layer on by default."
            },
            {
               "type":"string",
               "fieldName":"flickrSearch",
               "label":"Search Keywords",
               "tooltip":"Search Keywords",
               "placeHolder":""
            },
            {
               "type":"string",
               "fieldName":"flickrRange",
               "tooltip":"Date Range",
               "label":"Date Range:",
               "options":[
                  {
                     "label":"Today",
                     "value":"today"
                  },
                  {
                     "label":"This Week",
                     "value":"this_week"
                  },
                  {
                     "label":"This Month",
                     "value":"this_month"
                  },
                  {
                     "label":"All Time",
                     "value":"all_time"
                  }
               ]
            }
         ]
      },
      {
         "category":"<b>YouTube Options</b>",
         "fields":[
            {
               "type":"boolean",
               "fieldName":"showYouTube",
               "label":"Show YouTube",
               "tooltip":"Show YouTube"
            },
            {
               "type":"paragraph",
               "value":"Show YouTube on this template."
            },
            {
               "type":"boolean",
               "fieldName":"showYouTubeConfig",
               "label":"Show Config",
               "tooltip":"Show Config"
            },
            {
               "type":"paragraph",
               "value":"Allow configuration keywords to be changed."
            },
            {
               "type":"boolean",
               "fieldName":"youtubeChecked",
               "label":"Checked",
               "tooltip":"Checked"
            },
            {
               "type":"paragraph",
               "value":"Turn this layer on by default."
            },
            {
               "type":"string",
               "fieldName":"youtubeSearch",
               "label":"Search Keywords",
               "tooltip":"Search Keywords",
               "placeHolder":""
            },
            {
               "type":"string",
               "fieldName":"youtubeRange",
               "tooltip":"Date Range",
               "label":"Date Range:",
               "options":[
                  {
                     "label":"Today",
                     "value":"today"
                  },
                  {
                     "label":"This Week",
                     "value":"this_week"
                  },
                  {
                     "label":"This Month",
                     "value":"this_month"
                  },
                  {
                     "label":"All Time",
                     "value":"all_time"
                  }
               ]
            }
         ]
      }
   ],
   "values":{
      "defaultMenu":"social",
      "showSearchBox":true,
      "showShareMenu":true,
      "showSocialMenu":true,
      "showBasemapMenu":true,
      "showLayersMenu":true,
      "showLegendMenu":true,
      "showPlaces":true,
      "showGeolocation":true,
      "showAboutDialog":true,
      "showAboutDialogOnLoad":false,
      "socialDisplay":"cluster",
      "showFlickr":true,
      "showFlickrConfig":true,
      "flickrChecked":true,
      "flickrSearch":"weather",
      "flickrRange":"this_month",
      "showYouTube":true,
      "showYouTubeConfig":true,
      "youtubeChecked":true,
      "youtubeSearch":"weather",
      "youtubeRange":"this_month",
      "showTwitter":true,
      "showTwitterConfig":true,
      "twitterChecked":true,
      "twitterSearch":"#weather",
      "sourceCountry":"USA"
   }
}