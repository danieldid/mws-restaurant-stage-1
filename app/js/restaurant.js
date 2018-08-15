import {
    oneLineTrim
} from 'common-tags';
import {
    MDCDialog
} from '@material/dialog';
import {
    MDCTextField
} from '@material/textfield';
import {
    MDCRipple
} from '@material/ripple';
import {
    MDCFormField
} from '@material/form-field';
import {
    MDCRadio
} from '@material/radio';
import {
    MDCSnackbar,
    MDCSnackbarFoundation
} from '@material/snackbar';
import 'normalize.css/normalize.css';
import 'css-star-rating';
import '../css/common.scss';
import '../css/dialog.scss';
import '../css/styles.css';
import LazyLoad from './lazyload.es2015';
import '../manifest.json';


import {
    isInteractiveMapLoaded,
    addMarkersToMap,
    initMap
} from './map';

import {
    registerSW,
    loadRestaurants,
    loadRestReviewsByRest,
    getRestById,
    storeReview,
    sendReview,
    getNextReviewId
} from './db';

if (process.env.NODE_ENV !== 'development') {
    registerSW();
}

let globalLazyLoad;
let globalRestCache;
let globalDialog;
const MDCitems = [];

const getReviewsContainerEl = () => document.querySelector('#reviews-container');

const resetReviews = () => {
    getReviewsContainerEl().innerHTML = oneLineTrim `
<ul class="mdc-list mdc-list--two-line" aria-orientation="vertical" id="reviews-list"></ul>
<button class="mdc-button add-review-button">
Add review
</button>`;
};

const fillRestaurantHoursHTML = (operatingHours) => {
    const hours = document.getElementById('restaurant-hours');
    if (!hours || Array.isArray(operatingHours)) {
        return false;
    }
    Object.keys(operatingHours).forEach((key) => {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    });
};


const createRatingHTML = (reviewId, score) => {
    let scoreParsed = parseInt(score) ? parseInt(score) : 0;
    scoreParsed = scoreParsed > 5 ? 5 : scoreParsed;

    let color = 'color-default';
    switch (scoreParsed) {
        case 2:
        case 3:
            color = 'color-ok';
            break;
        case 4:
        case 5:
            color = 'color-positive';
            break;
        case 0:
        case 1:
        default:
            color = 'color-negative';
    }


    const ratingHTML = oneLineTrim `
<div aria-labelledby="rating-${reviewId}" class="rating medium star-icon value-${scoreParsed} ${color}">
<div class="label-value" id="rating-${reviewId}">${scoreParsed} of 5</div>
<div class="star-container">
<div class="star">
<i class="star-empty"></i>
<i class="star-filled"></i>
</div>
<div class="star">
<i class="star-empty"></i>
<i class="star-filled"></i>
</div>
<div class="star">
<i class="star-empty"></i>
<i class="star-filled"></i>
</div>
<div class="star">
<i class="star-empty"></i>
<i class="star-filled"></i>
</div>
<div class="star">
<i class="star-empty"></i>
<i class="star-filled"></i>
</div>
</div>
</div>
`;

    return ratingHTML;
};

const createReviewHTML = (review) => {
    const p = document.createElement('p');
    p.classList.add('mdc-list-item__text');

    const li = document.createElement('li');
    li.classList.add('mdc-list-item');

    const name = document.createElement('p');
    name.innerHTML = review.name + createRatingHTML(review.id, review.rating);
    name.tabIndex = 0;
    name.classList.add('mdc-list-item__primary-text');
    // li.appendChild(name);

    const date = document.createElement('p');
    const validDate = (new Date(review.createdAt)).getTime() > 0;
    const dateValue = validDate ? new Date(review.createdAt) : new Date();
    date.innerHTML = (dateValue).toLocaleDateString();
    date.classList.add('mdc-list-item__secondary-text');
    // li.appendChild(date);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    comments.classList.add('mdc-list-item__secondary-text');
    // li.appendChild(comments);

    p.appendChild(name);
    p.appendChild(date);
    p.appendChild(comments);

    li.appendChild(p);

    return li;
};

const fillReviewsHTML = (reviews) => {
    resetReviews();
    const container = getReviewsContainerEl();
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    title.tabIndex = 0;
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }

    const ul = document.getElementById('reviews-list');
    Object.keys(reviews).forEach(key => ul.appendChild(createReviewHTML(reviews[key])));
    container.appendChild(ul);

    container.querySelector('.add-review-button')
        .addEventListener('click', (event) => {
            globalDialog.lastFocusedTarget = event.target;
            globalDialog.show();
        });
};


const fillRestaurantHTML = (restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    if (image) {
        const img = require(`../img/${restaurant.id}.jpg`);
        image.src = img.placeholder;
        image.setAttribute('data-src', img.src);
        image.setAttribute('data-srcset', img.srcSet);
        image.className = 'restaurant-img lazyload';
        image.alt = `Photo for ${restaurant.name}`;
        globalLazyLoad = new LazyLoad({
            threshold: 0
        });
    }

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML(restaurant.operating_hours);
    }
};

const fillBreadcrumb = (restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    li.setAttribute('aria-current', 'page');
    breadcrumb.appendChild(li);
};

const getUrlParam = (name, urlString = document.location) => {
    const url = new URL(urlString);
    return url.searchParams.get(name);
};

const renderMap = () => {
    initMap(400, 'map', () => [globalRestCache])
        .then(() => {
            addMarkersToMap([globalRestCache]);
        });
};

const getRadioValue = (radioName) => {
    const radios = document.getElementsByName(radioName);
    let result = false;
    radios.forEach((val, i) => {
        if (radios[i].checked) {
            result = radios[i].value;
        }
    });
    return result;
};

const resetRadio = (radioName) => {
    const radios = document.getElementsByName(radioName);
    radios.forEach((val, i) => {
        radios[i].checked = false;
    });
};

const resetText = (textSelector) => {
    const text = document.querySelector(textSelector);
    if (text) {
        text.value = '';
    }
};

const resetDialog = () => {
    resetRadio('radios');
    resetText('#text');
    resetText('#name');
};

const initDialog = (dialogSelector) => {
    globalDialog = new MDCDialog(document.querySelector(dialogSelector));

    globalDialog.listen('MDCDialog:accept', () => {
        const restId = getUrlParam('id');
        const comment = document.querySelector('#text').value;
        const rating = getRadioValue('radios');
        const name = document.querySelector('#name').value;

        getNextReviewId()
            .then((nextReviewId) => {
                const review = {
                    id: nextReviewId,
                    restaurant_id: restId,
                    name,
                    rating,
                    comments: comment
                };

                storeReview(review)
                    .then(() => sendReview(review))
                    .then(() => loadRestReviewsByRest(restId))
                    .then(reviews => fillReviewsHTML(reviews));
            });
        resetDialog();
    });
    globalDialog.listen('MDCDialog:cancel', () => console.log('canceled'));
    document.querySelector('.fab-add-review-button')
        .addEventListener('click', (event) => {
            globalDialog.lastFocusedTarget = event.target;
            globalDialog.show();
        });

    document.querySelectorAll('.mdc-text-field').forEach(el => MDCitems.push(new MDCTextField(el)));
    MDCitems.push(new MDCRipple(document.querySelector('.mdc-fab')));
    MDCitems.push(new MDCRipple(document.querySelector('.mdc-button')));
    const radio = new MDCRadio(document.querySelector('.mdc-radio'));
    const formField = new MDCFormField(document.querySelector('.mdc-form-field'));
    formField.input = radio;

    // show button
    document.querySelector('.mdc-fab--exited').classList.remove('mdc-fab--exited');
};

document.addEventListener('DOMContentLoaded', () => {
    initDialog('#my-mdc-dialog');
    loadRestaurants()
        .then((restaurants) => {
            const id = getUrlParam('id');
            if (!id) {
                window.location.href = 'index.html';
            } else {
                globalRestCache = getRestById(id, restaurants);
                fillRestaurantHTML(globalRestCache);
                fillBreadcrumb(globalRestCache);
                renderMap();
                loadRestReviewsByRest(id)
                    .then(reviews => fillReviewsHTML(reviews));
            }
        });
});

window.addEventListener('resize', () => {
    if (!isInteractiveMapLoaded()) {
        renderMap();
    }
});
