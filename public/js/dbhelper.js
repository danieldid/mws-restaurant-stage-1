/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 8887 // Change this to your server port
        return `data/restaurants.json`; //http://localhost:${port}/
    }

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {

        caches.open('restaurant-v1').then(cache => {
            cache.match(DBHelper.DATABASE_URL).then(response => {
                if (response) {
                    response.clone().text().then(responseText => {
                        callback(null, JSON.parse(responseText).restaurants);
                        return;
                    });
                }
            });
        });

        const restaurants = fetch(DBHelper.DATABASE_URL, {
            mode: 'no-cors'
        }).then(response => {
            if (response) {
                response.clone().text().then(responseText => {
                    callback(null, JSON.parse(responseText).restaurants);
                });
            }
        });

        // callback(null, )
        // return restaurants;


        /*let xhr = new XMLHttpRequest();
        xhr.open('GET', DBHelper.DATABASE_URL);
        xhr.onload = () => {
            if (xhr.status === 200) { // Got a success response from server!
                const json = JSON.parse(xhr.responseText);
                const restaurants = json.restaurants;
                callback(null, restaurants);
            } else { // Oops!. Got an error from server.
                const error = (`Request failed. Returned status of ${xhr.status}`);
                callback(error, null);
            }
        };
        xhr.send();*/
    }



    /*static fetchRestaurants(callback) {
        caches.open('restaurant-v1').then(cache => {
            cache.match('data/restaurants.json').then(response => {
                const newResponse = response.clone();

                // when offline
                if (typeof response !== undefined) {
                    response = fetch(DBHelper.DATABASE_URL, {
                        mode: 'no-cors'
                    }).then(res => {
                        return res.clone();
                    });
                }

                console.log(response);

                // returning json
                response.then(responseText => {
                    responseText.text().then(text => {
                        callback(null, JSON.parse(text).restaurants);
                    }).catch(err => {
                        console.log('Error encountered in text:');
                        console.error(err);
                    });
                }).catch(err => {
                    console.log('Error encountered in cache:');
                    console.error(err);
                });
            }).catch(err => {
                console.log('Error encountered in caches:');
                console.error(err);
            });
        });
    }*/

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
        return {
            original: (`/img/${restaurant.photograph}`),
            medium: (`/img/${restaurant.photograph_medium}`),
            small: (`/img/${restaurant.photograph_small}`)
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
