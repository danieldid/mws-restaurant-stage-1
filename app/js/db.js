/* global google */
import {
    oneLineTrim
} from 'common-tags';
import {
    MDCSnackbar
} from '@material/snackbar';
import localForage from 'localforage';
import {
    extendPrototype
} from 'localforage-startswith';

extendPrototype(localForage);

const dbPrefixRestaurant = 'restaurants';
const dbPrefixReview = 'review';

const getServer = () => 'http://localhost:1337';
const getAllRestUrl = () => `${getServer()}/restaurants`;
const getRestReviewUrl = () => `${getServer()}/reviews`;
const getRestReviewByRestUrl = () => `${getRestReviewUrl()}/?restaurant_id=`;
const getRestByIdReviewsUrl = restId => `${getRestReviewByRestUrl()}${restId}`;

localForage.config({
    driver: localForage.INDEXEDDB,
    name: 'Restaurant Reviews',
    version: 1.0,
    storeName: 'reviews'
});

const localForageData = key => localForage.getItem(key).then(value => value);
export const pluck = (array, key) => array.map(object => object[key]);
export const uniq = array => array.filter((v, i, a) => a.indexOf(v) === i);
export const zeroPad = (num, places = 10) => {
    const zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
};

export const loadRestaurants = () => fetch(getAllRestUrl(), {
        credentials: 'omit'
    })
    .then(response => response
        .json()
        .then(json => localForage.setItem(dbPrefixRestaurant, json))
        .then(() => localForage.getItem(dbPrefixRestaurant))
        .then(restaurants => restaurants))
    .catch(() => {
        // offline
        return localForageData(dbPrefixRestaurant);
    });

export const setFavorite = (restId, isFavorite) => {
    return localForage.getItem(dbPrefixRestaurant)
        .then((items) => {
            for (let i = 0; i < items.length; i += 1) {
                if (parseInt(items[i].id, 10) === parseInt(restId, 10)) {
                    items[i].is_favorite = isFavorite;
                    break;
                }
            }
            return localForage.setItem(dbPrefixRestaurant, items);
        });
};

export const getNextReviewId = () => {
    let maxId = 0;
    const prefixRegexp = new RegExp(`^${dbPrefixReview}-`);
    return localForage.iterate((v, k) => {
        if (prefixRegexp.test(k)) {
            if (v.id > maxId) {
                maxId = v.id;
            }
        }
    }).then(() => {
        maxId += 200;
        return maxId;
    });
};

export const storeReview = (review) => {
    const formattedId = zeroPad(parseInt(review.id, 10));
    const key = `${dbPrefixReview}-${review.restaurant_id}-${formattedId}`;
    return localForage.setItem(key, review);
};
export const storeReviews = reviews => Promise.all(reviews.map(item => storeReview(item)));
export const getReviewsByRestId = (restId) => {
    const prefix = `${dbPrefixReview}-${restId}-`;
    return localForage.startsWith(prefix)
        .then((reviews) => {
            return reviews;
        });
};

export const loadRestReviewsByRest = (restId) => {
    return fetch(getRestByIdReviewsUrl(restId), {
            credentials: 'omit'
        })
        .then(response => response
            .json()
            .then(json => storeReviews(json))
            .then(() => getReviewsByRestId(restId))
            .then(reviews => reviews))
        .catch((error) => {
            console.error(error);
            return getReviewsByRestId(restId);
        });
};

export const showNotification = (text, options = {
    needRefresh: false
}) => {
    const snackbar = document.querySelector('#notifications');
    snackbar.innerHTML = oneLineTrim `
<div class="mdc-snackbar" aria-live="assertive" aria-atomic="true" aria-hidden="true">
<div class="mdc-snackbar__text"></div>
<div class="mdc-snackbar__action-wrapper">
<button type="button" class="mdc-snackbar__action-button"></button>
</div>
</div>`;

    const snackbarJS = new MDCSnackbar(snackbar.querySelector('.mdc-snackbar'));

    if (options.needRefresh) {
        snackbarJS.show({
            message: text,
            multiline: true,
            timeout: 60000,
            actionText: 'Refresh',
            actionHandler: () => {
                window.location.reload();
            }
        });
    } else {
        snackbarJS.show({
            message: text,
            timeout: 5000,
            multiline: true
        });
    }
};

export const getRestById = (n, h) => h.find(r => String(r.id) === String(n));
export const getRestByCuisine = (n, h) => h.filter(r => r.cuisine_type === n);

export const getRestByCuisineNeighborhood = (cuisine, neighborhood, restaurants) => {
    let results = restaurants;
    if (cuisine !== 'all') {
        results = results.filter(r => r.cuisine_type === cuisine);
    }
    if (neighborhood !== 'all') {
        results = results.filter(r => r.neighborhood === neighborhood);
    }
    return results;
};

export const getNeighborhoods = restaurants => uniq(pluck(restaurants, 'neighborhood'));
export const getCuisines = restaurants => uniq(pluck(restaurants, 'cuisine_type'));
export const urlForRestaurant = restaurant => `./restaurant.html?id=${restaurant.id}`;

export const mapMarkerForRestaurant = (restaurant, map) => new google.maps.Marker({
    position: restaurant.latlng,
    title: restaurant.name,
    url: urlForRestaurant(restaurant),
    map
});

export const titleGoogleMap = (map, title) => {
    google.maps.event.addListener(map, 'tilesloaded', () => {
        try {
            document.getElementById('map')
                .querySelector('iframe')
                .title = title;
        } catch (error) {
            console.warn('Ufff, something went wrong: ', error);
        }

        return map;
    });
};

export const registerSW = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(() => {
                    navigator.serviceWorker.addEventListener('message', (event) => {
                        switch (event.data) {
                            case 'favorite-stored':
                            case 'reviews-stored':
                                showNotification('Saved!');
                                break;
                            case 'reviews-inprogress':
                            case 'favorite-inprogress':
                                showNotification('Saving in progress');
                                break;
                            case 'reviews-done':
                            case 'favorite-done':
                                showNotification('All done. Please refresh', {
                                    needRefresh: true
                                });
                                break;
                            default:
                                console.info('Ufff, something went wrong: ', event.data);
                        }
                    });
                });
        });
    }
};

export const sendFavorite = (restaurantId, isFavorite) => {
    showNotification('Saving as favorite');
    return fetch(`${getAllRestUrl()}/${restaurantId}/`, {
            method: 'PUT',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `is_favorite=${(isFavorite) ? 1 : 0}`
        })
        .catch(() => {
            // offline
            showNotification('Ufff, seems like you have bad connection! We save it later for you.');
            console.warn('Unable to save favorite');
        });
};

export const sendReview = (review) => {
    showNotification('Saving your review');
    return fetch(`${getRestReviewUrl()}/`, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(review)
        })
        .catch(() => {
            // offline
            showNotification('Ufff, seems like you have bad connection! We save it later for you.');
            console.warn('Unable to save review');
        });
};
