define(
({
        "viewer": {
            "main": {
                "scaleBarUnits": "metric",
                "timePattern": "h:mma", // added 2.5.2013
                "datePattern": "MMM d, yyyy" // added 2.5.2013
            },
            "applicationTitle": {
                "PIM": "공공 정보 맵" // added 8.26.2013
            },
            "hashTagLabel": {
                "hashTagFlickr": "#Flickr용 태그", // added 8.26.2013
                "hashTagTwitter": "#Twitter용 태그", // added 8.26.2013
                "hashTagYoutube": "#YouTube용 태그" // added 8.26.2013
            },
            "errors": {
                "createMap": "맵을 생성할 수 없음",
                "general": "오류",
                "bingError": "이 응용프로그램을 보급하려면 자체 Bing 맵 키가 필요합니다.",
                "noLegend": "범례가 없습니다.",
                "heatmap": "Heatmapping은 이 브라우저에서 지원되지 않습니다.",
                "noText": "검색 위치를 입력하세요.",
                "noLocation": "위치를 찾을 수 없습니다.",
                "integersOnly": "이 필드에는 정수만 입력할 수 있습니다.",
                "nodesc": "설명이 없습니다.",
                "notAvailable": "사용할 수 없음", // added 8.26.2013
                "outsideArea": "현재 지원되는 영역을 벗어나 있습니다.", // added 8.26.2013
                "geoLocationTimeOut": "제한 시간이 초과되었습니다. 작업을 수행할 수 없습니다.", // added 8.26.2013
                "positionUnavailable": "배치할 수 없음", // added 8.26.2013
                "permissionDenied": "현재 위치를 찾을 수 있는 권한이 거부되었습니다.", // added 8.26.2013
                "unknownError": "알 수 없는 오류가 발생했습니다. 현재 위치를 찾을 수 없습니다.", // added 8.26.2013
                "tinyURLError": "TinyURL을 생성할 수 없습니다.", // added 8.26.2013
                "invalidSearch": "잘못된 검색" // added 8.26.2013
            },
            "legend": {
                "menuTitle": "범례"
            },
            "search": {
                "location": "위치",
                "clearLocation": "설명 지우기",
                "placeholder": "장소 찾기"
            },
            "layers": {
                "menuTitle": "레이어"
            },
            "locator": {
                "menuTitle": "주소 검색" // added 8.26.2013
            },
            "layer": {
                "information": "정보",
                "transparency": "투명도",
                "searchSettings": "검색 설정",
                "filteredBy": "필터 기준:"
            },
            "general": {
                "at": "위치",
                "of": "/",
                "homeExtent": "홈 뷰 로드",
                "ok": "확인",
                "close": "닫기"
            },
            "basemap": {
                "menuTitle": "베이스맵 선택"
            },
            "settings": {
                "title": "설정",
                "searchAll": "모두 검색:",
                "usingThisKeyword": "키워드 사용",
                "search": "검색",
                "fromThePast": "이전",
                "today": "일",
                "this_week": "주",
                "this_month": "개월",
                "all_time": "모든 시간",
                "atLocation": "이 위치",
                "centerOfMap": "맵 중심",
                "centerOfMapTitle": "맵 중심 사용",
                "withinThisDistance": "이 거리 이내",
                "latitude": "위도:",
                "longitude": "경도:",
                "locationText": "원점을 설정하려면 맵을 클릭하세요.",
                "twSearch": "고급 Twitter 검색 사용 방법",
                "screenName": "화면 이름", // added 8.26.2013
                "signIn": "로그인", // added 8.26.2013
                "switchAccount": "계정 전환" // added 8.26.2013
            },
            "autoComplete": {
                "menuTitle": "결과&hellip;"
            },
            "places": {
                "menuTitle": "책갈피 위치",
                "places": "책갈피",
                "placesTitle": "책갈피 장소",
                "myLocation": "내 현재 위치",
                "myLocationTitle": "맵 중심을 내 위치로 설정"
            },
            "distanceSlider": {
                "local": "로컬",
                "regional": "지역",
                "national": "국가"
            },
            "about": {
                "title": "정보",
                "access": "제한사항 액세스 및 사용"
            },
            "buttons": {
                "legend": "범례",
                "legendTitle": "범례 표시",
                "basemap": "베이스맵",
                "basemapTitle": "베이스맵 전환",
                "layers": "레이어",
                "layersTitle": "레이어 탐색",
                "social": "소셜",
                "socialTitle": "소셜 미디어",
                "link": "링크",
                "linkTitle": "이 웹 앱 공유",
                "about": "정보",
                "aboutTitle": "이 맵 정보",
                "displayAs": "표시 형식",
                "point": "포인트",
                "cluster": "클러스터",
                "heatmap": "밀도", // added 8.26.2013
                "map": "맵", // added 8.26.2013
                "share": "공유", // added 8.26.2013
                "home": "홈", // added 8.26.2013
                "bookmarks": "책갈피", // added 8.26.2013
                "noBookmarks": "책갈피 없음", // added 8.26.2013
                "layerVisible": "레이어 가시성", // added 8.26.2013
                "flagAppropriate": "부적절한 항목으로 플래그 지정", // added 8.26.2013
                "flatReporting": "보고", // added 8.26.2013
                "zoomToLabel": "확대", // added 8.26.2013
                "contentFlagged": "플래그가 지정된 컨텐츠", // added 8.26.2013
                "locator": "로케이터 표시", // added 8.26.2013
                "tinyUrl": "Tiny Url 표시", // added 8.26.2013
                "refresh": "새로고침", // added 8.26.2013
                "refreshContext": "새 피드를 로드하려면 클릭하세요." // added 8.26.2013
            },
            "shareMenu": {
                "menuTitle": "현재 뷰 공유",
                "shareHeader": "웹 앱 링크 공유",
                "facebook": "Facebook",
                "facebookHeader": "Facebook에서 공유",
                "twitter": "Twitter",
                "twitterHeader": "Twitter에서 공유",
                "instructionHeader": "웹 페이지에 HTML 복사/붙여넣기",
                "preview": "미리보기 및 사용자 정의"
            },
            "itemInfo": {
                "createdLabel": "생성됨",
                "ratingsLabel": "등급",
                "ratingsLabelPlural": "등급",
                "viewsLabel": "뷰",
                "viewsLabelPlural": "뷰",
                "commentsLabel": "설명",
                "commentsLabelPlural": "설명",
                "modifiedLabel": "마지막으로 수정한 날짜",
                "by": "작성자",
                "separator": ","
            },
            "social": {
                "menuTitle": "소셜 미디어 레이어",
                "screenName": "화면 이름",
                "signIn": "로그인",
                "switchAccount": "계정 전환"
            },
            "preview": {
                "minWidth": "최소 너비",
                "minHeight": "최소 높이",
                "maxWidth": "최대 너비",
                "maxHeight": "최대 높이",
                "customize": "사용자 정의",
                "small": "소",
                "medium": "중간",
                "large": "대",
                "custom": "사용자 지정",
                "embed": "포함",
                "instruction": "웹 사이트에 맵을 포함하려면 다음 HTML을 복사하여 붙여넣으세요."
            },
            "flickr": {
                "title": "Flickr",
                "description": "Flickr의 사진"
            },
            "twitter": {
                "title": "Twitter",
                "description": "Twitter의 트윗"
            },
            "youtube": {
                "title": "YouTube",
                "description": "YouTube의 동영상"
            },
            "panoramio": {
                "title": "Panoramio",
                "description": "Panoramio의 사진"
            },
            "ushahidi": {
                "title": "Ushahidi",
                "description": "Ushahidi의 사건 보고서"
            }
        }
    })
);