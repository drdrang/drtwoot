/*
 * The Twitter request code is based on the jquery tweet extension by http://tweet.seaofclouds.com/
 *
 * */
 
// Change this to your user id.
var UID = 10697232;
var NOW = new Date();
// The initial update looks back 24 hours.
var THEN = new Date(NOW.getTime() - 24*60*60*1000);
var INITIAL_UPDATE = THEN.toGMTString();
var COUNT = 200;
var LAST_UPDATE;
var MSG_ID;
var BASE_URL = {'friends': 'http://twitter.com/statuses/friends_timeline.json',
                'replies': 'http://twitter.com/statuses/mentions.json',
                'directs': 'http://twitter.com/direct_messages.json',
                'mine'   : 'http://twitter.com/statuses/user_timeline.json'};

$.fn.gettweets = function(){
  return this.each(function(){
    var list = $('ul.tweet_list').appendTo(this);
    var friendsURL = BASE_URL['friends'] + '?count=' + COUNT + getSinceParameter();
    var repliesURL = BASE_URL['replies'] + '?count=' + COUNT
    
    $.getJSON(friendsURL, function(friends){
      LAST_UPDATE = friends[0].id;
      repliesURL = repliesURL + "&since_id=" + LAST_UPDATE;
      $.getJSON(repliesURL, function(replies){
        friends = $.merge(friends, replies)
        $.each(friends.sort(function(a,b){return a.id-b.id;}),
        function(i, item){
          if($("#msg-" + item.id).length == 0) { // <- fix for twitter caching which sometimes have problems with the "since" parameter
            if (item.in_reply_to_status_id == null) {
              inReplyText = '';
              }
            else {
              inReplyText = ' re <a href="http://twitter.com/' + item.in_reply_to_screen_name + '/status/' + item.in_reply_to_status_id + '">' + item.in_reply_to_screen_name + '</a>';
            }
            list.append('<li id="msg-' + item.id + '">' +
            '<a href="http://twitter.com/account/profile_image/' +
            item.user.screen_name +
            '"><img class="profile_image" height="48" width="48" src="' + 
            item.user.profile_image_url +
            '" alt="' + item.user.name + '" /></a>' +
            '<a class="time" title="' + item.created_at + '" ' +
              'href="http://twitter.com/' + item.user.screen_name + '/statuses/' +
              item.id +'">' +
              relative_time(item.created_at) + '</a> '+
            '<a class="user" href="http://twitter.com/' + 
              item.user.screen_name + '">' +
            item.user.screen_name + '</a> ' +
            '<a class="retweet" title="Retweet" ' +
              'href="javascript:retweet(' + item.id + ')">&#9850;</a>' +
            '<a class="favorite" title="Toggle favorite status" '+
              'href="javascript:toggleFavorite(' + 
              item.id + ')">&#10029;</a>' +
            '<a class="reply" title="Reply to this" ' +
              'href="javascript:replyTo(\'' +
              item.user.screen_name + '\',' + item.id +
              ')">@</a>' +
            '<a class="delete" title="Delete" ' +
              'href="javascript:deleteTweet(' + item.id + ')">&#9003;</a>' +
            '<div class="tweet_text">' +
            item.text.replace(/((https?|ftp):\/\/[^ ]+[^ .,;:?!'"’”)\]])/g, '<a href="$1">$1</a>').replace(/[\@]+([A-Za-z0-9-_]+)/g, '<a href="http://twitter.com/$1">@$1</a>') +
            '<span class="info">' + ' via ' + item.source + inReplyText + '</span>' +
             '</div></li>');

            // Change the class if it's a favorite.
            if (item.favorited) {
              $('#msg-' + item.id + ' a.favorite').css('color', 'red');
            }
          
            // Distinguish between my tweets and others.
            if (item.user.id == UID) {
              $('#msg-' + item.id + ' a.delete').css("display", "inline");
              $('#msg-' + item.id + ' a.reply').css("display", "none");
              $('#msg-' + item.id).addClass('mine');
            }
            else {
              $('#msg-' + item.id + ' a.delete').css("display", "none");
              $('#msg-' + item.id + ' a.reply').css("display", "inline");
            }
            
            // Distinguish replies to me.
            if (item.in_reply_to_user_id == UID){
              $('#msg-' + item.id).addClass('tome');
            } 
          
          }  // if
        }); // each
      }); // getJSON replies
    }); // getJSON friends
  }); // this.each
};  // gettweets



function relative_time(time_value) {
  var values = time_value.split(" ");
  time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
  var parsed_date = Date.parse(time_value);
  var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
  var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
  delta = delta + (relative_to.getTimezoneOffset() * 60);
  if (delta < 60) {
    return 'seconds ago';
  } else if(delta < 120) {
    return 'a minute ago';
  } else if(delta < (50*60)) {
    return (parseInt(delta / 60)).toString() + ' minutes ago';
  } else if(delta < (70*60)) {
    return 'an hour ago';
  } else if(delta < (120*60)) {
    return 'over an hour ago';
  } else if(delta < (22*60*60)) {
    return '' + (parseInt(delta / 3600)).toString() + ' hours ago';
  } else if(delta < (48*60*60)) {
    return 'a day ago';
  } else {
    return (parseInt(delta / 86400)).toString() + ' days ago';
  }
};


//get all span.time and recalc from title attribute
function recalcTime() {
  $('a.time').each( 
      function() {
        $(this).text(relative_time($(this).attr("title")));
      }
  )
}


function getSinceParameter() {
  if(LAST_UPDATE == null) {
    return "";
  } else {
    return "&since_id=" + LAST_UPDATE;
  }
}


function refreshMessages() {
  $(".tweets").gettweets();
  // LAST_UPDATE = new Date().toGMTString();
  return;
}


function deleteTweet(msg_id) {
  $.post('http://twitter.com/statuses/destroy/' + msg_id + '.json', {id:msg_id});
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
  $.getJSON("http://twitter.com/statuses/show/" + msg_id + ".json", 
    function(data){
      if (data.favorited) {
        $.post('http://twitter.com/favorites/destroy/' + msg_id + '.json', {id:msg_id});
        $('#msg-' + msg_id + ' a.favorite').css('color', 'black');
      }
      else {
        $.post('http://twitter.com/favorites/create/' + msg_id + '.json', {id:msg_id});
        $('#msg-' + msg_id + ' a.favorite').css('color', 'red');
      }
    }
  );
}

function retweet(msg_id) {
  MSG_ID = msg_id;
  $.getJSON("http://twitter.com/statuses/show/" + msg_id + ".json", 
    function(data){
      start = 'RT @' + data.user.screen_name + ': ' + data.text + ' ';
      $("#status").val(start);
      $("#status").focus();
      $("#status").caret(start.length, start.length);
      charCountdown();
    }
  );
}

function setStatus(status_text) {
  if (status_text.indexOf("@") != -1 && MSG_ID) {
    $.post("http://twitter.com/statuses/update.json", { status: status_text, source: "drtwoot", in_reply_to_status_id: MSG_ID }, function(data) { refreshStatusField(); }, "json" );
    MSG_ID = '';
  }
  else {
    $.post("http://twitter.com/statuses/update.json", { status: status_text, source: "drtwoot" }, function(data) { refreshStatusField(); }, "json" );
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

    //get the messages
    refreshMessages();
    
    //add event capture to form submit
    $("#status_entry").submit(function() {
      setStatus($("#status").val());
      return false;
    });

    //set timer to reload timeline, every 3 minutes
    window.setInterval("refreshMessages()", 3*60*1000);

    //set timer to recalc timestamps every 60 secs
    window.setInterval("recalcTime()", 60000);

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
