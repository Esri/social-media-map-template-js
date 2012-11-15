/*------------------------------------*/
// SHOW SMFAI RESULTS
/*------------------------------------*/

function showSMFAIResults(featureSet) {
    if(featureSet && featureSet.features) {
        dojo.forEach(featureSet.features, function (feature, index) {
            var featureObj = {
            	id: index,
                type: feature.attributes.type,
                author: feature.attributes.author
            };
            var dontAdd = SMFAI_LUT.get(featureObj);
            if(!dontAdd) {
                SMFAI_LUT.add(featureObj);
            }
            else {
                console.log('duplicate');
            }
        });
    }
}
/*------------------------------------*/
// GET SM LOOKUP
/*------------------------------------*/

function getSMLookup() {
    if(userConfig.inappSvcURL && SMFAIQuery) {
        SMFAIQueryTask.execute(SMFAIQuery, function (fset) {
            showSMFAIResults(fset);
        });
    }
}
/*------------------------------------*/
// Send Report Email Notification
/*------------------------------------*/

function sendReportEmail() {
    //clear any existing timer
    clearTimeout(emailTimer);
    // pop open email after delay for apply edits
    emailTimer = setTimeout(function () {
        if(mailString) {
            window.location.href = mailString;
        }
    }, 500);
}
/*------------------------------------*/
// Replace Flag
/*------------------------------------*/

function replaceFlag() {
    $('#inFlag').html('<span id="inFlagComplete"><span class="LoadingComplete"></span>Content flagged</span>');
}
/*------------------------------------*/
// REPORT IN APP
/*------------------------------------*/

function ReportInapp() {
    if(userConfig.proxyURL && userConfig.inappSvcURL && userConfig.mailServer) {
        $.ajax({
            url: userConfig.mailServer,
            data: {
                "op": "send",
                "auth": "esriadmin",
                "author": inappFeat.attributes.author,
                "appname": userConfig.appName,
                "type": inappFeat.attributes.type,
                "content": inappFeat.attributes.content
            },
            dataType: 'jsonp',
            success: function (result, textStatus, jqXHR) {
                replaceFlag();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                sendReportEmail();
                replaceFlag();
            }
        });
    }
    else {
        replaceFlag();
        sendReportEmail();
    }
}


/*------------------------------------*/
// create the offensive users filter
/*------------------------------------*/

function createSMFOffensive() {
    // offensive users data store
    SMFAI_LUT = new dojo.store.Memory();
    if(userConfig.inappSvcURL) {
        // offensive users task
        SMFAIQueryTask = new esri.tasks.QueryTask(userConfig.inappSvcURL);
        // offensive users query
        SMFAIQuery = new esri.tasks.Query();
        SMFAIQuery.where = '1=1';
        SMFAIQuery.returnCountOnly = false;
        SMFAIQuery.returnIdsOnly = false;
        SMFAIQuery.outFields = ["*"];
    }
}
/*------------------------------------*/
// Bad words list
/*------------------------------------*/

function createSMFBadWords() {
    // BAD WORDS LIST
    badWordsList = [];
    if(userConfig.badWordsURL) {
        // Bad Words Task
        badWordsTask = new esri.tasks.QueryTask(userConfig.badWordsURL);
        // Bad Words Query
        badWordsQuery = new esri.tasks.Query();
        badWordsQuery.where = '1=1';
        badWordsQuery.returnGeometry = false;
        badWordsQuery.outFields = ["word"];
        badWordsTask.execute(badWordsQuery, function (fset) {
            for(i = 0; i < fset.features.length; i++) {
                badWordsList.push(fset.features[i].attributes.word);
            }
        });
    }
}


/*------------------------------------*/
    // INAPPROPRIATE ONCLICK
    /*------------------------------------*/
    $(document).on('click', '#reportItem', function (event) {
    	$('#inFlag').html('<span id="reportLoading"></span> Reporting&hellip;');
    	showLoading('reportLoading');
        ReportInapp();
    });