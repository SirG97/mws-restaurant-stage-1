if (!navigator.serviceWorker.controller) {
  DBHelper.registerServiceWorker();
  console.log("Service worker is registering in the restaurant");
}


let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoic2FyZ2V0aGVib3NzIiwiYSI6ImNqa2dsc2t2bjBqZnkzcHBieWNpeXhjZ3IifQ.7jLkkpwne9aBCXRzAq6ObQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  
 
/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  // if (!reviews) {
  //   const noReviews = document.createElement('p');
  //   noReviews.innerHTML = 'No reviews yet!';
  //   container.appendChild(noReviews);
  //   return;
  // }
  const ul = document.getElementById('reviews-list');
  DBHelper.fetchReviews(self.restaurant.id)
 
  container.appendChild(ul);
}

fillReviewHTML = (review) => {
  const container = document.getElementById('reviews-container');
  if (!review) {
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  ul.appendChild(createReviewHTML(review));
  container.appendChild(ul);

}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('h3');
  name.innerHTML = review.name;

  name.tabIndex = 0;
  li.appendChild(name);

  const date = document.createElement('p');
  let mili = `${review.createdAt}`;
  let d = new Date();
  
  date.innerHTML = d.toDateString(mili);
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.tabIndex = 0;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

// Submitting the review
let reviewData = document.getElementById('reviewForm');
reviewData.addEventListener('submit', (event)=>{
  event.preventDefault();
   let formData = new FormData(reviewData);
   console.log(new Date().getTime());

   let reviewToPost = {
     "restaurant_id": self.restaurant.id,
     "name": formData.get('name'),
     "rating": formData.get('rating'),
     "comments": formData.get('comment'),
     "createdAt": new Date().getTime(),
     "updatedAt": new Date().getTime() 
   }
   
   if(reviewToPost.comments == undefined || reviewToPost.name == undefined){
     console.log("Fill in the required field");
     return false
   }
    //  If there is network, post the form

      if(navigator.onLine){
        DBHelper.isOnline(reviewToPost, true);
      }else{
        DBHelper.isOffline(reviewToPost, true);
      }
    


});

let favoritebtn = document.getElementById('favourite');
favoritebtn.addEventListener('click', () =>{
  const classNames = Array.from(favoritebtn.classList);
  let favorite = false;
  console.log("here is ok");
  if (classNames.includes("add-favorite")) {
    console.log("here eeeeehhnnnnnnmmm is ok");
   let favorite = true;
    favoritebtn.innerHTML = `Remove from favorites`;
    favoritebtn.classList.remove("add-favorite");
    favoritebtn.classList.add("remove-favorite");
  } else {
    console.log("here is kinda ok");
    
    favoritebtn.innerHTML = `Add to favorites`;
    favoritebtn.classList.remove("remove-favorite");
    favoritebtn.classList.add("add-favorite");
  }

  const dbPromise = idb.open('restaureview', 1, upgradeDB => {
    upgradeDB.createObjectStore('restaureview-store', {keyPath: "id"});
  });
  const restaurantId = Number(getParameterByName("id"));
console.log(restaurantId);
console.log(self.restaurant.id);
  fetch(`http://localhost:1337/restaurants/${self.restaurant.id}/?is_favorite=${favorite}`, 
      {method: 'PUT'})
      .then(response => {console.log(response)})
      .then(response => {
        dbPromise.then(dbObj => {
          const tx = dbObj.transaction("restaureview-store", "readwrite");
          const restaureview = tx.objectStore("restaureview-store");
          restaureview.put(response);
        });})
        .catch(err => console.log("fetch error", err));
});


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


