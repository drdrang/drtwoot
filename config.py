#!/usr/bin/python

from urllib import urlopen
import re

print '''Enter your Twitter username.
'''

uname = raw_input('Username: ')

url = 'http://twitter.com/users/show/%s.xml' % uname
uid = re.sub(r'\s*</?id>\s*', '', urlopen(url).readlines()[2])

print '''
Copy the following line and paste into twoot.js.
'''
print "var UID = %s;" % uid
