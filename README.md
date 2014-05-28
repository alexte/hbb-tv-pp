hbb-tv-pp
=========

Hbb-TV Privacy Proxy

Modern Smart TV include a feature called Hbb-TV, which essentially 
is designed to be a successor of Teletext. About 90% of german TV
stations have Hbb-TV allready up and running. 

About Hbb-TV: http://en.wikipedia.org/wiki/Hybrid_Broadcast_Broadband_TV

Technically Hbb-TV is based on HTTP/HTML/HTML-CE, a web browser 
with some additions for video streaming and IR remote controller handling.
In the DVB data stream of these TV stations an URL is sent, which 
is loaded by this web browser in your TV set.


Privacy ?
---------

If Hbb-TV is activated, your TV set sends a web request every time
you're changing channels. Which means the broadcasting companies 
can monitor exactly when and how long your are watching their channel.
And even worse, these web pages often include data collecting features 
like google analytics. 

Solution ?
----------

"hbb-tv-pp" is a proxy that filters the requests from your TV set,
replaces it with it's own menu and takes you in control. It's your
decision when and if you want to get web pages from the TV station.

HOWTO
-----

You need a Linux firewall to setup a transparent proxy, 
and node.js to run this proxy.

```
> npm install 
> node hpp.js -h
Usage: node hpp.js

  -l, --bindaddress=ARG  Listen to this IP
  -p, --port=ARG         Listen to this TCP Port (8000)
  -b, --blocklist=ARG    File with Blocklist URLs (Load and Save)
  -m, --mode=ARG         mode at startup: 0=transparent, 1=scanner, 2=privacyproxy (needs -b)
  -h, --help             display this help

> iptables -t nat -I PREROUTING  -s IP_OF_YOUR_TV_SET -p tcp --dport 80 -j REDIRECT --to-port 8000
> node hpp.js -b blocklist.json -m 1
```

On first run you should start hbb-tv-pp in scanner mode, and hop
through all your channels. hbb-tv-pp will remember all start pages
from your channel list. 

After this setup you can change to privacyproxy mode. In this mode all
start pages are filtered but with the red button you can 
intentionally open the original hbb-tv content.

If you want to start hbb-tv-pp in background at system start consider using "screen" or "forever"
(http://blog.nodejitsu.com/keep-a-nodejs-server-up-with-forever/). 

