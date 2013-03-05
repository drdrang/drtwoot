/*
 * The Twitter request code is based on the jquery tweet extension by http://tweet.seaofclouds.com/
 *
 * */

// Change these two lines to your user information.
var UID = 10697232;
var SNAME = "drdrang";
// The initial update looks back COUNT updates in your home timeline. Must be <= 200.
var COUNT = 50;
// The id of the most recently retrieved update.
var LAST_UPDATE;
// The times, in milliseconds, between status refreshes and timestamp recalculations.
var REFRESH = 3*60*1000;
var RECALC = 60*1000;
// The id of the message you are replying to or retweeting.
var MSG_ID;
// The twitter URLs for getting tweets and configuration info.
var BASE_URL = {'home' : 'https://api.twitter.com/1.1/statuses/home_timeline.json',
                'mentions': 'https://api.twitter.com/1.1/statuses/mentions.json',
                'retweets': 'https://api.twitter.com/1.1/statuses/retweeted_by_me.json'};
var CONFIG_URL = 'http://api.twitter.com/1.1/help/configuration.json';
// The list of message IDs I've retweeted.
var RTID = new Array();
// The local CGI URL.
var CGI = 'http://localhost/cgi-bin/twitter.cgi';
// A URL regex.
var URL_RE = 'https?://[^ \\n]+[^ \\n.,;:?!&\'"’”)}\\]]';
// The shortened link length for http.
var SURL = 20;
// And for https.
var SURLS = 21;
// Unread tweet count;
var UNREAD = 0;

// Turn certain things into links.
function htmlify(body, entities) {
  urls = entities.urls;
  users = entities.user_mentions;
  hashtags = entities.hashtags;
  media = entities.media;

  // Handle links.
  $.each(urls, function(i, u) {
    if (u.display_url != null) {
      link = '<a href="' + u.expanded_url + '">' + u.display_url + '</a>';
    }
    else {
      if (u.url.slice(0,3) == 'http') lnk = u.url;
      else lnk = 'http://' + u.url;
      link = '<a href="' + lnk + '">' + u.url + '</a>';
    }
    body = body.replace(u.url, link);
  }) // each

  // Handle Twitter names, ignoring case.
  $.each(users, function(i, u) {
    iname = new RegExp('@' + u.screen_name + '\\b', 'gi');
    link = '<a href="http://twitter.com/' + u.screen_name + '">' + '@' + u.screen_name + '</a>';
    body = body.replace(iname, link);
  }) // each

  // Handle hashtags, ignoring case.
  $.each(hashtags, function(i, h) {
    ihash = new RegExp('#' + h.text + '\\b', 'gi');
    link = '<a href="http://twitter.com/search/%23' + h.text + '">' + '#' + h.text + '</a>';
    body = body.replace(ihash, link);
  }) // each


  // Handle media. For some reason, media is undefined rather than an empty
  // list, so we have to check before trying to loop through.
  if (typeof media != 'undefined') {
    $.each(media, function(i, u) {
      if ((u.media_url != null) && (u.type == 'photo')) {
        link = '<br /><a href="' + u.media_url + ':large">' + '<img src="' + u.media_url + ':thumb"></a><br />';
      }
      else {
        link = '<a href="' + u.expanded_url + '">' + u.display_url + '</a>';
      }
      body = body.replace(u.url, link);
    }) // each
  } // if

  // turn newlines into breaks
  body = body.replace(/\n/g, '<br />');
  return body;
}

// Return a list of all the users mentioned.
function mentioned(entities) {
  users = entities.user_mentions;
  folks = [];
  $.each(users, function(i, u) {
    folks.push(u.screen_name);
  })
  return folks;
}

// Change straight quotes to curly and double hyphens to em-dashes.
function smarten(a) {
  a = a.replace(/(^|[-\u2014/(\[{"\s])'/g, "$1\u2018");      // opening singles
  a = a.replace(/'/g, "\u2019");                             // closing singles & apostrophes
  a = a.replace(/(^|[-\u2014/(\[{\u2018\s])"/g, "$1\u201c"); // opening doubles
  a = a.replace(/"/g, "\u201d");                             // closing doubles
  a = a.replace(/--/g, "\u2014");                            // em-dashes
  return a
}

// Compare two numeric string, returning -1, 0, or 1. To be used for sorting
// message IDs We can't just subract one ID from the other because the ID
// numbers have grown beyond JavaScripts's ability to parse them. So we have
// to do a string comparison that accounts for the possibility that the
// strings are of different length.
function cmpID (a, b) {
  if (a.length < b.length) return -1;
  else if (a.length > b.length) return 1;
  else return a.localeCompare(b);
}

// Convert an integer into a string with commas as the thousands separator.
// Adapted from http://www.mredkj.com/javascript/nfbasic.html
function commify(n) {
  n += '';
  var rgx = /(\d+)(\d{3})/;
	while (rgx.test(n)) {
		n = n.replace(rgx, '$1' + ',' + '$2');
	}
	return n;
}

$.fn.gettweets = function(){
  return this.each(function(){
    var list = $('ul.tweet_list').appendTo(this);
    var homeURL = BASE_URL['home'] + '?include_entities=1&count=' + COUNT;
    var mentionsURL = BASE_URL['mentions'] + '?include_entities=1&count=' + COUNT;
    var retweetsURL = BASE_URL['retweets'] + '?include_entities=1&count=' + COUNT;
    if (LAST_UPDATE != null) homeURL += "&since_id=" + LAST_UPDATE;
    if (LAST_UPDATE != null) retweetsURL += "&since_id=" + LAST_UPDATE;

    // Get my retweets as a list of original message IDs.
    $.getJSON(CGI, {url:retweetsURL}, function(retweets){
      $.each(retweets, function(i, item){
        if (typeof(item.retweeted_status) != "undefined" &&
            $.inArray(item.retweeted_status.id_str, RTID) == -1){
          RTID.push(item.retweeted_status.id_str);
        }
      }); // each

      $.getJSON(CGI, {url:homeURL}, function(home){
        if (LAST_UPDATE != null) mentionsURL += "&since_id=" + LAST_UPDATE;
        else mentionsURL += "&since_id=" + home[home.length - 1].id_str;  // last is oldest

        $.getJSON(CGI, {url:mentionsURL}, function(mentions){
          home = $.merge(home, mentions);
          home.sort(function(a,b){return cmpID(a.id_str, b.id_str);});   // chron sort
          if (home.length > 0) {
            LAST_UPDATE = home[home.length - 1].id_str;   // last is newest
            UNREAD += home.length;
            window.fluid.dockBadge = parseInt(UNREAD);
          }

          $.each(home, function(i, item){
            if($("#msg-" + item.id_str).length == 0) { // <- fix for twitter caching which sometimes have problems with the "since" parameter
              if (item.in_reply_to_status_id == null) {
                inReplyText = '';
                }
              else {
                inReplyText = ' re <a href="https://twitter.com/#!/' + item.in_reply_to_screen_name + '/status/' + item.in_reply_to_status_id_str + '">' + item.in_reply_to_screen_name + '</a>';
              }
              if (item.retweeted_status == null) {
                retweetText = '';
                theID = item.id_str;
                theName = item.user.name;
                theScreenName = item.user.screen_name;
                theUserID = item.user.id;
                theIcon = item.user.profile_image_url;
                followerCount = item.user.followers_count;
                friendCount = item.user.friends_count;
                tweetCount = item.user.statuses_count;
                sdList = item.user.created_at.split(" ");
                theTime = item.created_at;
                theText = item.text;
                theSource = item.source;
                theEntities = item.entities;
                notMe = mentioned(theEntities).filter(function(val){
                  return val != SNAME;
                });
                if (notMe.length > 0) {
                  replyAllHeader = '@' + theScreenName +
                  ' @' + notMe.join(' @');
                }
                else {
                  replyAllHeader = '@' + theScreenName;
                }
              }
              else {
                retweetText = ' via <a href="https://twitter.com/#!/' + item.user.screen_name + '">' + item.user.screen_name + '</a>';
                theID = item.retweeted_status.id_str;
                theName = item.retweeted_status.user.name;
                theScreenName = item.retweeted_status.user.screen_name;
                theUserID = item.retweeted_status.user.id;
                theIcon = item.retweeted_status.user.profile_image_url;
                followerCount = item.retweeted_status.user.followers_count;
                friendCount = item.retweeted_status.user.friends_count;
                tweetCount = item.retweeted_status.user.statuses_count;
                sdList = item.retweeted_status.user.created_at.split(" ");
                theTime = item.retweeted_status.created_at;
                theText = item.retweeted_status.text;
                theSource = item.retweeted_status.source;
                theEntities = item.retweeted_status.entities;
                notMe = mentioned(theEntities).filter(function(val){
                  return val != SNAME;
                });
                if (notMe.length > 0) {
                  replyAllHeader = '@' + theScreenName +
                  ' @' + notMe.join(' @');
                }
                else {
                  replyAllHeader = '@' + item.user.screen_name + ' @' + theScreenName;
                }
              }
              if (theScreenName == 'DrSamuelJohnson') {
                tweet_span_start = '<span class="content c18th">';
                tweet_span_end = '</span>';
              }
              else {
                tweet_span_start = '<span class="content">';
                tweet_span_end = '</span>';
              }
              startDate = sdList[1] + ' ' + sdList[2] + ', ' + sdList[5];
              list.append('<li id="msg-' + theID + '">' +
              '<a href="https://twitter.com/account/profile_image/' +
                theScreenName + '" title="' + theScreenName +
                '\nFollowers: ' + commify(followerCount) +
                '\nFollowing: ' + commify(friendCount) +
                '\nTweets: ' + commify(tweetCount) +
                '\nSince: ' + startDate +
                '"><img class="profile_image" height="48" width="48" src="' +
                theIcon +
                '" alt="' + theName + '" /></a>' +
              '<a class="user" href="https://twitter.com/#!/' +
                theScreenName + '" title="' + theScreenName +
                '\nFollowers: ' + commify(followerCount) +
                '\nFollowing: ' + commify(friendCount) +
                '\nTweets: ' + commify(tweetCount) +
                '\nSince: ' + startDate + '">' +
              theName + '</a> ' +
              '<a class="time" title="' + theTime + '" ' +
                'href="https://twitter.com/#!/' + theScreenName + '/statuses/' +
                theID +'">' +
                relative_time(theTime) + '</a> ' +
              '<span class="buttons">' +
              '<a class="delete" title="Delete" ' +
                'href="javascript:deleteTweet(\'' + theID + '\')">&#9003;</a>' +
              '<a class="retweet" title="Retweet" ' +
                'href="javascript:retweet(\'' + theID + '\')">&#9850;</a>' +
              '<a class="favorite" title="Toggle favorite status" '+
                'href="javascript:toggleFavorite(\'' +
                theID + '\')">&#10029;</a>' +
              '<a class="reply" title="Block and report as spam" ' +
                'href="javascript:reportSpam(\'' +  theScreenName +
                '\', \'' + theID + '\')">&#8709;</a>' +
              '<a class="reply" title="Reply to all" ' +
                'href="javascript:replyTo(\'' + theID +
                '\', \'' + replyAllHeader +
                '\')">&#8704;</a>' +
              '<a class="reply" title="Reply to sender" ' +
                'href="javascript:replyTo(\'' + theID +
                '\', \'@' + theScreenName +
                '\')">@</a>' +
              '</span>' +
              '<div class="tweet_text">' + tweet_span_start +
              htmlify(theText, theEntities) + tweet_span_end +
              '<span class="info">' + ' from ' + theSource + inReplyText + retweetText + '</span>' +
               '</div></li>');

              // Mark if it's a favorite.
              if (item.favorited) {
                $('#msg-' + item.id_str + ' a.favorite').css('color', 'red');
              }

              // Mark if I've retweeted it.
              if ($.inArray(item.id_str, RTID) > -1) {
                $('#msg-' + item.id_str + ' a.retweet').css('color', 'red');
              }

              // Allow me to delete my tweets and distinguish them from others.
              if (item.user.id == UID) {
                $('#msg-' + item.id_str + ' a.delete').css("display", "inline");
                $('#msg-' + item.id_str + ' a.retweet').css("display", "none");
                $('#msg-' + item.id_str).addClass('mine');
              }
              // else {
              //   $('#msg-' + item.id + ' a.delete').css("display", "none");
              //   $('#msg-' + item.id + ' a.reply').css("display", "inline");
              // }

              // Distinguish mentions of me.
              if ("entities" in item && "user_mentions" in item.entities){
                for (var i=0; i<item.entities.user_mentions.length; i++){
                  if (item.entities.user_mentions[i].id == UID) {
                    $('#msg-' + item.id_str).addClass('tome');
                    break;
                  }
                }
              }

            }  // if
          }); // each

          // Make buttons invisible.
          $('.buttons').addClass('invisible');
          $('li').hover(
            function() {
              $(this).children('.buttons').removeClass('invisible')
            },
            function() {
              $(this).children('.buttons').addClass('invisible')
            }
          );

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
  return;
}


function deleteTweet(msg_id) {
  $.post(CGI, {url:'https://api.twitter.com/1.1/statuses/destroy/' + msg_id + '.json', id:msg_id});
  $("#msg-" + msg_id).css('display', 'none');
  return;
}

function reportSpam(screenName, msg_id) {
  $.post(CGI, {url:'https://api.twitter.com/1.1/report_spam.json',
    screen_name:screenName});
  $('#msg-' + msg_id + ' span.content').addClass('spam');
  $('#msg-' + msg_id + ' span.content').after('<br /><em>Reported as spam</em>');
}

function replyTo(msg_id, to) {
  MSG_ID = msg_id;
  start = to + ' ';
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
  $.getJSON(CGI, {url:"https://api.twitter.com/1.1/statuses/show/" + msg_id + ".json"},
    function(data){
      if (data.favorited) {
        $.post(CGI, {url:'https://api.twitter.com/1.1/favorites/destroy/' + msg_id + '.json', id:msg_id},
          function(post_return){
            $('#msg-' + msg_id + ' a.favorite').css('color', 'black');
          }
        );
      }
      else {
        $.post(CGI, {url:'https://api.twitter.com/1.1/favorites/create/' + msg_id + '.json', id:msg_id},
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
    $.post(CGI, {url:'https://api.twitter.com/1.1/statuses/retweet/' + msg_id + '.json', id: msg_id},
      function(data) {
        $('#msg-' + msg_id + ' a.retweet').css('color', 'red');
        refreshStatusField(); },
      'json');
  }
}

function setStatus(status_text) {
  if (status_text.indexOf("@") != -1 && MSG_ID) {
    $.post(CGI, {url: "https://api.twitter.com/1.1/statuses/update.json", status: smarten(status_text), in_reply_to_status_id: MSG_ID }, function(data) { refreshStatusField(); }, "json" );
    MSG_ID = '';
  }
  else {
    $.post(CGI, {url:"https://api.twitter.com/1.1/statuses/update.json", status: smarten(status_text) }, function(data) { refreshStatusField(); }, "json" );
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
  body = $("#status").val();
  charsLeft = 140 - body.length;
  urlRE = new RegExp(URL_RE, 'g');
  matches = body.match(urlRE);
  if (matches) {
    for (var i=0; i<matches.length; i++) {
      charsLeft += matches[i].length;
      if (matches[i].charAt(4) == 's') {
        charsLeft -= SURLS;
      }
      else {
        charsLeft -= SURL;
      }
    }
  }
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
  // Get the shortened link length.
  $.getJSON(CGI, {url:CONFIG_URL}, function(info) {
    SURL = info.short_url_length;
    SURLS = info.short_url_length_https;
  });

  //get the messages
  refreshMessages();

  //add event capture to form submit
  $("#status_entry").submit(function() {
    setStatus($("#status").val());
    return false;
  });

  // Cmd-Return in the status field is same as clicking
  // the Update button.
  $("#status").keypress( function(e) {
    if (e.which == 13 && e.metaKey) {
      setStatus($("#status").val());
      return false;
    }
  });

  // Manually refresh by typing Ctrl-R.
  $("html").keypress( function(e) {
    if (e.which == 18 && e.ctrlKey) {
      refreshMessages();
      return false;
    }
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

// Turn off the Dock badge when I scroll. This would be better if it
// turned off when I scrolled to the bottom, but baby steps first.
$(window).scroll(function() {
  window.fluid.dockBadge = '';
  UNREAD = 0;
});
