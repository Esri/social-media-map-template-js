<?php

// Load required lib files.
session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('config.php');
header('Content-Type: application/json');

// check if cookie exists
if(isset($_COOKIE[OAUTH_COOKIE])){
    // remove session
    session_destroy();
    session_start();
    // set referrer url to return to
    if(isset($_SERVER['HTTP_REFERER'])){
        $_SESSION['oauth_referrer'] = $_SERVER['HTTP_REFERER'];
    }
    else{
        $_SESSION['oauth_referrer'] = OAUTH_CALLBACK;
    }
    // remove cookie
    setcookie(OAUTH_COOKIE, json_encode($access_token), time() - 3600, '/', OAUTH_COOKIE_DOMAIN);
    // reload
    header('Location: ./switch_account.php');
    exit;
}
else{
    // connect to twitter
    $auth_connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET);
    // Get temporary credentials.
    $request_token = $auth_connection->getRequestToken(OAUTH_CALLBACK);
    // Save temporary credentials to session.
    $_SESSION['oauth_token'] = $request_token['oauth_token'];
    $_SESSION['oauth_token_secret'] = $request_token['oauth_token_secret'];
    // If last connection failed don't display authorization link.
    switch ($auth_connection->http_code) {
        case 200:
            // Build authorize URL and redirect user to Twitter
            $url = $auth_connection->getAuthorizeURL($request_token['oauth_token'], false).'&force_login=true';
            break;
        default:
            // error code
            $url = $_SESSION['oauth_referrer'];
    }
    // redirect
    if(isset($url)){
        header('Location: '.$url);
    }
    else{
        header('Location: '.OAUTH_CALLBACK);
    }
    exit;
}
