define(
({
        "viewer": {
            "main": {
                "scaleBarUnits": "metric",
                "timePattern": "h:mma", // added 2.5.2013
                "datePattern": "yyyy'年'M'月'd'日'" // added 2.5.2013
            },
            "applicationTitle": {
                "PIM": "一般情報マップ" // added 8.26.2013
            },
            "hashTagLabel": {
                "hashTagFlickr": "Flickr に使用される #タグ", // added 8.26.2013
                "hashTagTwitter": "Twitter に使用される #タグ", // added 8.26.2013
                "hashTagYoutube": "YouTube に使用される #タグ" // added 8.26.2013
            },
            "errors": {
                "createMap": "マップを作成できません",
                "general": "エラー",
                "bingError": "このアプリケーションを導入するには、ユーザ自身の Bing Maps キーが必要です。",
                "noLegend": "凡例がありません。",
                "heatmap": "このブラウザでは、ヒートマッピングはサポートされていません。",
                "noText": "検索場所を入力してください。",
                "noLocation": "場所が見つかりませんでした。",
                "integersOnly": "このフィールドには、整数だけを入力できます。",
                "nodesc": "説明がありません。",
                "notAvailable": "使用できません", // added 8.26.2013
                "outsideArea": "サポート領域外です", // added 8.26.2013
                "geoLocationTimeOut": "タイムアウト時間を超えました。操作を実行できません。", // added 8.26.2013
                "positionUnavailable": "ポジションは利用不可", // added 8.26.2013
                "permissionDenied": "現在の位置を特定する権限が拒否されました", // added 8.26.2013
                "unknownError": "不明なエラーが発生しました。現在の位置を特定できません", // added 8.26.2013
                "tinyURLError": "TinyURL を生成できません", // added 8.26.2013
                "invalidSearch": "無効な検索" // added 8.26.2013
            },
            "legend": {
                "menuTitle": "凡例"
            },
            "search": {
                "location": "位置",
                "clearLocation": "場所の消去",
                "placeholder": "場所の検索"
            },
            "layers": {
                "menuTitle": "レイヤ"
            },
            "locator": {
                "menuTitle": "検索アドレス" // added 8.26.2013
            },
            "layer": {
                "information": "情報",
                "transparency": "透過表示",
                "searchSettings": "検索設定",
                "filteredBy": "フィルタ:"
            },
            "general": {
                "at": "位置",
                "of": "/",
                "homeExtent": "ホーム ビューを読み込む",
                "ok": "OK",
                "close": "閉じる"
            },
            "basemap": {
                "menuTitle": "ベースマップの選択"
            },
            "settings": {
                "title": "設定",
                "searchAll": "すべてを検索",
                "usingThisKeyword": "キーワードの使用",
                "search": "検索",
                "fromThePast": "過去",
                "today": "日",
                "this_week": "週",
                "this_month": "月",
                "all_time": "すべて",
                "atLocation": "この場所",
                "centerOfMap": "マップの中央",
                "centerOfMapTitle": "マップの中央を使用",
                "withinThisDistance": "この距離内",
                "latitude": "緯度:",
                "longitude": "経度:",
                "locationText": "マップをクリックして原点を設定します",
                "twSearch": "Twitter の詳細検索の使用方法",
                "screenName": "画面名", // added 8.26.2013
                "signIn": "サイン イン", // added 8.26.2013
                "switchAccount": "アカウントの切り替え" // added 8.26.2013
            },
            "autoComplete": {
                "menuTitle": "結果&hellip;"
            },
            "places": {
                "menuTitle": "ブックマークした場所",
                "places": "ブックマーク",
                "placesTitle": "場所のブックマーク",
                "myLocation": "現在の場所",
                "myLocationTitle": "マップの中央を現在の位置に設定"
            },
            "distanceSlider": {
                "local": "ローカル",
                "regional": "地域",
                "national": "国"
            },
            "about": {
                "title": "情報",
                "access": "アクセスと使用の制限"
            },
            "buttons": {
                "legend": "凡例",
                "legendTitle": "凡例を表示",
                "basemap": "ベースマップ",
                "basemapTitle": "ベースマップの切り替え",
                "layers": "レイヤ",
                "layersTitle": "レイヤの操作",
                "social": "ソーシャル",
                "socialTitle": "ソーシャル メディア",
                "link": "リンク",
                "linkTitle": "この Web アプリケーションを共有",
                "about": "情報",
                "aboutTitle": "このマップについて",
                "displayAs": "表示方法",
                "point": "ポイント",
                "cluster": "クラスタ",
                "heatmap": "密度", // added 8.26.2013
                "map": "マップ", // added 8.26.2013
                "share": "共有", // added 8.26.2013
                "home": "ホーム", // added 8.26.2013
                "bookmarks": "ブックマーク", // added 8.26.2013
                "noBookmarks": "ブックマークがありません", // added 8.26.2013
                "layerVisible": "レイヤの可視性", // added 8.26.2013
                "flagAppropriate": "不適切を示すフラグ", // added 8.26.2013
                "flatReporting": "レポート", // added 8.26.2013
                "zoomToLabel": "ズーム", // added 8.26.2013
                "contentFlagged": "コンテンツにフラグが立てられました", // added 8.26.2013
                "locator": "ロケータの表示", // added 8.26.2013
                "tinyUrl": "Tiny Url の表示", // added 8.26.2013
                "refresh": "更新", // added 8.26.2013
                "refreshContext": "クリックして新しいフィードを読み込みます。" // added 8.26.2013
            },
            "shareMenu": {
                "menuTitle": "現在のビューの共有",
                "shareHeader": "Web アプリケーションへのリンクを共有",
                "facebook": "Facebook",
                "facebookHeader": "Facebook で共有",
                "twitter": "Twitter",
                "twitterHeader": "Twitter で共有",
                "instructionHeader": "HTML を Web ページにコピー/貼り付け",
                "preview": "プレビューとカスタマイズ"
            },
            "itemInfo": {
                "createdLabel": "作成された",
                "ratingsLabel": "評価",
                "ratingsLabelPlural": "評価",
                "viewsLabel": "ビュー",
                "viewsLabelPlural": "ビュー",
                "commentsLabel": "コメント",
                "commentsLabelPlural": "コメント",
                "modifiedLabel": "最終更新日",
                "by": "作成者",
                "separator": ","
            },
            "social": {
                "menuTitle": "ソーシャル メディア レイヤ",
                "screenName": "画面名",
                "signIn": "サイン イン",
                "switchAccount": "アカウントの切り替え"
            },
            "preview": {
                "minWidth": "最小の幅",
                "minHeight": "最小の高さ",
                "maxWidth": "最大の幅",
                "maxHeight": "最大の高さ",
                "customize": "カスタマイズ",
                "small": "小",
                "medium": "中",
                "large": "大",
                "custom": "カスタム",
                "embed": "埋め込み",
                "instruction": "次の HTML をコピーして貼り付けることで、マップを Web サイトに埋め込みます。"
            },
            "flickr": {
                "title": "Flickr",
                "description": "Flickr の写真"
            },
            "twitter": {
                "title": "Twitter",
                "description": "Twitter のツイート"
            },
            "youtube": {
                "title": "YouTube",
                "description": "YouTube の動画"
            },
            "panoramio": {
                "title": "Panoramio",
                "description": "Panoramio からの写真"
            },
            "ushahidi": {
                "title": "Ushahidi",
                "description": "Ushahidi からのインシデント レポート"
            }
        }
    })
);