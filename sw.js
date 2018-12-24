if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js').then(function(registration) {
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    });
  }
let restaufiles = "restaureview-v1";
let restauImages = "restauimage-v1";
let cacheWhiteList = [restaufiles, restauImages];
self.addEventListener("install", event => {
    console.log('Installing service working...');
    event.waitUntil(
        caches.open(restaufiles).then(cache => {
            //add the files to be cached
            return cache.addAll([
                "./",
                "./index.html",
                "./restaurant.html",
                "./css/styles.css",
                "./js/dbhelper.js",
                "./js/main.js",
                "./js/idb.js",
                "./js/restaurant_info.js",
                "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
                "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
                "https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png",
                "https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png",
            ]);
        })
    );
});

self.addEventListener("activate", event =>{
    event.waitUntil(
        caches.keys().then(cacheNames =>{
            return Promise.all(cacheNames.map(cacheName =>{
                //loop through and delete caches not in my whitelist
                if(cacheWhiteList.indexOf(cacheName) === -1){
                    return caches.delete(cacheName);
                }
            }))
        })
    );
});

self.addEventListener("fetch", event => {
    
    const methods = ["POST", "PUT", "DELETE"];
    //make sure the response to cache are not PUT, POST or DELETE requests
    if (event.request.url.indexOf("is_favorite") !== -1 || methods.includes(event.request.method)) {
      return;
    }
    if (event.request.destination !== "image") {
      event.respondWith(
        caches.open(restaufiles).then(cache => {
           const url = event.request.url.split("?")[0];
            if (url.includes("restaurant")) {
              return cache.match(url);
            }
          return cache.match(event.request).then(cacheResponse => {
              //
           
            return (
              cacheResponse ||
              fetch(event.request, { cache: "default" }).then(responseToCache => {
                return caches.open(restaufiles).then(cache => {
                  cache.put(event.request, responseToCache.clone());
                  return responseToCache;
                });
              })
            );
          });
        })
      );
    } else {
      event.respondWith(
        caches.open(restauImages).then(cache => {
          return cache.match(event.request.url).then(cacheResponse => {
            return (
              cacheResponse ||
              fetch(event.request, { cache: "default" }).then(networkResponse => {
                return caches.open(restauImages).then(cache => {
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
              })
            );
          });
        })
      );
    }
  });
