define(
({
        "viewer": {
            "main": {
                "scaleBarUnits": "metric",
                "timePattern": "h:mma", // added 2.5.2013
                "datePattern": "MMM d, rrrr" // added 2.5.2013
            },
            "applicationTitle": {
                "PIM": "Mapa veřejných informací" // added 8.26.2013
            },
            "hashTagLabel": {
                "hashTagFlickr": "#Tag používán pro Flickr", // added 8.26.2013
                "hashTagTwitter": "#Tag používán pro Twitter", // added 8.26.2013
                "hashTagYoutube": "#Tag používán pro YouTube" // added 8.26.2013
            },
            "errors": {
                "createMap": "Nelze vytvořit mapu",
                "general": "Chyba",
                "bingError": "K vydání této aplikace je nutný vlastní klíč Bing Maps.",
                "noLegend": "Bez legendy.",
                "heatmap": "Váš prohlížeč nepodporuje vytváření teplotních map (heatmapping).",
                "noText": "Zadejte prosím hledané umístění.",
                "noLocation": "Umístění nebylo nalezeno.",
                "integersOnly": "Do tohoto pole zadávejte pouze celá čísla.",
                "nodesc": "Bez popisu.",
                "notAvailable": "Není k dispozici.", // added 8.26.2013
                "outsideArea": "Momentálně se nacházíte mimo podporovanou oblast.", // added 8.26.2013
                "geoLocationTimeOut": "Vypršel časový limit. Operaci nelze provést.", // added 8.26.2013
                "positionUnavailable": "Pozice nedostupná", // added 8.26.2013
                "permissionDenied": "Povolení vyhledat aktuální polohu bylo zamítnuto", // added 8.26.2013
                "unknownError": "Vyskytla se neznámá chyba. Nelze určit aktuální polohu.", // added 8.26.2013
                "tinyURLError": "Nelze vygenerovat adresu TinyURL.", // added 8.26.2013
                "invalidSearch": "Neplatné vyhledávání" // added 8.26.2013
            },
            "legend": {
                "menuTitle": "Legenda"
            },
            "search": {
                "location": "Umístění",
                "clearLocation": "Vymazat umístění",
                "placeholder": "Najít místo"
            },
            "layers": {
                "menuTitle": "Vrstvy"
            },
            "locator": {
                "menuTitle": "Vyhledávací adresa" // added 8.26.2013
            },
            "layer": {
                "information": "Informace",
                "transparency": "Průhlednost",
                "searchSettings": "Prohledat nastavení",
                "filteredBy": "filtr:"
            },
            "general": {
                "at": "v",
                "of": "z",
                "homeExtent": "Načíst výchozí pohled",
                "ok": "OK",
                "close": "Zavřít"
            },
            "basemap": {
                "menuTitle": "Výběr podkladové mapy"
            },
            "settings": {
                "title": "Nastavení",
                "searchAll": "Vyhledat všechna",
                "usingThisKeyword": "Pomocí klíčového výrazu",
                "search": "Hledat",
                "fromThePast": "Z minulosti",
                "today": "Den",
                "this_week": "Týden",
                "this_month": "Měsíc",
                "all_time": "Za celou dobu",
                "atLocation": "V tomto umístění",
                "centerOfMap": "Střed mapy",
                "centerOfMapTitle": "Použít střed mapy",
                "withinThisDistance": "Do této vzdálenosti",
                "latitude": "Zem. šířka:",
                "longitude": "Zem. délka:",
                "locationText": "klikněte na mapu pro určení počátku",
                "twSearch": "Jak používat pokročilé vyhledávání Twitter",
                "screenName": "Zobrazované jméno", // added 8.26.2013
                "signIn": "Přihlásit se", // added 8.26.2013
                "switchAccount": "Přepnout účet" // added 8.26.2013
            },
            "autoComplete": {
                "menuTitle": "Výsledky & nápověda;"
            },
            "places": {
                "menuTitle": "Místa uložená v záložkách",
                "places": "Záložky",
                "placesTitle": "Uložit místa do záložek",
                "myLocation": "Moje aktuální umístění",
                "myLocationTitle": "Vycentrovat mapu na aktuální umístění"
            },
            "distanceSlider": {
                "local": "Lokální",
                "regional": "Regionální",
                "national": "Celostátní"
            },
            "about": {
                "title": "O aplikaci",
                "access": "Přístup a omezení použití"
            },
            "buttons": {
                "legend": "Legenda",
                "legendTitle": "Zobrazit legendu",
                "basemap": "Podkladová mapa",
                "basemapTitle": "Přepnout podkladovou mapu",
                "layers": "Vrstvy",
                "layersTitle": "Prohlédnout vrstvy",
                "social": "Sociální",
                "socialTitle": "Sociální média",
                "link": "Odkaz",
                "linkTitle": "Sdílet tuto webovou aplikaci",
                "about": "O aplikaci",
                "aboutTitle": "Informace o mapě",
                "displayAs": "Zobrazit jako",
                "point": "Body",
                "cluster": "Clustery",
                "heatmap": "Hustota", // added 8.26.2013
                "map": "Mapa", // added 8.26.2013
                "share": "Sdílet", // added 8.26.2013
                "home": "Domů", // added 8.26.2013
                "bookmarks": "Záložky", // added 8.26.2013
                "noBookmarks": "Žádné záložky", // added 8.26.2013
                "layerVisible": "Viditelnost vrstvy", // added 8.26.2013
                "flagAppropriate": "Označit jako nevhodné", // added 8.26.2013
                "flatReporting": "nahlašování", // added 8.26.2013
                "zoomToLabel": "Přiblížit na", // added 8.26.2013
                "contentFlagged": "Obsah označen", // added 8.26.2013
                "locator": "Zobrazit lokátor", // added 8.26.2013
                "tinyUrl": "Zobrazit adresu Tiny Url", // added 8.26.2013
                "refresh": "Obnovit", // added 8.26.2013
                "refreshContext": "Klikněte pro nahrání nových zdrojů." // added 8.26.2013
            },
            "shareMenu": {
                "menuTitle": "Sdílet aktuální zobrazení",
                "shareHeader": "Sdílet odkaz na vaši webovou aplikaci",
                "facebook": "Facebook",
                "facebookHeader": "Sdílet na Facebooku",
                "twitter": "Twitter",
                "twitterHeader": "Sdílet na Twitteru",
                "instructionHeader": "Zkopírujte a vložte tento HTML kód do svých webových stránek.",
                "preview": "Zobrazit náhled a přizpůsobit"
            },
            "itemInfo": {
                "createdLabel": "vytvořeno",
                "ratingsLabel": "hodnocení",
                "ratingsLabelPlural": "hodnocení",
                "viewsLabel": "zobrazení",
                "viewsLabelPlural": "zobrazení",
                "commentsLabel": "komentář",
                "commentsLabelPlural": "komentáře",
                "modifiedLabel": "Naposledy upraveno",
                "by": "podle",
                "separator": ","
            },
            "social": {
                "menuTitle": "Vrstvy sociálních médií",
                "screenName": "Zobrazované jméno",
                "signIn": "Přihlásit se",
                "switchAccount": "Přepnout účet"
            },
            "preview": {
                "minWidth": "Minimální šířka je",
                "minHeight": "Minimální výška je",
                "maxWidth": "Maximální šířka je",
                "maxHeight": "Maximální výška je",
                "customize": "Upravit",
                "small": "Malé",
                "medium": "Střední",
                "large": "Velké",
                "custom": "Vlastní",
                "embed": "Vložit",
                "instruction": "Zkopírujte a vložte následující HTML kód pro vložení mapy do svých webových stránek."
            },
            "flickr": {
                "title": "Flickr",
                "description": "Fotky z Flickru"
            },
            "twitter": {
                "title": "Twitter",
                "description": "Tweety z Twitteru"
            },
            "youtube": {
                "title": "YouTube",
                "description": "YouTube videa"
            },
            "panoramio": {
                "title": "Panoramio",
                "description": "Fotky z Panoramia"
            },
            "ushahidi": {
                "title": "Ushahidi",
                "description": "Hlášení o událostech z Ushahidi"
            }
        }
    })
);