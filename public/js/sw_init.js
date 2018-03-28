/*
 *
 *   Service Worker registration
 *
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', loaded =>
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('serviceWorker registered!');
        }).catch(fail => {
            console.error(fail);
        })
    );
}
