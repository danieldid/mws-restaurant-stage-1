/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        // const port = 8887 // Change this to your server port
        // return `data/restaurants.json`; //http://localhost:${port}/

        return `http://localhost:1337/restaurants`;
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        // open database and create object store
        const dbPromise = idb.open('mws', 1, upgradeDB => {
            const idbRestaurants = upgradeDB.createObjectStore('restaurants');
        });

        let restaurants = null;

        // when online fetch data and store it in idb
        if(navigator.onLine) {
            console.log('online');

            // fetch external source
            restaurants = fetch('http://localhost:1337/restaurants').then(res => {
                // clone response
                res.clone().text().then(responseText => {
                    dbPromise.then(db => {
                        const tx = db.transaction('restaurants', 'readwrite');
                        // put data into object store
                        tx.objectStore('restaurants').put(JSON.parse(responseText), 'data');
                        return tx.complete;
                    });
                });
                // return data to restaurants
                return res.json();
            }).then(data => {
                callback(null, data);
                return data;
            });
        } else { // when offline get data from idb
            console.log('offline');

            restaurants = dbPromise.then(db => {
                const tx = db.transaction('restaurants', 'readwrite');

                // read data from restaurants object store
                return tx.objectStore('restaurants').getAll().then(data => {
                    // return data to restaurants
                    callback(null, data[0]);
                    return data[0];
                });
            }).then((data) => {
                console.log(data);
                callback(null, data);
                return data;
            }).catch(err => {
                console.error(err);
                return null;
            });
        }

    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) { // Got the restaurant
                    callback(null, restaurant);
                } else { // Restaurant does not exist in the database
                    callback('Restaurant does not exist', null);
                }
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            console.log('fetchRestaurantByNeighborhood');
            if (error) {
                console.error(error);
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                console.log(restaurants);
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        const restaurantPlaceholderImage = 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjY0LjE4MSw3Ni45MDljLTkzLjY0NiwwLTE2OS41NjEsNzUuOTE1LTE2OS41NjEsMTY5LjU2MXM3NS45MTUsMTY5LjU2MSwxNjkuNTYxLDE2OS41NjEgICAgczE2OS41NjEtNzUuOTE1LDE2OS41NjEtMTY5LjU2MVMzNTcuODI3LDc2LjkwOSwyNjQuMTgxLDc2LjkwOXogTTI2NC4xOCwzNzUuMTI5Yy03MC45NDIsMC0xMjguNjU4LTU3LjcxNi0xMjguNjU4LTEyOC42NTggICAgczU3LjcxNi0xMjguNjU4LDEyOC42NTgtMTI4LjY1OHMxMjguNjU4LDU3LjcxNiwxMjguNjU4LDEyOC42NThTMzM1LjEyMywzNzUuMTI5LDI2NC4xOCwzNzUuMTI5eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTI2NC4xOCwxNTIuMjk5Yy01MS45MjYsMC05NC4xNzEsNDIuMjQ1LTk0LjE3MSw5NC4xNzFjMCw1MS45MjYsNDIuMjQ1LDk0LjE3MSw5NC4xNzEsOTQuMTcxICAgIGM1MS45MjYsMCw5NC4xNzEtNDIuMjQ1LDk0LjE3MS05NC4xNzFTMzE2LjEwNywxNTIuMjk5LDI2NC4xOCwxNTIuMjk5eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTUwMS4zMTUsMjYwLjY4N1Y1NC42NGMwLTEuOTg4LTEuMjY5LTMuNzU1LTMuMTU1LTQuMzljLTEuODg0LTAuNjM0LTMuOTYzLDAuMDA3LTUuMTY2LDEuNTkxICAgIGMtMjUuNzA4LDMzLjkwMy0zOS42MjIsNzUuMjgzLTM5LjYyMiwxMTcuODN2NzUuMzc4YzAsOC42NDUsNy4wMDgsMTUuNjU0LDE1LjY1NCwxNS42NTRoNi41MjYgICAgYy02LjQzMyw2Ni40NDMtMTAuNjg0LDE1OS4zNy0xMC42ODQsMTcwLjI1MWMwLDE3LjE0MiwxMC41NTEsMzEuMDM4LDIzLjU2NiwzMS4wMzhjMTMuMDE1LDAsMjMuNTY2LTEzLjg5NywyMy41NjYtMzEuMDM4ICAgIEM1MTIsNDIwLjA3Miw1MDcuNzQ5LDMyNy4xMyw1MDEuMzE1LDI2MC42ODd6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNjguNDE3LDIxOS44NDNjMTMuMDQyLTcuOSwyMS43NTktMjIuMjI0LDIxLjc1OS0zOC41ODZsLTYuNDYtMTA1LjYyMWMtMC4yNDctNC4wMjYtMy41ODQtNy4xNjUtNy42MTgtNy4xNjUgICAgYy00LjM2MywwLTcuODM5LDMuNjU1LTcuNjIyLDguMDFsNC4yMDEsODQuNzA5YzAsNC43NjItMy44NjEsOC42MjEtOC42MjEsOC42MjFjLTQuNzYxLDAtOC42MjEtMy44NjEtOC42MjEtOC42MjFsLTIuMDk5LTg0LjY3NCAgICBjLTAuMTExLTQuNDc1LTMuNzctOC4wNDQtOC4yNDctOC4wNDRjLTQuNDc3LDAtOC4xMzUsMy41Ny04LjI0Nyw4LjA0NGwtMi4wOTksODQuNjc0YzAsNC43NjItMy44NjEsOC42MjEtOC42MjEsOC42MjEgICAgYy00Ljc2MSwwLTguNjIxLTMuODYxLTguNjIxLTguNjIxbDQuMjAxLTg0LjcwOWMwLjIxNi00LjM1Ny0zLjI2Mi04LjAxLTcuNjIyLTguMDFjLTQuMDM0LDAtNy4zNzEsMy4xMzktNy42MTcsNy4xNjVMMCwxODEuMjU4ICAgIGMwLDE2LjM2Miw4LjcxNiwzMC42ODUsMjEuNzU5LDM4LjU4NmM4LjQ4OCw1LjE0MSwxMy4yMiwxNC43NTMsMTIuMTI2LDI0LjYxN2MtNy4zNjMsNjYuMzU4LTEyLjM2MywxNzQuNjkzLTEyLjM2MywxODYuNDk0ICAgIGMwLDE3LjE0MiwxMC41NTEsMzEuMDM4LDIzLjU2NiwzMS4wMzhjMTMuMDE1LDAsMjMuNTY2LTEzLjg5NywyMy41NjYtMzEuMDM4YzAtMTEuODAxLTUuMDAxLTEyMC4xMzYtMTIuMzYzLTE4Ni40OTQgICAgQzU1LjE5NiwyMzQuNjAyLDU5LjkzMywyMjQuOTgyLDY4LjQxNywyMTkuODQzeiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=';

        return {
            original: (restaurant.photograph) ? (`/img/${restaurant.photograph}`) : restaurantPlaceholderImage,
            medium: (restaurant.photograph) ? (`/img/${restaurant.photograph_medium}`) : restaurantPlaceholderImage,
            small: (restaurant.photograph) ? (`/img/${restaurant.photograph_small}`) : restaurantPlaceholderImage
        };
        // return (`/img/${restaurant.photograph}`);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
            position: restaurant.latlng,
            title: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant),
            map: map,
            animation: google.maps.Animation.DROP
        });
        return marker;
    }

}
