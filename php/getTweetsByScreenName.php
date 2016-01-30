<?php

require_once('TwitterAPIExchange.php');

$screenName = $_POST['screenName'];
$numberOfTweets = $_POST['numberOfTweets'];

/** Set access tokens here - see: https://dev.twitter.com/apps/ **/
$settings = array(
                  'oauth_access_token' => "2904655547-KxHeePRNfrhPvlhM3EWvTlDeDfrM2ZrL4U5Y6tE",
                  'oauth_access_token_secret' => "VkOwKfbaJry1ZNYtWDLap6RtVBdj99AUvG1aPLZKT891s",
                  'consumer_key' => "wIFJMsCPIOkRFHwjFF7EkQ5Df",
                  'consumer_secret' => "Q0eg0uxOAx36s3trFbw7Fwt8h4ykcRTLs8d5OZOY3cM20uBFwv"
                  );

$url = "https://api.twitter.com/1.1/statuses/user_timeline.json";

$requestMethod = "GET";

$getfield = '?screen_name='.$screenName.'&count='.$numberOfTweets.'&include_rts=false';

$twitter = new TwitterAPIExchange($settings);

$temp = $twitter->setGetfield($getfield)
->buildOauth($url, $requestMethod)
->performRequest();

echo $temp;

?>
