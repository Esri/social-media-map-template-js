﻿define(
({
        "viewer": {
            "main": {
                "scaleBarUnits": "metric",
                "timePattern": "h:mma", // added 2.5.2013
                "datePattern": "MMM d, yyyy" // added 2.5.2013
            },
            "applicationTitle": {
                "PIM": "Carte d\'informations publique" // added 8.26.2013
            },
            "hashTagLabel": {
                "hashTagFlickr": "Hashtag utilisé pour Flickr", // added 8.26.2013
                "hashTagTwitter": "Hashtag utilisé pour Twitter", // added 8.26.2013
                "hashTagYoutube": "Hashtag utilisé pour YouTube" // added 8.26.2013
            },
            "errors": {
                "createMap": "Impossible de créer la carte",
                "general": "Erreur",
                "bingError": "Le déploiement de cette application nécessite votre propre clé Bing Maps.",
                "noLegend": "Aucune légende.",
                "heatmap": "La création des cartes de densité n\'est pas prise en charge sur ce navigateur.",
                "noText": "Entrez l\'emplacement à rechercher.",
                "noLocation": "L\'emplacement est introuvable.",
                "integersOnly": "Vous ne pouvez entrer que des entiers dans ce champ.",
                "nodesc": "Aucune description.",
                "notAvailable": "Non disponible", // added 8.26.2013
                "outsideArea": "Vous êtes actuellement en-dehors de la zone prise en charge", // added 8.26.2013
                "geoLocationTimeOut": "Délai d\'expiration dépassé. Impossible de réaliser l\'opération", // added 8.26.2013
                "positionUnavailable": "Position non disponible", // added 8.26.2013
                "permissionDenied": "Autorisation de localisation de l\'emplacement actuel refusée", // added 8.26.2013
                "unknownError": "Une erreur inconnue est survenue. Impossible de localiser l\'emplacement actuel", // added 8.26.2013
                "tinyURLError": "Impossible de générer l\'URL réduite", // added 8.26.2013
                "invalidSearch": "Recherche non valide" // added 8.26.2013
            },
            "legend": {
                "menuTitle": "Légende"
            },
            "search": {
                "location": "Emplacement",
                "clearLocation": "Effacer l\'emplacement",
                "placeholder": "Rechercher un site"
            },
            "layers": {
                "menuTitle": "Couches"
            },
            "locator": {
                "menuTitle": "Adresse de recherche" // added 8.26.2013
            },
            "layer": {
                "information": "Informations",
                "transparency": "Transparence",
                "searchSettings": "Paramètres de recherche",
                "filteredBy": "filtrés par :"
            },
            "general": {
                "at": "sur",
                "of": "de",
                "homeExtent": "Charger l\'affichage d\'accueil",
                "ok": "OK",
                "close": "Fermer"
            },
            "basemap": {
                "menuTitle": "Sélectionner un fond de carte"
            },
            "settings": {
                "title": "Paramètres",
                "searchAll": "Rechercher tout",
                "usingThisKeyword": "Avec des mots-clés",
                "search": "Rechercher",
                "fromThePast": "Du/de la",
                "today": "Jour précédent",
                "this_week": "Semaine précédente",
                "this_month": "Mois précédent",
                "all_time": "Tout le temps",
                "atLocation": "A cet emplacement",
                "centerOfMap": "Centre de la carte",
                "centerOfMapTitle": "Utiliser le centre de la carte",
                "withinThisDistance": "A cette distance",
                "latitude": "Lat :",
                "longitude": "Long :",
                "locationText": "cliquez sur la carte pour définir l\'origine",
                "twSearch": "Mode d\'utilisation de la recherche Twitter avancée",
                "screenName": "Nom d\'écran", // added 8.26.2013
                "signIn": "Se connecter", // added 8.26.2013
                "switchAccount": "Changer de compte" // added 8.26.2013
            },
            "autoComplete": {
                "menuTitle": "Résultats&hellip;"
            },
            "places": {
                "menuTitle": "Lieux enregistrés",
                "places": "Géosignets",
                "placesTitle": "Ajouter un géosignet aux sites",
                "myLocation": "Mon emplacement actuel",
                "myLocationTitle": "Centrer la carte sur mon emplacement"
            },
            "distanceSlider": {
                "local": "Local",
                "regional": "Régional",
                "national": "National"
            },
            "about": {
                "title": "A propos",
                "access": "Contraintes d\’accès et d\’utilisation"
            },
            "buttons": {
                "legend": "Légende",
                "legendTitle": "Afficher la légende",
                "basemap": "Fond de carte",
                "basemapTitle": "Changer de fond de carte",
                "layers": "Couches",
                "layersTitle": "Explorer les couches",
                "social": "Social",
                "socialTitle": "Réseau social",
                "link": "Lien",
                "linkTitle": "Partager cette application Web",
                "about": "A propos",
                "aboutTitle": "A propos de cette carte",
                "displayAs": "Afficher comme",
                "point": "Points",
                "cluster": "Agrégats",
                "heatmap": "Densité", // added 8.26.2013
                "map": "Carte", // added 8.26.2013
                "share": "Partager", // added 8.26.2013
                "home": "Accueil", // added 8.26.2013
                "bookmarks": "Géosignets", // added 8.26.2013
                "noBookmarks": "Aucun géosignet", // added 8.26.2013
                "layerVisible": "Visibilité des couches", // added 8.26.2013
                "flagAppropriate": "Signaler comme inapproprié", // added 8.26.2013
                "flatReporting": "signalement", // added 8.26.2013
                "zoomToLabel": "Zoom", // added 8.26.2013
                "contentFlagged": "Contenu signalé", // added 8.26.2013
                "locator": "Afficher le localisateur", // added 8.26.2013
                "tinyUrl": "Afficher l\'URL réduite", // added 8.26.2013
                "refresh": "Actualiser", // added 8.26.2013
                "refreshContext": "Cliquez pour charger de nouveaux flux." // added 8.26.2013
            },
            "shareMenu": {
                "menuTitle": "Partager la vue actuelle",
                "shareHeader": "Partager un lien vers votre application Web",
                "facebook": "Facebook",
                "facebookHeader": "Partager sur Facebook",
                "twitter": "Twitter",
                "twitterHeader": "Partager sur Twitter",
                "instructionHeader": "Copiez/collez le code HTML dans votre page Web",
                "preview": "Aperçu et personnalisation"
            },
            "itemInfo": {
                "createdLabel": "créé(e)",
                "ratingsLabel": "évaluation",
                "ratingsLabelPlural": "évaluations",
                "viewsLabel": "vue",
                "viewsLabelPlural": "vues",
                "commentsLabel": "commentaire",
                "commentsLabelPlural": "commentaires",
                "modifiedLabel": "Dernière modification",
                "by": "par",
                "separator": ","
            },
            "social": {
                "menuTitle": "Couches de réseaux sociaux",
                "screenName": "Nom d\'écran",
                "signIn": "Se connecter",
                "switchAccount": "Changer de compte"
            },
            "preview": {
                "minWidth": "La largeur minimale est",
                "minHeight": "La hauteur minimale est",
                "maxWidth": "La largeur maximale est",
                "maxHeight": "La hauteur maximale est",
                "customize": "Personnaliser",
                "small": "Petit",
                "medium": "Moyen",
                "large": "Grand",
                "custom": "Personnalisé",
                "embed": "Incorporer",
                "instruction": "Copiez et collez le code HTML suivant pour incorporer la carte dans votre site Web."
            },
            "flickr": {
                "title": "Flickr",
                "description": "Photos de Flickr"
            },
            "twitter": {
                "title": "Twitter",
                "description": "Tweets de Twitter"
            },
            "youtube": {
                "title": "YouTube",
                "description": "Vidéos de YouTube"
            },
            "panoramio": {
                "title": "Panoramio",
                "description": "Photos de Panoramio"
            },
            "ushahidi": {
                "title": "Ushahidi",
                "description": "Rapports d\'incidents d\'Ushahidi"
            }
        }
    })
);