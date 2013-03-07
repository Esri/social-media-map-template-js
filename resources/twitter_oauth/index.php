<?php

// Load required lib files.
session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('config.php');
header('Content-Type: application/json');

if(isset($_COOKIE[OAUTH_COOKIE])){
    // get access token from cookie
    $access_token = json_decode($_COOKIE[OAUTH_COOKIE], true);
}
else{
    $access_token = false;
}

// if token exists
if (isset($access_token['oauth_token']) && isset($access_token['oauth_token_secret'])) {
    // Create a TwitterOauth object with consumer/user tokens.
    $connection = new TwitterOAuth(CONSUMER_KEY, CONSUMER_SECRET, $access_token['oauth_token'], $access_token['oauth_token_secret']);
    // if invalid response
    if ($connection->http_code === 200 || $connection->http_code === 401) {
        $content = array('signedout'=>true);
    }
    else{
        // query params
        $params = array();
        if(isset($_REQUEST['q'])){
            $params['q'] = $_REQUEST['q'];
        }
        if(isset($_REQUEST['count'])){
            $params['count'] = $_REQUEST['count'];
        }
        if(isset($_REQUEST['result_type'])){
            $params['result_type'] = $_REQUEST['result_type'];
        }
        if(isset($_REQUEST['geocode'])){
            $params['geocode'] = $_REQUEST['geocode'];
        }
        if(isset($_REQUEST['max_id'])){
            $params['max_id'] = $_REQUEST['max_id'];
        }
        if(isset($_REQUEST['since_id'])){
            $params['since_id'] = $_REQUEST['since_id'];
        }
        if(isset($_REQUEST['include_entities'])){
            $params['include_entities'] = $_REQUEST['include_entities'];
        }
        if(isset($_REQUEST['lang'])){
            $params['lang'] = $_REQUEST['lang'];
        }
        if(isset($_REQUEST['until'])){
            $params['until'] = $_REQUEST['until'];
        }
        if(isset($_REQUEST['locale'])){
            $params['locale'] = $_REQUEST['locale'];
        }
        // call search
        $content = $connection->get('search/tweets', $params);
        // if errors, signed out
        if (isset($content->errors) && count($content->errors)) {
            $content = array('signedout'=>true);
        }
    }
} else {
    // signed out
    $content = array('signedout'=>true);
}

// if callback set
if (isset($_REQUEST['callback'])) {
    echo $_REQUEST['callback'] . '(' . json_encode($content) . ');';
} else {
    echo json_encode($content);
}
