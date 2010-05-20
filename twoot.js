/*
 * The Twitter request code is based on the jquery tweet extension by http://tweet.seaofclouds.com/
 *
 * */
 
// Change these two lines to your user information. You can get the information by
// running the config script.
var UID = 123456789;
var B64AUTH = 'dXNlcm5hbWU6cGFzc3dvcmQ=';
// The initial update looks back COUNT updates in your home timeline. Must be <= 200.
var COUNT = 100;
// The id of the most recently retrieved update.
var LAST_UPDATE;
// The times, in milliseconds, between status refreshes and timestamp recalculations.
var REFRESH = 3*60*1000;
var RECALC = 60*1000;
// Should "And now it's all this" comment references be turned into links?
// This should be false for everyone but Dr. Drang.
var ALL_THIS = new Boolean(true);
// The id of the message you are replying to or retweeting.
var MSG_ID;
// The twitter URLs for getting tweets.
var BASE_URL = {'home' : 'https://api.twitter.com/1/statuses/home_timeline.json',
                'mentions': 'https://api.twitter.com/1/statuses/mentions.json',
                'retweets': 'https://api.twitter.com/1/statuses/retweeted_by_me.json'};
// The list of message IDs I've retweeted.
var RTID = new Array();
                
function htmlify(body, allThisLinks) {
  // handle links
  body = body.replace(/((https?|ftp):\/\/[^ \n]+[^ \n.,;:?!&'"’”)}\]])/g, '<a href="$1">$1</a>');
  // handle Twitter names
  body = body.replace(/[\@]+([A-Za-z0-9-_]+)/g, '<a href="http://twitter.com/$1">@$1</a>');
  // turn newlines into breaks
  body = body.replace(/\n/g, '<br />');
  // handle references to And now it's all this
  if (allThisLinks){
    body = body.replace(/#(\d+)∀/, '<a href="http://www.leancrew.com/all-this/?p=$1">#$1∀</a>');
  }
  return body;
}

$.fn.gettweets = function(){
  return this.each(function(){
    var list = $('ul.tweet_list').appendTo(this);
    var homeURL = BASE_URL['home'] + '?count=' + COUNT;
    var mentionsURL = BASE_URL['mentions'] + '?count=' + COUNT;
    var retweetsURL = BASE_URL['retweets'] + '?count=' + COUNT;
    if (LAST_UPDATE != null) homeURL += "&since_id=" + LAST_UPDATE;
    if (LAST_UPDATE != null) retweetsURL += "&since_id=" + LAST_UPDATE;
    
    // Get my retweets as a list of original message IDs.
    $.getJSON(retweetsURL, function(retweets){
      $.each(retweets, function(i, item){
        // alert(item.retweeted_status.id);
        if ($.inArray(item.retweeted_status.id, RTID) == -1){
          // alert(item.retweeted_status.id);
          RTID.push(item.retweeted_status.id);
        }
      }); // each
    
      $.getJSON(homeURL, function(home){
        if (LAST_UPDATE != null) mentionsURL += "&since_id=" + LAST_UPDATE;
        else mentionsURL += "&since_id=" + home[home.length - 1].id;  // last is oldest
      
        $.getJSON(mentionsURL, function(mentions){
          home = $.merge(home, mentions);
          home.sort(function(a,b){return a.id - b.id;});   // chron sort
          if (home.length > 0) LAST_UPDATE = home[home.length - 1].id;   // last is newest
      
          $.each(home, function(i, item){
            if($("#msg-" + item.id).length == 0) { // <- fix for twitter caching which sometimes have problems with the "since" parameter
              if (item.in_reply_to_status_id == null) {
                inReplyText = '';
                }
              else {
                inReplyText = ' re <a href="http://twitter.com/' + item.in_reply_to_screen_name + '/status/' + item.in_reply_to_status_id + '">' + item.in_reply_to_screen_name + '</a>';
              }
              if (item.retweeted_status == null) {
                retweetText = '';
                theID = item.id;
                theName = item.user.name;
                theScreenName = item.user.screen_name;
                theIcon = item.user.profile_image_url;
                theTime = item.created_at;
                theText = item.text;
                theSource = item.source;
              }
              else {
                retweetText = ' via <a href="http://twitter.com/' + item.user.screen_name + '">' + item.user.screen_name + '</a>';
                theID = item.retweeted_status.id;
                theName = item.retweeted_status.user.name;
                theScreenName = item.retweeted_status.user.screen_name;
                theIcon = item.retweeted_status.user.profile_image_url;
                theTime = item.retweeted_status.created_at;
                theText = item.retweeted_status.text;
                theSource = item.retweeted_status.source;
              }
              if (theScreenName == 'DrSamuelJohnson') {
                tweet_span_start = '<span class="c18th">';
                tweet_span_end = '</span>';
              }
              else {
                tweet_span_start = '';
                tweet_span_end = '';
              }
              list.append('<li id="msg-' + theID + '">' +
              '<a href="http://twitter.com/account/profile_image/' +
              theScreenName +
              '"><img class="profile_image" height="48" width="48" src="' + 
              theIcon +
              '" alt="' + theName + '" /></a>' +
              '<a class="time" title="' + theTime + '" ' +
                'href="http://twitter.com/' + theScreenName + '/statuses/' +
                theID +'">' +
                relative_time(theTime) + '</a> '+
              '<a class="user" href="http://twitter.com/' + 
                theScreenName + '">' +
              theScreenName + '</a> ' +
              '<a class="delete" title="Delete" ' +
                'href="javascript:deleteTweet(' + theID + ')">&#9003;</a>' +
              '<a class="retweet" title="Retweet" ' +
                'href="javascript:retweet(' + theID + ')">&#9850;</a>' +
              '<a class="favorite" title="Toggle favorite status" '+
                'href="javascript:toggleFavorite(' + 
                theID + ')">&#10029;</a>' +
              '<a class="reply" title="Reply to this" ' +
                'href="javascript:replyTo(\'' +
                theScreenName + '\',' + theID +
                ')">@</a>' +
              '<div class="tweet_text">' + tweet_span_start +
              htmlify(theText, ALL_THIS) + tweet_span_end +
              '<span class="info">' + ' from ' + theSource + inReplyText + retweetText + '</span>' +
               '</div></li>');

              // Mark if it's a favorite.
              if (item.favorited) {
                $('#msg-' + item.id + ' a.favorite').css('color', 'red');
              }
              
              // Mark if I've retweeted it.
              if ($.inArray(item.id, RTID) > -1) {
                $('#msg-' + item.id + ' a.retweet').css('color', 'red');
              }
        
              // Allow me to delete my tweets and distinguish them from others.
              if (item.user.id == UID) {
                $('#msg-' + item.id + ' a.delete').css("display", "inline");
                $('#msg-' + item.id + ' a.retweet').css("display", "none");
                $('#msg-' + item.id).addClass('mine');
              }
              // else {
              //   $('#msg-' + item.id + ' a.delete').css("display", "none");
              //   $('#msg-' + item.id + ' a.reply').css("display", "inline");
              // }
          
              // Distinguish replies to me.
              if (item.in_reply_to_user_id == UID){
                $('#msg-' + item.id).addClass('tome');
              } 
        
            }  // if
          }); // each
        }); // getJSON mentions
      }); // getJSON home
    }); //getJSON retweets
  }); // this.each
};  // gettweets



function relative_time(time_value) {
  var values = time_value.split(" ");
  time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
  var parsed_date = Date.parse(time_value);
  var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
  var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
  delta = delta + (relative_to.getTimezoneOffset() * 60);
  var hrs = parseInt(delta / 3600);
  delta -= hrs*3600;
  var mins = parseInt(delta / 60);
  if (hrs > 0) return hrs.toString() + 'h ' + mins.toString() + 'm ago';
  else return  mins.toString() + 'm ago';
};


//get all span.time and recalc from title attribute
function recalcTime() {
  $('a.time').each( 
      function() {
        $(this).text(relative_time($(this).attr("title")));
      }
  )
}


function refreshMessages() {
  $(".tweets").gettweets();
  // LAST_UPDATE = new Date().toGMTString();
  return;
}


function deleteTweet(msg_id) {
  $.post('https://api.twitter.com/1/statuses/destroy/' + msg_id + '.json', {id:msg_id});
  $("#msg-" + msg_id).css('display', 'none');
  return;
}
      
function replyTo(screen_name, msg_id) {
  MSG_ID = msg_id;
  start = '@' + screen_name + ' ';
  $("#status").val(start);
  $("#status").focus();
  $("#status").caret(start.length, start.length);
  charCountdown();
}

function toggleFavorite(msg_id) {
  // Turn the star reddish-gray to let the user know that something is happening.
  // Depending on Twitter traffic, it may take a second or two to make the final
  // color change.
  $('#msg-' + msg_id + ' a.favorite').css('color', '#b88');
  $.getJSON("https://api.twitter.com/1/statuses/show/" + msg_id + ".json", 
    function(data){
      if (data.favorited) {
        $.post('https://api.twitter.com/1/favorites/destroy/' + msg_id + '.json',
          {id:msg_id},
          function(post_return){
            $('#msg-' + msg_id + ' a.favorite').css('color', 'black');
          }
        );
      }
      else {
        $.post('https://api.twitter.com/1/favorites/create/' + msg_id + '.json',
          {id:msg_id},
          function(post_return){
            $('#msg-' + msg_id + ' a.favorite').css('color', 'red');
          }
        );
      }
    }
  );
}

function retweet(msg_id) {
  // Use new-style retweeting. Mark it as having been retweeted.
  // Don't retweet if I've already done so.
  if ($('#msg-' + msg_id + ' a.retweet').css('color') == 'red') {
    alert("You've already retweeted that one!");
  }
  else {
    $.post('https://api.twitter.com/1/statuses/retweet/' + msg_id + '.json',
      {id: msg_id, source: "drtwoot"},
      function(data) {
        $('#msg-' + msg_id + ' a.retweet').css('color', 'red');
        refreshStatusField(); },
      'json');
  }
  // The following is legacy code for old-style retweeting.
  // MSG_ID = msg_id;
  // $.getJSON("http://api.twitter.com/1/statuses/show/" + msg_id + ".json", 
  //   function(data){
  //     start = 'RT @' + data.user.screen_name + ': ' + data.text + ' ';
  //     $("#status").val(start);
  //     $("#status").focus();
  //     $("#status").caret(start.length, start.length);
  //     charCountdown();
  //   }
  // );
}

function setStatus(status_text) {
  if (status_text.indexOf("@") != -1 && MSG_ID) {
    $.post("https://api.twitter.com/1/statuses/update.json", { status: status_text, source: "drtwoot", in_reply_to_status_id: MSG_ID }, function(data) { refreshStatusField(); }, "json" );
    MSG_ID = '';
  }
  else {
    $.post("https://api.twitter.com/1/statuses/update.json", { status: status_text, source: "drtwoot" }, function(data) { refreshStatusField(); }, "json" );
  }
  return;
}

function refreshStatusField() {
  refreshMessages();
  $("#status").val("");
  $("#count").removeClass("warning");
  $("#count").addClass("normal");
  $("#count").html("140");
  // Scroll down to the bottom after posting. Have to use a delay
  // or the scroll will happen before the tweet is added to the list.
  // The extra 200 pixels is a kluge.
  window.setTimeout("window.scrollTo(0, $('div.tweets').height()+200)", 4*1000);
  return;
}

// Count down the number of characters left in the tweet.  Change the
// style to warn the user when there are only 20 characters left. Show
// "Twoosh!" when the tweet is exactly 140 characters long.
function charCountdown() {
  charsLeft = 140 - $("#status").val().length;
  if (charsLeft <= 20) {
    $("#count").removeClass("normal");
    $("#count").addClass("warning");
  }
  else {
    $("#count").removeClass("warning");
    $("#count").addClass("normal");
  }
  if (charsLeft == 0) {
    $("#count").html("Twoosh!");
  }
  else {
    $("#count").html(String(charsLeft));
  }
}

// set up basic stuff for first load
$(document).ready(function(){
  // This is a kludge. An empty status update will set the user credentials
  // so the /statuses/show call in toggleFavorite will be run as that user.
  // $.post("http://api.twitter.com/1/statuses/update.json", { status: ""});
  
  // Authenticate each call.
  $.ajaxSetup({
    beforeSend: function(xhr){
      xhr.setRequestHeader('Authorization', 'Basic ' + B64AUTH); 
    }
  })

  //get the messages
  refreshMessages();
  
  //add event capture to form submit
  $("#status_entry").submit(function() {
    setStatus($("#status").val());
    return false;
  });

  //set timer to reload timeline, every REFRESH milliseconds
  window.setInterval("refreshMessages()", REFRESH);

  //set timer to recalc timestamps every RECALC milliseconds
  window.setInterval("recalcTime()", RECALC);

});


// Reset the bottom margin of the tweet list so the status entry stuff
// doesn't cover the last tweet. This is done after the size of the
// #message_entry div is known (load) and whenever the text size is
// changed in the browser (scroll).

function setBottomMargin() {
  $("div.tweets").css("margin-bottom", $("#message_entry").height() + parseInt($("#message_entry").css("border-top-width")));
}

$(document).load(setBottomMargin);
$(window).scroll(setBottomMargin);
