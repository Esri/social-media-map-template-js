# social-media-map-template-js

The Social Media Template has an innovative use of social media, which allows you to display up-to-date, keyword-targeted social media points on a map. [more info](http://www.arcgis.com/home/item.html?id=18230986538047b4b761715f0b5dd913).

[View it live](http://www.arcgis.com/apps/SocialMedia/index.html)

![App](https://raw.github.com/Esri/social-media-map-template-js/master/resources/item.png)

## Features
Users have the ability to view social data from Twitter, YouTube, and Flickr. Social media points are rendered client-side using clustering or displayed as a heat map. Mapping social data provides insight into what people are saying and where they are saying it. By adding social intelligence to the map and by analyzing the conversations, you can see the most engaging posts to get a better understanding of how an event spreads.

The map will perform searches 5 seconds after the extent changes. The tweets stay on the map until the search term is changed or the layer is turned off. So you can pan around the map and get more tweets for different locations.

The application doesn't keep searching unless the view of the map is changed. (it’s not using a streaming API).

The application captures all results within an extent that match a search query or hash tag that was set. It only renders the results that have x,y coordinates. For Twitter, the search doesn't return the whole twitter pipe.

The search radius is determined by the current radius up to the maximum radius that the API supports.

    Twitter supports up to 932 miles.
    Flickr uses up to 600 miles.
    Youtube supports up to 621 miles.

## Instructions

1. Download and unzip the .zip file or clone the repo.
2. Web-enable the directory.
3. Access the .html page.
4. See the readme.html page for configuration options.

 [New to Github? Get started here.](https://github.com/)

## Requirements

* Notepad or HTML editor
* A little background with Javascript
* Experience with the [ArcGIS Javascript API](http://www.esri.com/) would help.

## Resources

* [ArcGIS for JavaScript API Resource Center](http://help.arcgis.com/en/webapi/javascript/arcgis/index.html)
* [ArcGIS Blog](http://blogs.esri.com/esri/arcgis/)
* [twitter@esri](http://twitter.com/esri)

## Issues

Find a bug or want to request a new feature?  Please let us know by submitting an issue.

## Contributing

Anyone and everyone is welcome to contribute. :)

## Licensing
Copyright 2012 Esri

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

A copy of the license is available in the repository's [license.txt](https://raw.github.com/Esri/social-media-map-template-js/master/license.txt) file.

[](Esri Tags: ArcGIS ArcGIS Online Web Application Social Media Template Public)
[](Esri Language: JavaScript)
