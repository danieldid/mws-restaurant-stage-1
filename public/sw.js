const CACHE_NAME = 'restaurant-v3';
const IMG_CACHE = 'restaurant-image-v3';
const urlsToCache = [
    '/',
    '/restaurant.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/dbhelper.js',
    '/js/restaurant_info.js',
    '/js/idb.js',
    '/js/sw_init.js',
    '/js/sw.js',
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
    console.log(requestUrl);

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
