// Root scope keeps the public Pages link reachable when offline.
self.EMBER_ASSET_BASE=new URL('./dist/',self.location.href);
importScripts('./dist/sw.js');
