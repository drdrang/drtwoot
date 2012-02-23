# Introduction #

Dr. Twoot is a significant fork of [Peter Krantz's Twoot][1], a customizable Twitter "web app" that sits on your hard disk instead of in the cloud. The code comprises HTML, CSS, and JavaScript ([jQuery][2]) files that are turned into a site-specific browser (SSB) application on the Macintosh through [Fluid][3]. The main advantages of using Dr. Twoot over an SSB pointed at twitter.com are:

1. Dr. Twoot updates automatically;
2. Dr. Twoot intermixes your tweets, tweets from your friends, and mentions of you (tweets containing "@yourname")--even if those mentions come from people you don't follow.
3. Dr. Twoot presents tweets in chronological order.
4. Dr. Twoot provides one-click spam reporting.


# Installation #

## The CGI script ##

When Twitter removed Basic Authentication in August of 2010, Dr. Twoot could no longer work as a standalone client. It now requires a running web server on your local machine and a CGI script to make the OAuth requests to Twitter. Here's what you need to do:

1. Make sure the Apache web server is running. All Macs have Apache installed; it can be turned on clicking the Web Sharing checkbox in the Sharing panel of System Preferences.

    <img src="http://www.leancrew.com/all-this/images2010/web-sharing.png" />

2. Register yourself as [a Twitter developer][5] and then register a new application (as far as I know, you can call it "Dr. Twoot" without conflicting with anyone else's Dr. Twoot). This will give you the OAuth credentials necessary for the CGI script. The four credentials are the Consumer Key, the Consumer Secret, the Access Token, and the Access Token Secret. Copy these items from your newly-registered application's settings pages and paste them into the appropriate spots in Lines 10-13 of `twitter.cgi`.
3. Move `twitter.cgi` to the `/Library/WebServer/CGI-Executables` folder on your computer and make it executable: `chmod +x /Library/WebServer/CGI-Executables/twitter.cgi`.
4. Install the `oauth2` python library and its dependencies: `sudo easy_install oauth2`.

Now you're ready to configure and create the site-specific browser.

## The HTML/CSS/JavaScript part ##
You'll need to change Line 7 of the file `twoot.js`,

    var UID = 10697232;

so it has your Twitter user id. To get that information for your account, run the `config.py` script from the command line:

    python config.py

You'll be prompted for your username, and the appropriate Line 7 for your account will be printed out. Copy and paste into `twoot.js`, replacing the dummy line shown above.

Note: `config.py` connects to Twitter to get your user ID number, so you'll have to have an Internet connection (and the Twitter site itself will have to be up and running) for the script to work.

After `twoot.js` has been edited and saved, launch Fluid and point it to the `twoot.htm` file: `file:///path/to/twoot.htm`. Give the SSB a name ("Dr. Twoot" is a good choice), tell it to use one of the PNG files as the icon, and let it make the new application.

# Use #

<img class="ss" src="http://farm8.staticflickr.com/7205/6776341634_849881c83e_o.jpg" />

The Dr. Twoot feature list:

* It merges your friends' timeline and @replies and presents them chronologically.
* It opens showing the most recent 50 tweets from your friends (the number can be adjusted).
* It updates automatically every three minutes (the interval can be adjusted).
* Each tweet has buttons that let you:
    * reply (**@**);
    * reply to all (**∀**);
    * block and report as spam (**∅**);
    * add to your favorites list (**★** changes to red);
    * delete from your favorites list (**★** changes back to black); and
    * delete, if the tweet is from you (**⌫**);
    * retweet, if the tweet is from someone else (**♺** changes to red).
    
    The buttons appear only for the tweet the cursor is over.
* Less obviously, each tweet has links to:
    * the full-sized user picture (click the thumbnail);
    * the tweet itself on twitter.com (click the timestamp);
    * the user's timeline (click the user name);
    * the Twitter client used to write the tweet (click the name of the client); and
    * the tweet it's replying to or retweeting, when appropriate (click the user name after "re" or "via").
* Hovering over the user's image or name causes a popup to appear that shows the user's:
    * follower count;
    * friend count;
    * tweet count; and
    * start date.
    
    This information might be interesting in its own right, but it's meant to help decide whether to report a suspicious tweet as spam.
* The message area at the bottom has a character countdown that:
    * turns red when you're within 20 of the 140-character limit; and
    * changes to "Twoosh!" when your tweet hits exactly 140 characters.
* Mentions of a Twitter users (@username), URLs, and hashtags (#hashtag) are turned into a links.

# Customization #

The style can be changed pretty easily by editing the `style.css` file. Functionality can be added/altered by editing `twoot.js`. Dr. Twoot, like Twoot before it, makes heavy use of the jQuery library.

# License #

MIT

# Contributions #

* Peter Krantz
* Travis Jeffery



[1]: http://www.peterkrantz.com/2008/twitter-client-with-fluid-and-jquery/
[2]: http://jquery.com/
[3]: http://fluidapp.com/
[4]: http://www.leancrew.com/all-this/2009/05/blog-housekeeping/
[5]: http://dev.twitter.com/
