#!/usr/bin/python

from base64 import b64encode
from urllib import urlopen
from getpass import getpass
import re

print '''Enter your Twitter username and password.
The password will not appear as you type it.
'''

uname = raw_input('Username: ')
# pword = raw_input('Password: ')
pword = getpass('Password: ')

url = 'http://twitter.com/users/show/%s.xml' % uname
uid = re.sub(r'\s*</?id>\s*', '', urlopen(url).readlines()[2])

print '''
Copy the following two lines and paste into twoot.js.
'''
print "var UID = %s;" % uid
print "var B64AUTH = '%s';" % b64encode('%s:%s' % (uname, pword))