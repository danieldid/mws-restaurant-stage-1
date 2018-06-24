let restaurants,
    neighborhoods,
    cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchNeighborhoods();
    fetchCuisines();
    updateRestaurants();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        option.setAttribute('role', 'option');
        select.append(option);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        option.setAttribute('role', 'option');
        select.append(option);
    });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    // addMarkersToMap();
    setObservable();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const restaurantPlaceholderImage = 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNMjY0LjE4MSw3Ni45MDljLTkzLjY0NiwwLTE2OS41NjEsNzUuOTE1LTE2OS41NjEsMTY5LjU2MXM3NS45MTUsMTY5LjU2MSwxNjkuNTYxLDE2OS41NjEgICAgczE2OS41NjEtNzUuOTE1LDE2OS41NjEtMTY5LjU2MVMzNTcuODI3LDc2LjkwOSwyNjQuMTgxLDc2LjkwOXogTTI2NC4xOCwzNzUuMTI5Yy03MC45NDIsMC0xMjguNjU4LTU3LjcxNi0xMjguNjU4LTEyOC42NTggICAgczU3LjcxNi0xMjguNjU4LDEyOC42NTgtMTI4LjY1OHMxMjguNjU4LDU3LjcxNiwxMjguNjU4LDEyOC42NThTMzM1LjEyMywzNzUuMTI5LDI2NC4xOCwzNzUuMTI5eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTI2NC4xOCwxNTIuMjk5Yy01MS45MjYsMC05NC4xNzEsNDIuMjQ1LTk0LjE3MSw5NC4xNzFjMCw1MS45MjYsNDIuMjQ1LDk0LjE3MSw5NC4xNzEsOTQuMTcxICAgIGM1MS45MjYsMCw5NC4xNzEtNDIuMjQ1LDk0LjE3MS05NC4xNzFTMzE2LjEwNywxNTIuMjk5LDI2NC4xOCwxNTIuMjk5eiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTUwMS4zMTUsMjYwLjY4N1Y1NC42NGMwLTEuOTg4LTEuMjY5LTMuNzU1LTMuMTU1LTQuMzljLTEuODg0LTAuNjM0LTMuOTYzLDAuMDA3LTUuMTY2LDEuNTkxICAgIGMtMjUuNzA4LDMzLjkwMy0zOS42MjIsNzUuMjgzLTM5LjYyMiwxMTcuODN2NzUuMzc4YzAsOC42NDUsNy4wMDgsMTUuNjU0LDE1LjY1NCwxNS42NTRoNi41MjYgICAgYy02LjQzMyw2Ni40NDMtMTAuNjg0LDE1OS4zNy0xMC42ODQsMTcwLjI1MWMwLDE3LjE0MiwxMC41NTEsMzEuMDM4LDIzLjU2NiwzMS4wMzhjMTMuMDE1LDAsMjMuNTY2LTEzLjg5NywyMy41NjYtMzEuMDM4ICAgIEM1MTIsNDIwLjA3Miw1MDcuNzQ5LDMyNy4xMyw1MDEuMzE1LDI2MC42ODd6IiBmaWxsPSIjMDAwMDAwIi8+Cgk8L2c+CjwvZz4KPGc+Cgk8Zz4KCQk8cGF0aCBkPSJNNjguNDE3LDIxOS44NDNjMTMuMDQyLTcuOSwyMS43NTktMjIuMjI0LDIxLjc1OS0zOC41ODZsLTYuNDYtMTA1LjYyMWMtMC4yNDctNC4wMjYtMy41ODQtNy4xNjUtNy42MTgtNy4xNjUgICAgYy00LjM2MywwLTcuODM5LDMuNjU1LTcuNjIyLDguMDFsNC4yMDEsODQuNzA5YzAsNC43NjItMy44NjEsOC42MjEtOC42MjEsOC42MjFjLTQuNzYxLDAtOC42MjEtMy44NjEtOC42MjEtOC42MjFsLTIuMDk5LTg0LjY3NCAgICBjLTAuMTExLTQuNDc1LTMuNzctOC4wNDQtOC4yNDctOC4wNDRjLTQuNDc3LDAtOC4xMzUsMy41Ny04LjI0Nyw4LjA0NGwtMi4wOTksODQuNjc0YzAsNC43NjItMy44NjEsOC42MjEtOC42MjEsOC42MjEgICAgYy00Ljc2MSwwLTguNjIxLTMuODYxLTguNjIxLTguNjIxbDQuMjAxLTg0LjcwOWMwLjIxNi00LjM1Ny0zLjI2Mi04LjAxLTcuNjIyLTguMDFjLTQuMDM0LDAtNy4zNzEsMy4xMzktNy42MTcsNy4xNjVMMCwxODEuMjU4ICAgIGMwLDE2LjM2Miw4LjcxNiwzMC42ODUsMjEuNzU5LDM4LjU4NmM4LjQ4OCw1LjE0MSwxMy4yMiwxNC43NTMsMTIuMTI2LDI0LjYxN2MtNy4zNjMsNjYuMzU4LTEyLjM2MywxNzQuNjkzLTEyLjM2MywxODYuNDk0ICAgIGMwLDE3LjE0MiwxMC41NTEsMzEuMDM4LDIzLjU2NiwzMS4wMzhjMTMuMDE1LDAsMjMuNTY2LTEzLjg5NywyMy41NjYtMzEuMDM4YzAtMTEuODAxLTUuMDAxLTEyMC4xMzYtMTIuMzYzLTE4Ni40OTQgICAgQzU1LjE5NiwyMzQuNjAyLDU5LjkzMywyMjQuOTgyLDY4LjQxNywyMTkuODQzeiIgZmlsbD0iIzAwMDAwMCIvPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=';

    const li = document.createElement('li');
    li.setAttribute('class', 'restaurant-li');

    const picture = document.createElement('picture');
    picture.setAttribute('class', 'restaurant-img');

    const imageURLs = DBHelper.imageUrlForRestaurant(restaurant);

    const srcSmall = document.createElement('source');
    srcSmall.setAttribute('srcset', restaurantPlaceholderImage);
    srcSmall.setAttribute('data-srcset', imageURLs.small);
    srcSmall.setAttribute('media', '(max-width: 599px)');

    const srcMedium = document.createElement('source');
    srcMedium.setAttribute('srcset', restaurantPlaceholderImage);
    srcMedium.setAttribute('data-srcset', imageURLs.medium);
    srcMedium.setAttribute('media', '(max-width: 799px)');

    const srcOriginal = document.createElement('source');
    srcOriginal.setAttribute('srcset', restaurantPlaceholderImage);
    srcOriginal.setAttribute('data-srcset', imageURLs.original);
    srcOriginal.setAttribute('media', '(min-width: 800px)');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = '';
    image.setAttribute('alt', restaurant.name);
    image.setAttribute('data-src', imageURLs.original);

    picture.append(srcSmall);
    picture.append(srcMedium);
    picture.append(srcOriginal);
    picture.append(image);
    li.append(picture);
    // li.append(image);

    const name = document.createElement('h3');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more)

    return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url
        });
        self.markers.push(marker);
    });
}

/*
*   IntersectionObserver - load images when visible in ViewPort
*/

setObservable = () => {
    const restaurantImgs = document.querySelectorAll('.restaurant-img');

    observer = new IntersectionObserver(entries => {
        root: document.getElementById('#restaurants-list');

        entries.forEach(entry => {
            if (entry.intersectionRatio > 0) {
                entry.target.childNodes.forEach(nodes => {
                    // src element
                    if(nodes.dataset.srcset !== undefined) {
                        nodes.setAttribute('srcset', nodes.dataset.srcset);
                    } else { // image element
                        nodes.setAttribute('src', nodes.dataset.src);
                    }
                });
                console.log('in the view');
            } else {
                console.log('out of view');
            }
        });
    });

    restaurantImgs.forEach(image => {
        observer.observe(image);
    });
}

onMapClick = () => {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA1anHP4EqVGlYIjoeuMUzb3hoFFo7gO_c&libraries=places&callback=initMap';
    script.setAttribute('defer', '');
    script.setAttribute('async', '');
    document.body.appendChild(script);
}
