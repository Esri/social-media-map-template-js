define(
({
        "viewer": {
            "main": {
                "scaleBarUnits": "english",
                "timePattern": "h:mma", // added 2.5.2013
                "datePattern": "KKK p, vvvv" // added 2.5.2013
            },
            "applicationTitle": {
                "PIM": "Julkisten tietojen kartta" // added 8.26.2013
            },
            "hashTagLabel": {
                "hashTagFlickr": "Flickrissä käytettävä tunniste", // added 8.26.2013
                "hashTagTwitter": "Twitterissä käytettävä tunniste", // added 8.26.2013
                "hashTagYoutube": "YouTubessa käytettävä tunniste" // added 8.26.2013
            },
            "errors": {
                "createMap": "Karttaa ei voi luoda",
                "general": "Virhe",
                "bingError": "Tämän sovelluksen käyttöönotto edellyttää omaa Bing Maps -avaintasi.",
                "noLegend": "Ei selitettä.",
                "heatmap": "Tämä selain ei tue HeatMap-esitystapaa.",
                "noText": "Anna hakusijainti.",
                "noLocation": "Sijaintia ei löytynyt.",
                "integersOnly": "Tähän kenttään voit antaa vain kokonaislukuja.",
                "nodesc": "Ei kuvausta.",
                "notAvailable": "Ei käytettävissä", // added 8.26.2013
                "outsideArea": "Olet tuetun alueen ulkopuolella", // added 8.26.2013
                "geoLocationTimeOut": "Aikakatkaisuraja ylitetty. Toimintoa ei voi suorittaa.", // added 8.26.2013
                "positionUnavailable": "Sijainti ei ole käytettävissä", // added 8.26.2013
                "permissionDenied": "Nykyisen sijainnin paikannuslupa evätty", // added 8.26.2013
                "unknownError": "Tuntematon virhe. Nykyistä sijaintia ei voi paikantaa.", // added 8.26.2013
                "tinyURLError": "TinyURL:n luonti epäonnistui", // added 8.26.2013
                "invalidSearch": "Virheellinen haku" // added 8.26.2013
            },
            "legend": {
                "menuTitle": "Selite"
            },
            "search": {
                "location": "Sijainti",
                "clearLocation": "Tyhjennä sijainti",
                "placeholder": "Etsi paikka"
            },
            "layers": {
                "menuTitle": "Karttatasot"
            },
            "locator": {
                "menuTitle": "Hae osoitetta" // added 8.26.2013
            },
            "layer": {
                "information": "Tiedot",
                "transparency": "Läpinäkyvyys",
                "searchSettings": "Hakuasetukset",
                "filteredBy": "suodatusperuste:"
            },
            "general": {
                "at": "klo",
                "of": "/",
                "homeExtent": "Lataa Koti-näkymä",
                "ok": "OK",
                "close": "Sulje"
            },
            "basemap": {
                "menuTitle": "Valitse taustakartta"
            },
            "settings": {
                "title": "Asetukset",
                "searchAll": "Etsi kaikki seuraavat:",
                "usingThisKeyword": "Käytetään avainsanaa/-sanoja",
                "search": "Etsi",
                "fromThePast": "Menneisyydestä",
                "today": "Päivä",
                "this_week": "Viikko",
                "this_month": "Kuukausi",
                "all_time": "Koko ajan",
                "atLocation": "Tässä sijainnissa",
                "centerOfMap": "Kartan keskikohta",
                "centerOfMapTitle": "Käytä kartan keskikohtaa",
                "withinThisDistance": "Tällä etäisyydellä",
                "latitude": "Leveysaste:",
                "longitude": "Pituusaste:",
                "locationText": "määritä aloituskohta napsauttamalla karttaa",
                "twSearch": "Tarkennetun Twitter-haun käyttö",
                "screenName": "Näyttönimi", // added 8.26.2013
                "signIn": "Kirjaudu sisään", // added 8.26.2013
                "switchAccount": "Vaihda tiliä" // added 8.26.2013
            },
            "autoComplete": {
                "menuTitle": "Tulokset&hellip;"
            },
            "places": {
                "menuTitle": "Kirjanmerkiksi tallennetut paikat",
                "places": "Kirjanmerkit",
                "placesTitle": "Tallenna paikat kirjanmerkiksi",
                "myLocation": "Oma nykyinen sijainti",
                "myLocationTitle": "Keskitä kartta sijaintiini"
            },
            "distanceSlider": {
                "local": "Paikallinen",
                "regional": "Alueellinen",
                "national": "Kansallinen"
            },
            "about": {
                "title": "Tietoja",
                "access": "Pääsyn ja käytön rajoitukset"
            },
            "buttons": {
                "legend": "Selite",
                "legendTitle": "Näytä selite",
                "basemap": "Taustakartat",
                "basemapTitle": "Vaihda taustakartta",
                "layers": "Karttatasot",
                "layersTitle": "Tutki karttatasoja",
                "social": "Sosiaalinen",
                "socialTitle": "Sosiaalinen media",
                "link": "Linkki",
                "linkTitle": "Jaa tämä Web-sovellus",
                "about": "Tietoja",
                "aboutTitle": "Tietoja tästä kartasta",
                "displayAs": "Näytä muodossa",
                "point": "Pistettä",
                "cluster": "Ryväkset",
                "heatmap": "Tiheys", // added 8.26.2013
                "map": "Kartta", // added 8.26.2013
                "share": "Jaa", // added 8.26.2013
                "home": "Koti", // added 8.26.2013
                "bookmarks": "Kirjanmerkit", // added 8.26.2013
                "noBookmarks": "Ei kirjanmerkkejä", // added 8.26.2013
                "layerVisible": "Karttatason näkyvyys", // added 8.26.2013
                "flagAppropriate": "Merkitse sopimattomaksi", // added 8.26.2013
                "flatReporting": "raportointi", // added 8.26.2013
                "zoomToLabel": "Tarkenna kohteeseen", // added 8.26.2013
                "contentFlagged": "Sisältö merkitty", // added 8.26.2013
                "locator": "Näytä paikannin", // added 8.26.2013
                "tinyUrl": "Näytä TinyURL", // added 8.26.2013
                "refresh": "Päivitä", // added 8.26.2013
                "refreshContext": "Lataa uudet syötteet napsauttamalla." // added 8.26.2013
            },
            "shareMenu": {
                "menuTitle": "Jaa nykyinen näkymä",
                "shareHeader": "Jaa linkki Web-sovellukseesi",
                "facebook": "Facebook",
                "facebookHeader": "Jaa Facebookissa",
                "twitter": "Twitter",
                "twitterHeader": "Jaa Twitterissä",
                "instructionHeader": "Kopioi ja liitä HTML Web-sivullesi",
                "preview": "Esikatsele ja mukauta"
            },
            "itemInfo": {
                "createdLabel": "luotu",
                "ratingsLabel": "arviointi",
                "ratingsLabelPlural": "arvioinnit",
                "viewsLabel": "näytä",
                "viewsLabelPlural": "katselukerrat",
                "commentsLabel": "kommentti",
                "commentsLabelPlural": "kommentit",
                "modifiedLabel": "Muokattu viimeksi",
                "by": "peruste",
                "separator": ","
            },
            "social": {
                "menuTitle": "Sosiaalisen median tasot",
                "screenName": "Nimi näytöllä",
                "signIn": "Kirjaudu sisään",
                "switchAccount": "Vaihda tiliä"
            },
            "preview": {
                "minWidth": "Vähimmäisleveys on",
                "minHeight": "Vähimmäiskorkeus on",
                "maxWidth": "Enimmäisleveys on",
                "maxHeight": "Enimmäiskorkeus on",
                "customize": "Mukauta",
                "small": "Pieni",
                "medium": "Keskisuuri",
                "large": "Suuri",
                "custom": "Mukautettu",
                "embed": "Upottaminen",
                "instruction": "Kopioi ja liitä seuraava HTML, joka upotetaan Web-sivustosi karttaan."
            },
            "flickr": {
                "title": "Flickr",
                "description": "Valokuvat Flickr-palvelusta"
            },
            "twitter": {
                "title": "Twitter",
                "description": "Tweetit Twitteristä"
            },
            "youtube": {
                "title": "YouTube",
                "description": "Videot YouTubesta"
            },
            "panoramio": {
                "title": "Panoramio",
                "description": "Valokuvat Panoramiosta"
            },
            "ushahidi": {
                "title": "Ushahidi",
                "description": "Onnettomuusraportit Ushahidista"
            }
        }
    })
);