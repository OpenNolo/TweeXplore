var searchBar = d3.select('#search_bar');
var result;
var begin = true;
var downloadableDataset = [];
var datasetsCounter = 1;
var searchPopoverId;

$(function () {
  $('[data-toggle="popover"]').popover();
});


$(function () {
  $('#search').popover('show');
});

function prova () {
  var value = 'MANDOQUELLOCHEVOGLIO';
  if ($(value).val() != 0) {
    $.post("php/jquery2php.php", {
      variable:value
    }, function(data) {
      if (data != "") {
        alert('We sent Jquery string to PHP : ' + data);
      }
    });
  }

}

function setAction (action) {
  forceGraph.setAction(action);
  d3.selectAll('.myButton').style('color', '#ffffff');
  d3.select('.myButton.' + action).style('color', 'yellow');
}

function getUserByScreenName () {
  var screenName = document.getElementById('user_input').value;
  console.log(screenName);
  $.post("php/getUserByScreenName.php", {
    screenName:screenName
  }, function(data) {
    if (data != "") {
      result = JSON.parse(data)[0];
      forceGraph.addUserProfile(result, 0);
    }
  });
  if(begin == true) {
    $('#search').popover('destroy');
    d3.select('#logo').remove();
    d3.select('#top_view').transition().duration(1000).style('height', '85%');
    d3.select('#search_bar').transition().duration(1000).style('height', '15%');
    d3.selectAll('.myButton').transition().style('width', '50%');
    d3.selectAll('.myButton').transition().delay(1000).duration(500).style('opacity', 1);
    begin = false;
    initPopovers();
  }
}

function getTweetsById (userId, numberOfTweets) {
  $.post("php/getTweetsById.php", {
    userId:userId,
    numberOfTweets:numberOfTweets
  }, function(data) {
    if (data != "") {
      alert('Result: ' + data);
    }
  });
}


// put as input id_str and not id!!
function getRetweetsById (tweetId, numberOfRetweets) {
  var result = 'empty';
  $.post("php/getRetweetsById.php", {
    tweetId:tweetId,
    numberOfRetweets:numberOfRetweets
  }, function(data) {
    if (data != "") {
     result = JSON.parse(data);
     console.log(result);
   }
 });
}

function getTweetsByScreenName (screenName, numberOfTweets) {
  $.post("php/getTweetsByScreenName.php", {
    screenName:screenName,
    numberOfTweets:numberOfTweets
  }, function(data) {
    if (data != "") {
      return data;
    }
  });
}

function getLastTweetRetweetsByScreenName (screenName, nodeLevel) {
  var numberOfTweets = 3;
  var numberOfRetweets = document.getElementById('number_retweetters_input').value;
  var result = 'empty';

  $.post("php/getTweetsByScreenName.php", {
    screenName:screenName,
    numberOfTweets:numberOfTweets
  }, function(data) {
    if (data != "") {
      console.log(JSON.parse(data));
      tweet = JSON.parse(data)[0];
      console.log(tweet.id_str);
      var result = 'empty';
      $.post("php/getRetweetsById.php", {
        tweetId:tweet.id_str,
        numberOfRetweets:numberOfRetweets
      }, function(data) {
        if (data != "") {
         result = JSON.parse(data);
         console.log(result);
         if(result.length > 0) {
          for (var i in result) {
            if(!existingTweet(result[i], downloadableDataset)) {
              downloadableDataset.push(result[i]);
            }
          }
        }
        console.log('DATASET:');
        console.log(downloadableDataset);
        forceGraph.addRetweettersNodes(screenName, nodeLevel, result);
      }
    });

    }
  });
  if(result == 'empty') {
    forceGraph.restart();
  }
}

function getTweetsByMention (screenName, nodeLevel) {
  var result = 'empty';
  var numberOfTweets = document.getElementById('number_mentioners_input').value;
  $.post("php/getTweetsByMention.php", {
    screenName:screenName,
    numberOfTweets: numberOfTweets
  }, function(data) {
    if (data != "") {
      console.log(data);
      result = JSON.parse(data);
      console.log(result);
      if(result.statuses.length > 0) {
        for (var i in result.statuses) {
          if(!existingTweet(result.statuses[i], downloadableDataset)) {
            downloadableDataset.push(result.statuses[i]);
          }
        }
      }
      console.log('DATASET:');
      console.log(downloadableDataset);
      forceGraph.addMentionersNodes(screenName, nodeLevel, result);
    }
  });
  if(result == 'empty') {
    forceGraph.restart();
  }
}


function resizeForceGraph (amount) {
  forceGraph.resizeForceGraph(amount);
}

function existingTweet(tweet, dataset) {
  for (var i in dataset) {
    if(tweet.id_str == dataset[i].id_str) {
      return true;
    }
  }
  return false;
}

function cleanDataset (screenName) {
  console.log('inClean');
  console.log(screenName);
  for(var i=0; i < downloadableDataset.length; i++) {
    if(downloadableDataset[i].user.screen_name == screenName) {
      downloadableDataset.splice(i, 1);
      console.log(downloadableDataset);
      i--;
    }
  }
}

function downloadDataset () {
  console.log(forceGraph.generateUserDataset());
  var users = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forceGraph.generateUserDataset()));
  var tweets = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(downloadableDataset));

  $('<a href="data:' + users + '" download="users.json">Download Users' + datasetsCounter + '</a>').appendTo('#controls_panel');
  $('<a href="data:' + tweets + '" download="tweets.json">Download Tweets' + datasetsCounter + '</a>').appendTo('#controls_panel');
  datasetsCounter++;
}

function showPopover(element) {
  $(element).popover('show');
}


function hidePopover(element) {
  $(element).popover('hide');
}
