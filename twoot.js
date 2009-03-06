/*
 * The Twitter request code is based on the jquery tweet extension by http://tweet.seaofclouds.com/
 *
 * */
var NOW = new Date();
var THEN = new Date(NOW.getTime() - 12*60*60*1000);
var INITIAL_UPDATE = escape(THEN.toGMTString());
var COUNT = 200;
var LAST_UPDATE;
var MSG_ID;
var PAGE = 1;
var BASE_URL = {'friends': 'http://twitter.com/statuses/friends_timeline.json',
                'replies': 'http://twitter.com/statuses/replies.json',
                'directs': 'http://twitter.com/direct_messages.json',
                'mine'   : 'http://twitter.com/statuses/user_timeline.json'};
var UID;
// var TWEETTYPE;

//Reverse collection
jQuery.fn.reverse = function() {
  return this.pushStack(this.get().reverse(), arguments);
}; 


(function($) {
 $.fn.gettweets = function(){
  return this.each(function(){
     var list = $('ul.tweet_list').appendTo(this);
     var url = BASE_URL['friends'] + '?count=' + COUNT;
     url += getSinceParameter();
     $.getJSON(url, function(data){
       $.each(data.reverse(), function(i, item) { 
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
          item.text.replace(/((https?|ftp):\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&\?\/.=]+)/g, '<a href="$1">$1</a>').replace(/[\@]+([A-Za-z0-9-_]+)/g, '<a href="http://twitter.com/$1">@$1</a>') +
          '<span class="info">' + ' via ' + item.source + inReplyText + '</span>' +
           '</div></li>');

          // Change the class if it's a favorite.
          if (item.favorited) {
            $('#msg-' + item.id + ' a.favorite').css('color', 'red');
          }
          
          // Set the visibility of the delete and reply buttons.
          if (item.user.id == UID) {
            $('#msg-' + item.id + ' a.delete').css("display", "inline");
            $('#msg-' + item.id + ' a.reply').css("display", "none");
          }
          else {
            $('#msg-' + item.id + ' a.delete').css("display", "none");
            $('#msg-' + item.id + ' a.reply').css("display", "inline");
          }
          
          // Hide the Newer link if we're on the first page.
          if (PAGE == 1) {
            $("#newer").css("visibility", "hidden");
          }
          else {
            $("#newer").css("visibility", "visible");
          }
          
          // The Older link is always visible after the tweets are shown.
          $("#older").css("visibility", "visible");
            
          // Don't want Growl notifications? Comment out the following method call
          fluid.showGrowlNotification({
            title: item.user.name + " @" + item.user.screen_name,
            description: item.text,
            priority: 2,
            icon: item.user.profile_image_url
          });

          }  // if
         }); // each
       }); // getJSON
     }); // this.each
 };  // gettweets
})(jQuery);


function relative_time(time_value) {
  var values = time_value.split(" ");
  time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
  var parsed_date = Date.parse(time_value);
  var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
  var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
  delta = delta + (relative_to.getTimezoneOffset() * 60);
  if (delta < 60) {
    return 'less than a minute ago';
  } else if(delta < 120) {
    return 'a minute ago';
  } else if(delta < (45*60)) {
    return (parseInt(delta / 60)).toString() + ' minutes ago';
  } else if(delta < (75*60)) {
    return 'an hour ago';
  } else if(delta < (120*60)) {
    return 'over an hour ago';
  } else if(delta < (24*60*60)) {
    return '' + (parseInt(delta / 3600)).toString() + ' hours ago';
  } else if(delta < (48*60*60)) {
    return '1 day ago';
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
    return "&since=" + INITIAL_UPDATE;
  } else {
    return "&since=" + LAST_UPDATE;
  }
}

function showAlert(message) {
  $("#alert p").text(message);
  $("#alert").fadeIn("fast");
  return;
}


function refreshMessages(tweet_type) {
  // showAlert("Refreshing...");
  $(".tweets").gettweets();
  LAST_UPDATE = new Date().toGMTString();
  // $("#alert").fadeOut(2000);
  return;
}

function refreshFriends(){
  if (LAST_UPDATE) {
    refreshMessages('friends');
  }
  return;
}

function getType(type){
  $("#older").attr('href', "javascript:olderPage('friends')");
  $("#newer").attr('href', "javascript:newerPage('friends')");
  $("#older").css('visibility','hidden');
  $("#newer").css('visibility','hidden');
  $("ul.tweet_list li[id^=msg]").remove();
  LAST_UPDATE = null;
  PAGE = 1;
  TWEETTYPE = type;
  showAlert("Getting " + type + "…");
  $(".tweets").gettweets();
  $("#alert").fadeOut(2000);
  if (type== 'friends') LAST_UPDATE = new Date().toGMTString();
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

function olderPage(tweet_type) {
  PAGE += 1;
  LAST_UPDATE = null;
  // Hide the paging links before removing the messages. They're made
  // visible again by gettweets().
  $("#older").css('visibility','hidden');
  $("#newer").css('visibility','hidden');
  $("ul.tweet_list li[id^=msg]").remove();
  refreshMessages(tweet_type);
}

function newerPage(tweet_type) {
  if (PAGE > 1) {
    PAGE -= 1
    LAST_UPDATE = null;
    // Hide the paging links before removing the messages. They're made
    // visible again by gettweets().
    $("#older").css('visibility','hidden');
    $("#newer").css('visibility','hidden');
    $("ul.tweet_list li[id^=msg]").remove();
    refreshMessages(tweet_type);
  }
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
  var stayTypes = ['friends', 'mine'];
  if (stayTypes.indexOf(TWEETTYPE) != -1) refreshMessages(TWEETTYPE);
  else getType('friends');
  $("#status").val("");
  $('html').animate({scrollTop:0}, 'fast'); 
  $("#count").removeClass("warning");
  $("#count").addClass("normal");
  $("#count").html("140");
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

    //get the user's messages
    getType('friends');
    
    // Get the user's ID.
    $.getJSON(BASE_URL['mine'], function(data){UID = data[0].user.id;return;});
    

    //add event capture to form submit
    $("#status_entry").submit(function() {
      setStatus($("#status").val());
      return false;
    });

    //set timer to reload friends timeline, if showing, every 3 minutes
    window.setInterval("refreshFriends()", 3*60*1000);

    //set timer to recalc timestamps every 60 secs
    window.setInterval("recalcTime()", 60000);

});


// Reset the top margin of the tweet list so the status entry stuff
// doesn't cover the earlies tweet. This has to be done after the size of
// the #message_entry div is known (load) and whenever the text size is
// changed in the browser (scroll).

function setTopMargin() {
  $("div.tweets").css("margin-top", $("#message_entry").height() + parseInt($("#message_entry").css("border-bottom-width")));
}

$(document).load(setTopMargin);
$(window).scroll(setTopMargin);
