function addReportInAppButton() {
    if (configOptions.bannedUsersService) {
        removeReportInAppButton();
        var html = '<span id="inFlag"><a id="reportItem">Flag as inappropriate</a></span>';
        dojo.place(html, dojo.query('.esriPopup .actionList')[0], 'last');
        configOptions.flagConnect = dojo.connect(dojo.byId('reportItem'), 'onclick', function(event) {
            var node = dojo.byId('inFlag');
            if (node) {
                node.innerHTML = '<span id="reportLoading"></span> Reporting&hellip;';
                showLoading('reportLoading');
                ReportInapp();
            }
        });
    }
}

function removeReportInAppButton() {
    dojo.query('#inFlag').orphan();
}

function replaceFlag() {
    var node = dojo.byId('inFlag');
    if (node) {
        node.innerHTML = '<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>';
    }
}

function replaceFlagError() {
    console.log('bleh');
    var node = dojo.byId('inFlag');
    if (node) {
        node.innerHTML = 'Error flagging content.';
    }
}

function ReportInapp() {
    if (configOptions.bannedUsersService && configOptions.flagMailServer) {
        var requestHandle = esri.request({
            url: configOptions.flagMailServer,
            content: {
                "op": "send",
                "auth": "esriadmin",
                "author": configOptions.activeFeature.attributes.filterAuthor,
                "appname": configOptions.itemInfo.item.title,
                "type": configOptions.activeFeature.attributes.filterType,
                "content": configOptions.activeFeature.attributes.filterContent
            },
            handleAs: 'json',
            callbackParamName: 'callback',
            // on load
            load: function() {
                replaceFlag();
            },
            error: function() {
                replaceFlagError();
            }
        });
    } else {
        replaceFlagError();
    }
}

function createSMFOffensive() {
    if (configOptions.bannedUsersService) {
        // offensive users task
        configOptions.bannedUsersTask = new esri.tasks.QueryTask(configOptions.bannedUsersService);
        // offensive users query
        configOptions.bannedUsersQuery = new esri.tasks.Query();
        configOptions.bannedUsersQuery.where = '1=1';
        configOptions.bannedUsersQuery.returnCountOnly = false;
        configOptions.bannedUsersQuery.returnIdsOnly = false;
        configOptions.bannedUsersQuery.outFields = ["type", "author"];
        configOptions.bannedUsersTask.execute(configOptions.bannedUsersQuery, function(fset) {
            // Banned twitter users
            if (!configOptions.filterTwitterUsers) {
                configOptions.filterTwitterUsers = [];
            }
            // Banned flickr users
            if (!configOptions.filterFlickrUsers) {
                configOptions.filterFlickrUsers = [];
            }
            // Banned youtube users
            if (!configOptions.filterYoutubeUsers) {
                configOptions.filterYoutubeUsers = [];
            }
            // features
            var features = fset.features;
            // for each feature
            for (var i = 0; i < features.length; i++) {
                // add to twitter list
                if (parseInt(features[i].attributes.type, 10) === 2) {
                    configOptions.filterTwitterUsers.push(features[i].attributes.author);
                }
                // add to youtube list
                else if (parseInt(features[i].attributes.type, 10) === 3) {
                    configOptions.filterYoutubeUsers.push(features[i].attributes.author);
                }
                // add to flickr list
                else if (parseInt(features[i].attributes.type, 10) === 4) {
                    configOptions.filterFlickrUsers.push(features[i].attributes.author);
                }
            }
        });
    }
}

function createSMFBadWords() {
    configOptions.filterWords = [];
    if (configOptions.bannedWordsService) {
        configOptions.bannedWordsTask = new esri.tasks.QueryTask(configOptions.bannedWordsService);
        configOptions.bannedWordsQuery = new esri.tasks.Query();
        configOptions.bannedWordsQuery.where = '1=1';
        configOptions.bannedWordsQuery.returnGeometry = false;
        configOptions.bannedWordsQuery.outFields = ["word"];
        configOptions.bannedWordsTask.execute(configOptions.bannedWordsQuery, function(fset) {
            for (i = 0; i < fset.features.length; i++) {
                configOptions.filterWords.push(fset.features[i].attributes.word);
            }
        });
    }
}