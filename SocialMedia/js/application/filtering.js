function showSMFAIResults(featureSet) {
    if (featureSet && featureSet.features) {
        dojo.forEach(featureSet.features, function(feature, index) {
            var featureObj = {
                id: index,
                type: feature.attributes.type,
                author: feature.attributes.author
            };
            var dontAdd = configOptions.bannedUsers.get(featureObj);
            if (!dontAdd) {
                configOptions.bannedUsers.add(featureObj);
            }
        });
    }
}

function replaceFlag() {
    var node = dojo.byId('inFlag');
    if (node) {
        node.innerHTML = '<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>';
    }
}

function replaceFlagError() {
    var node = dojo.byId('inFlag');
    if (node) {
        node.innerHTML = 'Error flagging content.';
    }
}

function ReportInapp() {
    if (configOptions.proxyURL && configOptions.bannedUsersService && configOptions.flagMailServer) {
        var requestHandle = esri.request({
            url: configOptions.flagMailServer,
            content: {
                "op": "send",
                "auth": "esriadmin",
                "author": inappFeat.attributes.author,
                "appname": configOptions.appName,
                "type": inappFeat.attributes.type,
                "content": inappFeat.attributes.content
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
        // offensive users data store
        configOptions.bannedUsers = new dojo.store.Memory();
        // offensive users task
        configOptions.bannedUsersTask = new esri.tasks.QueryTask(configOptions.bannedUsersService);
        // offensive users query
        configOptions.bannedUsersQuery = new esri.tasks.Query();
        configOptions.bannedUsersQuery.where = '1=1';
        configOptions.bannedUsersQuery.returnCountOnly = false;
        configOptions.bannedUsersQuery.returnIdsOnly = false;
        configOptions.bannedUsersQuery.outFields = ["*"];
        configOptions.bannedUsersTask.execute(configOptions.bannedUsersQuery, function(fset) {
            showSMFAIResults(fset);
        });
    }
}

function createSMFBadWords() {
    configOptions.bannedWords = [];
    if (configOptions.bannedWordsService) {
        configOptions.bannedWordsTask = new esri.tasks.QueryTask(configOptions.bannedWordsService);
        configOptions.bannedWordsQuery = new esri.tasks.Query();
        configOptions.bannedWordsQuery.where = '1=1';
        configOptions.bannedWordsQuery.returnGeometry = false;
        configOptions.bannedWordsQuery.outFields = ["word"];
        configOptions.bannedWordsTask.execute(configOptions.bannedWordsQuery, function(fset) {
            for (i = 0; i < fset.features.length; i++) {
                configOptions.bannedWords.push(fset.features[i].attributes.word);
            }
        });
    }
}

if (configOptions.bannedUsersService) {
    dojo.require("dojo.store.Memory");
}

dojo.addOnLoad(function() {
    if (configOptions.bannedUsersService) {
        dojo.query(document).delegate(dojo.query('#reportItem'), 'click', function(event) {
            var node = dojo.byId('inFlag');
            if (node) {
                node.innerHTML = '<span id="reportLoading"></span> Reporting&hellip;';
                showLoading('reportLoading');
                ReportInapp();
            }
        });
    }
});