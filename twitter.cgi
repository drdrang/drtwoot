#!/usr/bin/python

import oauth2 as oauth
import urllib
import cgi
import cgitb; cgitb.enable()

# You'll need to change these to the values you get from Twitter
# when you register your app.
consumerKey = "123456789"
consumerKeySecret = "123456789"
accessToken = "123456789"
accessTokenSecret = "123456789"

# Pretty much stolen from http://dev.twitter.com/pages/oauth_single_token#python.
def oauth_req(url, http_method="GET", post_body=None, http_headers=None):
  'Make a request and return the content of the response.'
  
  # Set up the client.
  consumer = oauth.Consumer(key=consumerKey, secret=consumerKeySecret)
  token = oauth.Token(key=accessToken, secret=accessTokenSecret)
  client = oauth.Client(consumer, token)

  # Make the request.
  resp, content = client.request(
    url, 
    method=http_method, 
    body=post_body, 
    headers=http_headers
  )

  return content

# Get data POSTed to this script and sort it into the Twitter URL
# and the data to POST to Twitter.
form = cgi.FieldStorage()
twitterURL = form['url'].value
keylist = form.keys()
del(keylist[keylist.index('url')])
body = {}
for k in keylist:
  body[k] = form[k].value
  
# Make the requests.
if len(keylist) == 0:
  answer = oauth_req(url = twitterURL)
else:
  answer = oauth_req(url = twitterURL, http_method="POST", post_body=urllib.urlencode(body))

# Return the results as JSON.
print '''Content-Type: application/json

%s''' % answer

# print answer