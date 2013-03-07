<?php

// Start session and load lib
session_start();
require_once('twitteroauth/twitteroauth.php');
require_once('config.php');

if(isset($_SERVER['HTTP_REFERER'])){
    $referrer = $_SERVER['HTTP_REFERER'];
}

// delete session
session_destroy();

// delete cookie
setcookie(OAUTH_COOKIE, "", time() - 3600, '/', OAUTH_COOKIE_DOMAIN);

// redirect
if(isset($referrer)){
    header('Location: '.$referrer);
} else {
    header('Location: ./index.php');
}
