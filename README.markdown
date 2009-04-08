# Introduction #

Dr. Twoot is a significant fork of [Peter Krantz's Twoot][1], a customizable Twitter "web app" that sits on your hard disk instead of in the cloud. The code comprises HTML, CSS, and JavaScript ([jQuery][2]) files that are turned into a site-specific browser (SSB) application on the Macintosh through [Fluid][3]. The main advantages of using Dr. Twoot over an SSB pointed at twitter.com are:

1. Dr. Twoot updates automatically;
2. Dr. Twoot intermixes your tweets, tweets from your friends, and mentions of you (tweets containing "@yourname")--even if those mentions come from people you don't follow.

# Installation #

Download the files into a folder on your computer. You'll need to change Line 7 of the file `twoot.js`,

    var UID = 10697232;

so it has your Twitter user id instead of mine. To get your Twitter user id number, execute

    curl -s http://twitter.com/users/show/yourname.xml | grep "<id>"

in the Terminal, where `yourname` is replaced by your Twitter screen name. You'll get a response in the form

    <id>123456789</id>
      <id>2345678912345</id>

Your user id will be the first number. Copy that number and paste it into Line 7 of `twoot.js`.

After `twoot.js` has been edited and saved, launch Fluid and point it to the `twoot.htm` file: `file:///path/to/twoot.htm`. Give the SSB a name ("Dr. Twoot" is a good choice), tell it to use one of the PNG files as the icon, and let it make the new application.

When you run it the first time, you'll probably have to give it your Twitter username and password. If you save those in your Keychain, you won't have to enter them again.

# Use #

<img class="ss" src="http://www.leancrew.com/all-this/images/drtwoot-streamlined.png" />

The Dr. Twoot feature list:

* It merges your friends' timeline and @replies and presents them chronologically.
* It opens showing tweets over the past 24 hours.
* It updates automatically every three minutes.
* Each tweet has buttons that let you:
    * reply, if the tweet is from someone else (**@**);
    * delete, if the tweet is from you (**⌫**);
    * add it to your favorites list (**★** changes to red);
    * delete it from your favorites list (**★** changes back to black); and
    * retweet it (**♺**).
* Less obviously, each tweet has links to:
    * the full-sized user picture (click the thumbnail);
    * the tweet itself on twitter.com (click the timestamp);
    * the user's timeline (click the user name);
    * the Twitter client used to write the tweet (click the name of the client); and
    * the tweet it's replying to or retweeting, when appropriate (click the user name after "re").
* The message area at the bottom has a character countdown that:
    * turns red when you're within 20 of the 140-character limit; and
    * changes to "Twoosh!" when your tweet hits exactly 140 characters.

# Customization #

The style can be changed pretty easily by editing the `style.css` file. Functionality can be added/altered by editing `twoot.js`. Dr. Twoot, like Twoot before it, makes heavy use of the jQuery library.

# License #

MIT





[1]: http://www.peterkrantz.com/2008/twitter-client-with-fluid-and-jquery/
[2]: http://jquery.com/
[3]: http://fluidapp.com/
