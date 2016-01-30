<?php

ini_set('display_errors', 1);

if (isset($_POST['id'])) {

  getTweetsById($_POST['id']);

  function getTweetsById($x) {
           // your business logic
   echo "PROVA RIUSCITA";
   echo $x;
 }

}

?>

<?php
$jqueryVariable = $_POST['variable'];



echo $jqueryVariable;
echo "RITORNOQUELLOCHEVOGLIO";

?>

<?php
  echo "<h2>First Test</h2>";

  require_once('TwitterAPIExchange.php');

  /** Set access tokens here - see: https://dev.twitter.com/apps/ **/
  $settings = array(
                    'oauth_access_token' => "2904655547-KxHeePRNfrhPvlhM3EWvTlDeDfrM2ZrL4U5Y6tE",
                    'oauth_access_token_secret' => "VkOwKfbaJry1ZNYtWDLap6RtVBdj99AUvG1aPLZKT891s",
                    'consumer_key' => "wIFJMsCPIOkRFHwjFF7EkQ5Df",
                    'consumer_secret' => "Q0eg0uxOAx36s3trFbw7Fwt8h4ykcRTLs8d5OZOY3cM20uBFwv"
                    );

  $url = "https://api.twitter.com/1.1/statuses/user_timeline.json";

  $requestMethod = "GET";

  $getfield = '?screen_name=KirkDBorne&count=2';

  $twitter = new TwitterAPIExchange($settings);
  echo $twitter->setGetfield($getfield)
  ->buildOauth($url, $requestMethod)
  ->performRequest();

  $temp = $twitter->setGetfield($getfield)
  ->buildOauth($url, $requestMethod)
  ->performRequest();

  $string = json_decode($twitter->setGetfield($getfield)
                        ->buildOauth($url, $requestMethod)
                        ->performRequest(),$assoc = TRUE);
  if($string["errors"][0]["message"] != "") {echo "<h3>Sorry, there was a problem.</h3><p>Twitter returned the following error message:</p><p><em>".$string[errors][0]["message"]."</em></p>";exit();}

  echo "<pre>";
  print_r($string);
  echo "</pre>";

  echo "<h3>Ok</h3>";

  ?>
