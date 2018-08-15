import { oneLineTrim } from 'common-tags';
import { MDCRipple } from '@material/ripple';
import { MDCIconToggle } from '@material/icon-toggle';
import 'normalize.css/normalize.css';
import '../css/common.scss';
import '../css/card.scss';
import '../css/styles.css';
import LazyLoad from './lazyload.es2015';
import '../manifest.json';

import {
    registerSW,
    loadRestaurants,
    getCuisines,
    getNeighborhoods,
    getRestByCuisineNeighborhood,
    urlForRestaurant,
    sendFavorite,
    setFavorite
} from './db';

import {
    isDevMode,
    isInteractiveMapLoaded,
    addMarkersToMap,
    initMap,
    cleanMarkers
} from './map';

if (process.env.NODE_ENV !== 'development') {
    registerSW();
}

let globalLazyLoad;
let globalRestaurantCache;

const setRestaurantCache = (restaurants) => {
    globalRestaurantCache = restaurants;
};
const getRestaurantContainerElement = () => document.querySelector('.cards');

const resetRestaurants = () => {
    getRestaurantContainerElement().innerHTML = '';
    cleanMarkers();
};

const getHTMLFromElement = (el) => {
    const wrap = document.createElement('div');
    wrap.append(el);
    return wrap.innerHTML;
};

const createRestaurantCardElement = (restaurant) => {
    const wrap = document.createElement('div');
    wrap.className = 'mdc-card demo-card demo-card--hero';

    const image = document.createElement('img');
    image.className = 'restaurant-img lazyload';
    const img = require(`../img/${restaurant.id}.jpg`);
    image.src = img.placeholder;
    image.setAttribute('data-src', img.src);
    image.setAttribute('data-srcset', img.srcSet);
    image.setAttribute('style', 'width:100%');
    image.alt = `Photo for ${restaurant.name}`;
    const imageHTML = getHTMLFromElement(image);

    const cardHTML = oneLineTrim`
<div class="mdc-card__primary-action mdc-ripple-upgraded" tabindex="0">
<div class="mdc-card__media demo-card__media">
${imageHTML}
</div>
<div class="demo-card__primary">
<h3 class="demo-card__title mdc-typography--headline6">
${restaurant.name}
</h3>
</div>
<div class="demo-card__secondary mdc-typography--body2">
${restaurant.neighborhood}<br>
${restaurant.address}
</div>
</div>
<div class="mdc-card__actions">
<div class="mdc-card__action-buttons">
<a href="${urlForRestaurant(restaurant)}" class="mdc-button mdc-button-primary mdc-card__action mdc-card__action--button mdc-ripple-upgraded">
View
</a>
</div>
<div class="mdc-card__action-icons"></div>
</div>
`;

    wrap.innerHTML = cardHTML;
    const favorite = wrap.querySelector('.mdc-card__action-icons');

    if (typeof restaurant.is_favorite === 'string') {
        restaurant.is_favorite = !!parseInt(restaurant.is_favorite, 10);
    }
    const icon = restaurant.is_favorite ? 'favorite' : 'favorite_border';
    const ariaPressed = restaurant.is_favorite ? 'true' : 'false';
    favorite.innerHTML = oneLineTrim`
<span class="mdc-icon-toggle mdc-card__action mdc-card__action--icon"
role="button"
aria-pressed="${ariaPressed}"
aria-label="Make it favorite" tabindex="0"
data-icon-inner-selector=".material-icons"
data-toggle-on='{"content": "favorite", "label": "Make it favorite"}'
data-toggle-off='{"content": "favorite_border", "label": "Unfavorite it"}'>
<i id="${restaurant.id}" class="material-icons" aria-hidden="true">${icon}</i>
</span>`;

    const favouriteIcon = favorite.querySelector('.mdc-icon-toggle');
    MDCIconToggle.attachTo(favouriteIcon);
    favouriteIcon.addEventListener('click', (e) => {
        const restId = e.target.id;
        const isFavorite = e.target.parentElement.getAttribute('aria-pressed') === 'true';

        setFavorite(restId, isFavorite)
            .then(() => sendFavorite(restId, isFavorite))
            .then(response => response.json())
            .catch((error) => {
            console.info('Ufff, something went wrong: ', error);
        });
    });

    return wrap;
};

const fillRestaurantsHTML = (restaurants) => {
    restaurants.forEach((restaurant) => {
        getRestaurantContainerElement().append(createRestaurantCardElement(restaurant));
    });
    globalLazyLoad = new LazyLoad({ threshold: 0 });
};

const fillCuisinesHTML = (cuisines) => {
    const select = document.getElementById('cuisines-select');
    cuisines.forEach(
        (cuisine) => {
            const option = document.createElement('option');
            option.innerHTML = cuisine;
            option.value = cuisine;
            select.append(option);
        }
    );
};

const updateRestaurants = (restaurants = false) => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    const filtered = getRestByCuisineNeighborhood(cuisine, neighborhood, restaurants);
    resetRestaurants();
    fillRestaurantsHTML(filtered);
    addMarkersToMap(filtered);
    setRestaurantCache(filtered);
};

const loadAndUpdateRestaurants = () => {
    loadRestaurants()
        .then((response) => {
        updateRestaurants(response);
    })
        .catch(err => console.error(err));
};

const fillNeighborhoodsHTML = (neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');

    neighborhoods.forEach(
        (neighborhood) => {
            const option = document.createElement('option');
            option.innerHTML = neighborhood;
            option.value = neighborhood;
            select.append(option);
        }
    );
};

const fetchRestaurants = () => {
    loadRestaurants()
        .then((restaurants) => {
        fillNeighborhoodsHTML(getNeighborhoods(restaurants));
        fillCuisinesHTML(getCuisines(restaurants));
        updateRestaurants(restaurants);
    });
};


const renderMap = () => {
    initMap(400, 'map', () => globalRestaurantCache)
        .then(() => {
        fetchRestaurants();
    });
};

const initMaterial = () => {
    const ripples = [];
    document.querySelectorAll('.mdc-card__primary-action').forEach(el => ripples.push(new MDCRipple(el)));
    document.querySelectorAll('.mdc-button').forEach(el => ripples.push(new MDCRipple(el)));
    document.querySelectorAll('.mdc-icon-button')
        .forEach((el) => {
        const ripple = new MDCRipple(el);
        ripple.unbounded = true;
        ripples.push(ripple);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    renderMap();
    document.getElementById('neighborhoods-select').addEventListener('change', loadAndUpdateRestaurants);
    document.getElementById('cuisines-select').addEventListener('change', loadAndUpdateRestaurants);
    initMaterial();
});

window.addEventListener('resize', () => {
    if (!isInteractiveMapLoaded()) {
        renderMap();
    }
});
