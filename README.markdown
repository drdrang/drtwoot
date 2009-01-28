# Introduction #

Dr. Twoot is a significant fork of [Peter Krantz's Twoot][1], a customizable Twitter "web app" that sits on your hard disk instead of in the cloud. The code comprises HTML, CSS, and JavaScript ([jQuery][2]) files that are turned into a site-specific browser (SSB) application on the Macintosh through [Fluid][3]. The advantage of using Dr. Twoot over an SSB pointed at twitter.com is that Dr. Twoot updates automatically.

# Installation #

Download the files into a folder on your computer. Launch Fluid and point it to the `twoot.htm` file: `file:///path/to/twoot.htm`. Give the SSB a name ("Dr. Twoot" is a good choice), tell it to use one of the PNG files as the icon, and let it make the new application.

When you run it the first time, you'll probably have to give it your Twitter username and password. If you save those in you Keychain, you won't have to enter them again.

# Use #

<img class="ss" src="http://www.leancrew.com/all-this/images/drtwoot-basic.png" />

With Dr. Twoot, you can view

* your friends' timeline
* your timeline
* replies to you
* your favorites

You can also

* reply to tweets
* delete your own tweets
* add tweets to your favorites list
* remove tweets from your favorites list
* retweet with one click
* page through older tweets

# Customization #

The style can be changed pretty easily by editing the `style.css` file. Functionality can be added/altered by editing `twoot.js`. Dr. Twoot, like Twoot before it, makes heavy use of the jQuery library.

# License #

MIT





[1]: http://www.peterkrantz.com/2008/twitter-client-with-fluid-and-jquery/
[2]: http://jquery.com/
[3]: http://fluidapp.com/
