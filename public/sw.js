const CACHE_NAME = 'restaurant-v2';
const IMG_CACHE = 'restaurant-image-v2';
const urlsToCache = [
    '/',
    '/restaurant.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/data/restaurants.json'
];


self.addEventListener('install', install => {
    console.log('serviceWorker installed!');
    install.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache opened!');
            return cache.addAll(urlsToCache).then(() => {
                return self.skipWaiting(); // To forces the waiting service worker to become the active service worker
            });
        })
    );
});

self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/') {
            event.respondWith(caches.match('/'));
            return;
        }
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(caches.match('restaurant.html'));
            return;
        }
        // cache and serve local images
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
        // cache and serve GMaps images
        /*if (requestUrl.pathname.startsWith('/mapfiles/api-v3/images/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }*/
    }

    event.respondWith(
        caches.match(event.request).then(function (response) {
            // const myResponse = response.clone();
            return response || fetch(event.request.clone());
        })
    );


    /*event.respondWith(
        caches.match(event.request)
        .then(response => {
            // Cache hit - return response
            if (response) {
                console.log('cached content delivered ' + event.request.url);
                return response;
            }

            // IMPORTANT: Clone the request. A request is a stream and
            // can only be consumed once. Since we are consuming this
            // once by cache and once by the browser for fetch, we need
            // to clone the response.
            var fetchRequest = event.request.clone();

            return fetch(fetchRequest).then(
                response => {
                    // Check if we received a valid response
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // IMPORTANT: Clone the response. A response is a stream
                    // and because we want the browser to consume the response
                    // as well as the cache consuming the response, we need
                    // to clone it so we have two streams.
                    var responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                }
            );
        }).catch(err => {
            console.error(err);
        })
    );*/
});

function servePhoto(request) {
    const storageUrl = request.url;

    console.log('servePhoto ' + storageUrl);
    
    return caches.open(IMG_CACHE).then(cache => {
        return cache.match(storageUrl).then(response => {
            if (response) return response;

            return fetch(request).then(networkResponse => {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

self.addEventListener('activate', (event) => {
    console.info('Event: Activate');

    // Remove old and unwanted caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) return caches.delete(cache);
                })
            );
        })
    );
});
