/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_REVIEW_URL(){
    const reviewport = 1337;
    return `http://localhost:${reviewport}/reviews`
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const dbPromise = idb.open('restaureview', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaureview-store', {keyPath: "id"});
    });

    if(!navigator.serviceWorker.controller) {
    fetch(DBHelper.DATABASE_URL).then(response =>{
      if(response.status !== 200){
        console.log("something is wrong with the request"+ response.status);
        return;
      }
      response.json().then(restaurants =>{
        restaurants.map(restaurant =>{
          dbPromise.then(db => {
            const tx = db.transaction("restaureview-store", "readwrite");
            const restaureviewStore = tx.objectStore("restaureview-store");
            restaureviewStore.put(restaurant);
          });
        });
        callback(null, restaurants);

      });
    }).catch(err =>{
      console.log(err);
    });
    }else{
        dbPromise.then(db => {
          return db.transaction("restaureview-store")
                   .objectStore("restaureview-store")
                   .getAll();
        }).then(restaurants =>{
          callback(null, restaurants);
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

  static fetchReviews(id){
    let url = `${DBHelper.DATABASE_REVIEW_URL}/?restaurant_id=${id}`;
    fetch(url).then(response =>{
      console.log(response);
    return response.json()
    }).then(reviews => {
      reviews.forEach(review =>{
        console.log(review);
        fillReviewHTML(review);
      });
      
    }).catch(err => console.log("I failed but I won't stop till I get it right ", err));
    
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
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
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
  static restaurantId(restaurant){
    return `${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    
    return (`/img/${restaurant.photograph || restaurant.id}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

  static registerServiceWorker(){
    if(!navigator.serviceWorker)return;
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      console.log('I finally got it working');
    }, err=>{
      console.log('Could not register with ', err);
    });
  }



  static postReview(reviewToPost){
    const url = `http://localhost:1337/reviews/`;
    fetch(url,{
      method: 'POST',
      headers: {"Content-type": "application/json; charset=UTF-8"},
      body: JSON.stringify(reviewToPost)

    }).then(() => {
      const dbPromise = idb.open("restaurant-reviews", 1, upgradeDB =>{
        upgradeDB.createObjectStore("pending-reviews", {keyPath: "createdAt"});
      });

      dbPromise.then(dbObj => {
        dbObj
        .transaction("pending-reviews", "readwrite")
        .objectStore("pending-reviews")
        .clear();
      })
      //reload the page immediately
      location.reload(true)
    });
  }

// Favorite a restaurant
static markFavorite(id){
  const query = `http://localhost:1337/restaurants/${id}/?is_favorite=true`;
  fetch(query, {
    method: 'PUT'
  }).then(response => response.json()).then((resp) => {
    console.log(resp);
    const dbPromise = idb.open('restaureview', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaureview-store', {keyPath: "id"});
    });
        dbPromise.then((db) => {
        const tx = db.transaction('restaureview-store', 'readwrite');
        const objectStore = tx.objectStore('restaureview-store');
        objectStore.put(resp);
        return tx.complete;
    });
    
  }).catch((error) => {
    console.log(error);
  });
}

// Unfavorite a restaurant
static UnmarkFavorite(id){
  const query = `http://localhost:1337/restaurants/${id}/?is_favorite=false`;
  fetch(query, {
    method: 'PUT'
  }).then(response => response.json()).then((resp) => {
    console.log(resp);
    const dbPromise = idb.open('restaureview', 1, upgradeDB => {
      upgradeDB.createObjectStore('restaureview-store', {keyPath: "id"});
    });
        dbPromise.then((db) => {
        const tx = db.transaction('restaureview-store', 'readwrite');
        const objectStore = tx.objectStore('restaureview-store');
        objectStore.put(resp);
        return tx.complete;
    });
    
  }).catch((error) => {
    console.log(error);
  });
}

// //check if retaurant is favorite
// static isFavorite(restaurant){
//  // Check if restaurant has been added to favorites
// console.log(self.restaurants.id)
// console.log(self.restaurant.is_favorite);
// const is_favorite = restaurant.is_favorite;
//  const favoriteBtn = document.getElementById("favorite");
//  if (is_favorite) {
//    favoriteBtn.innerHTML = `Remove from favorites`;
//    favoriteBtn.classList.add("remove-favorite");
//  } else {
//    favoriteBtn.innerHTML = `Add to favorites`;
//    favoriteBtn.classList.add("add-favorite");
//  }
//}



  //Store any review posted by the user offline and wait for network connectivity
  static isOffline(reviewToPost = {}, submitted){
    if(submitted){
      const dbPromise = idb.open("restaurant-reviews", 1, upgradeDB => {
        upgradeDB.createObjectStore("pending-reviews", { keyPath: "id" });
      });

      dbPromise.then(dbObj =>{
        const tx = dbObj.transaction("pending-reviews", "readwrite");
        const pendingReviews = tx.objectStore("pendiing-reviews");
        pendingReviews.put(reviewToPost);
      });
    }
  }

  //Post the review when the user is back online
  static isOnline(reviewToPost ={}, submitted){
    if(submitted){
      DBHelper.postReview(reviewToPost);
    }
    const dbPromise = idb.open("restaurant-reviews", 1, upgradeDB => {
      upgradeDB.createObjectStore("pending-reviews", {
        keyPath: "createdAt"
      });

      dbPromise
      .then(dbObj =>{
        return dbObj
                .transaction("pending-reviews")
                .objectStore("pending-reviews")
                .getAll();
      }).then(reviews =>{
        reviews.map(review =>{
          DBHelper.postReview(review);
        });
      });
    });
  }

  static connectionStatus(reviewToPost){
    window.addEventListener("online", () => {
      DBHelper.isOnline(reviewToPost, false);
    });
    
    window.addEventListener("offline", () =>{
      DBHelper.isOffline(reviewToPost, false);
    });
  }

}



