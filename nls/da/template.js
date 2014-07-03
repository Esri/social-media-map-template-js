define(
({
        "viewer": {
            "main": {
                "scaleBarUnits": "metric",
                "timePattern": "h:mma", // added 2.5.2013
                "datePattern": "MMM d, åååå" // added 2.5.2013
            },
            "applicationTitle": {
                "PIM": "Public Information Map" // added 8.26.2013
            },
            "hashTagLabel": {
                "hashTagFlickr": "#Kode anvendes til Flickr", // added 8.26.2013
                "hashTagTwitter": "#Kode anvendes til Twitter", // added 8.26.2013
                "hashTagYoutube": "#Kode anvendes til YouTube" // added 8.26.2013
            },
            "errors": {
                "createMap": "Kan ikke oprette kort",
                "general": "Fejl",
                "bingError": "Du skal have din egen Bing-kortnøgle for at bruge denne applikation.",
                "noLegend": "Ingen signaturforklaring.",
                "heatmap": "Heatmapping understøttes ikke af denne browser.",
                "noText": "Indtast en søgeposition.",
                "noLocation": "Sted ikke fundet.",
                "integersOnly": "Du kan kun indtaste hele tal i dette felt.",
                "nodesc": "Ingen beskrivelse",
                "notAvailable": "Ikke tilgængelig", // added 8.26.2013
                "outsideArea": "Du er lige nu uden for det understøttede område", // added 8.26.2013
                "geoLocationTimeOut": "Tidsgrænse overskredet. Kan ikke udføre funktion", // added 8.26.2013
                "positionUnavailable": "Position er utilgængelig", // added 8.26.2013
                "permissionDenied": "Tilladelse til at finde aktuel position nægtet", // added 8.26.2013
                "unknownError": "Ukende fejl opstået. Kan ikke finde aktuel position", // added 8.26.2013
                "tinyURLError": "Kan ikke generere TinyURL", // added 8.26.2013
                "invalidSearch": "Ugyldig søgning" // added 8.26.2013
            },
            "legend": {
                "menuTitle": "Signaturforklaring"
            },
            "search": {
                "location": "Sted",
                "clearLocation": "Ryd sted",
                "placeholder": "Find et sted"
            },
            "layers": {
                "menuTitle": "Lag"
            },
            "locator": {
                "menuTitle": "Søgeadresse" // added 8.26.2013
            },
            "layer": {
                "information": "Oplysninger",
                "transparency": "Gennemsigtighed",
                "searchSettings": "Søgeindstillinger",
                "filteredBy": "filtreret efter:"
            },
            "general": {
                "at": "ved",
                "of": "af",
                "homeExtent": "Indlæs startbillede",
                "ok": "OK",
                "close": "Luk"
            },
            "basemap": {
                "menuTitle": "Vælg et baggrundskort"
            },
            "settings": {
                "title": "Indstillinger",
                "searchAll": "Søg alle af",
                "usingThisKeyword": "Ved hjælp af nøgleord",
                "search": "Søg",
                "fromThePast": "Fra tidligere",
                "today": "Dag",
                "this_week": "Uge",
                "this_month": "Måned",
                "all_time": "Altid",
                "atLocation": "På dette sted",
                "centerOfMap": "Midten af kortet",
                "centerOfMapTitle": "Brug midten af kortet",
                "withinThisDistance": "Inden for denne afstand",
                "latitude": "Breddegrad:",
                "longitude": "Længdegrad:",
                "locationText": "klik på kortet for at indstille oprindelsen",
                "twSearch": "Sådan bruges avanceret Twitter Search",
                "screenName": "Skærmnavn", // added 8.26.2013
                "signIn": "Log ind", // added 8.26.2013
                "switchAccount": "Skift konto" // added 8.26.2013
            },
            "autoComplete": {
                "menuTitle": "Resultater&hellip;"
            },
            "places": {
                "menuTitle": "Steder med bogmærker",
                "places": "Bogmærker",
                "placesTitle": "Giv steder et bogmærke",
                "myLocation": "Min nuværende position",
                "myLocationTitle": "Centrér kort til min position"
            },
            "distanceSlider": {
                "local": "Lokal",
                "regional": "Regional",
                "national": "National"
            },
            "about": {
                "title": "Om",
                "access": "Begrænsninger for adgang og brug"
            },
            "buttons": {
                "legend": "Signaturforklaring",
                "legendTitle": "Vis signaturforklaring",
                "basemap": "Baggrundskort",
                "basemapTitle": "Skift baggrundskort",
                "layers": "Lag",
                "layersTitle": "Udforsk lag",
                "social": "Social",
                "socialTitle": "Sociale medier",
                "link": "Link",
                "linkTitle": "Del denne web-app",
                "about": "Om",
                "aboutTitle": "Om dette kort",
                "displayAs": "Vis som",
                "point": "Punkter",
                "cluster": "Klynger",
                "heatmap": "Tæthed", // added 8.26.2013
                "map": "Kort", // added 8.26.2013
                "share": "Del", // added 8.26.2013
                "home": "Hjem", // added 8.26.2013
                "bookmarks": "Bogmærker", // added 8.26.2013
                "noBookmarks": "Ingen bogmærker", // added 8.26.2013
                "layerVisible": "Lagsynlighed", // added 8.26.2013
                "flagAppropriate": "Markér som upassende", // added 8.26.2013
                "flatReporting": "rapporterer", // added 8.26.2013
                "zoomToLabel": "Zoom til", // added 8.26.2013
                "contentFlagged": "Indhold markeret", // added 8.26.2013
                "locator": "Vis locator", // added 8.26.2013
                "tinyUrl": "Vis Tiny Url", // added 8.26.2013
                "refresh": "Opdatér", // added 8.26.2013
                "refreshContext": "Klik for at indlæse nye feeds." // added 8.26.2013
            },
            "shareMenu": {
                "menuTitle": "Del nuværende visning",
                "shareHeader": "Del et link til din web-app",
                "facebook": "Facebook",
                "facebookHeader": "Del på Facebook",
                "twitter": "Twitter",
                "twitterHeader": "Del på Twitter",
                "instructionHeader": "Kopiér/indsæt HTML på din webside",
                "preview": "Forhåndsvisning og tilpasning"
            },
            "itemInfo": {
                "createdLabel": "oprettet",
                "ratingsLabel": "vurdering",
                "ratingsLabelPlural": "vurderinger",
                "viewsLabel": "visning",
                "viewsLabelPlural": "visninger",
                "commentsLabel": "kommentar",
                "commentsLabelPlural": "kommentarer",
                "modifiedLabel": "Sidst ændret",
                "by": "af",
                "separator": ","
            },
            "social": {
                "menuTitle": "Sociale Medier-lag",
                "screenName": "Skærmnavn",
                "signIn": "Log ind",
                "switchAccount": "Skift konto"
            },
            "preview": {
                "minWidth": "Mindste bredde er",
                "minHeight": "Mindste højde er",
                "maxWidth": "Maksimum bredde er",
                "maxHeight": "Maksimum højde er",
                "customize": "Tilpas",
                "small": "Lille",
                "medium": "Mellem",
                "large": "Stor",
                "custom": "Tilpas",
                "embed": "Integrér",
                "instruction": "Kopiér og indsæt følgende HTML for at integrere kortet på dit websted."
            },
            "flickr": {
                "title": "Flickr",
                "description": "Foto fra Flickr"
            },
            "twitter": {
                "title": "Twitter",
                "description": "Tweets fra Twitter"
            },
            "youtube": {
                "title": "YouTube",
                "description": "Video fra YouTube"
            },
            "panoramio": {
                "title": "Panoramio",
                "description": "Fotos fra Panoramio"
            },
            "ushahidi": {
                "title": "Ushahidi",
                "description": "Hændelsesrapporter fra Ushahidi"
            }
        }
    })
);