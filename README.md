Social Media Template
======================

The Social Media Template has an innovative use of social media, which allows you to display up-to-date, keyword-targeted social media points on a map. Users have the ability to view social data from Twitter, YouTube, and Flickr. Social media points are rendered client-side using clustering or displayed as a heat map. Mapping social data provides insight into what people are saying and where they are saying it. By adding social intelligence to the map and by analyzing the conversations, you can see the most engaging posts to get a better understanding of how an event spreads.

The map will perform searches 5 seconds after the extent changes. The tweets stay on the map until the search term is changed or the layer is turned off. So you can pan around the map and get more tweets for different locations.

The application doesn't keep searching unless the view of the map is changed. (it’s not using a streaming API).

The application captures all results within an extent that match a search query or hash tag that was set. It only renders the results that have x,y coordinates. For Twitter, the search doesn't return the whole twitter pipe.

The search radius is determined by the current radius up to the maximum radius that the API supports.

    Twitter supports up to 932 miles.
    Flickr uses up to 600 miles.
    Youtube supports up to 621 miles.