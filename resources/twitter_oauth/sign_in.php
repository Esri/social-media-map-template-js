<?php

// Load required lib files.
session_start();
session_destroy();
session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('config.php');
header('Content-Type: application/json');

// connect to twitter
$auth_connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET);

// Get temporary credentials.
$request_token = $auth_connection->getRequestToken(OAUTH_CALLBACK);

// Save temporary credentials to session.
$_SESSION['oauth_token'] = $request_token['oauth_token'];
$_SESSION['oauth_token_secret'] = $request_token['oauth_token_secret'];

if(isset($_SERVER['HTTP_REFERER'])){
    $_SESSION['oauth_referrer'] = $_SERVER['HTTP_REFERER'];
}

if($auth_connection->http_code == 200){
    // Build authorize URL and redirect user to Twitter
    $url = $auth_connection->getAuthorizeURL($request_token['oauth_token'], true);
}

// redirect
if(isset($url)){
    header('Location: '.$url);
}
else{
    header('Location: '.OAUTH_CALLBACK);
}
exit;
