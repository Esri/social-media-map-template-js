<?php

// Start session and load lib
session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('config.php');

// check if cookie exists
if(isset($_COOKIE[OAUTH_COOKIE])){
    // redirect back to app
    if(isset($_SESSION['oauth_referrer'])){
        header('Location: '.$_SESSION['oauth_referrer']);
        exit;
    }
}
else{
    // if verifier set
    if(isset($_REQUEST['oauth_verifier'])){
        // Create TwitteroAuth object with app key/secret and token key/secret from default phase
        $connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $_SESSION['oauth_token'], $_SESSION['oauth_token_secret']);
        // get access token from twitter
        $access_token = $connection->getAccessToken($_REQUEST['oauth_verifier']);
        // save token
        $_SESSION['oauth_access_token'] = $access_token;
        // 1 year
        $cookie_life = time() + 31536000;
        // set cookie
        setcookie(OAUTH_COOKIE, json_encode($access_token), $cookie_life, '/', OAUTH_COOKIE_DOMAIN);
        header('Location: ./callback.php');
        exit;
    }
    else{
       // redirect
        if(isset($_SESSION['oauth_referrer'])){
            header('Location: '.$_SESSION['oauth_referrer']);
        }
        else{
            header('Location: '.OAUTH_CALLBACK);
        }
        exit;
    }
}
