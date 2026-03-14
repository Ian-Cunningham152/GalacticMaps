// Global variables
let map;
let directionsService;
let directionsRenderer;

let selectedFavoriteRouteId = null;

let originPlaceId = null;
let destinationPlaceId = null;

let waypointPlaceIds = [];
let waypointInputs = [];

// Maximum number of waypoints allowed 
const MAX_WAYPOINTS = 5;

const user = JSON.parse(localStorage.getItem('gmUser'));
const userId = user.userId;

// Initialize the map and services
function initMap() {

  // Default to San Francisco if geolocation fails
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false
  });

  // Initialize the DirectionsService and DirectionsRenderer
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setPanel(document.getElementById("directions-panel"));

  // Bind the DirectionsRenderer to the map
  directionsRenderer.setMap(map);

  setupAutocomplete();

  getUserLocation();
}

// Set up autocomplete for origin and destination inputs
function setupAutocomplete() {

  // Get the input elements
  const originInput = document.getElementById("origin-input");
  const destinationInput = document.getElementById("destination-input");

  // Create autocomplete for origin input
  const originAutocomplete = new google.maps.places.Autocomplete(originInput, {
    fields: ["place_id", "formatted_address"]
  });

  // Create autocomplete for destination input
  const destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput, {
    fields: ["place_id", "formatted_address"]
  });

  // Add listener to clear origin place ID when input is emptied or changed
  originInput.addEventListener("input", () => {
    if (originInput.value === "") {
      originPlaceId = null;
      originSelected = false;
    } else if (originFormattedAddress && originInput.value !== originFormattedAddress) {
      originPlaceId = null;
      originSelected = false;
    }
  });

  // Add listener to clear destination place ID when input is emptied or changed
  destinationInput.addEventListener("input", () => {
    if (destinationInput.value === "") {
      destinationPlaceId = null;
      destinationSelected = false;
    } else if (destinationFormattedAddress && destinationInput.value !== destinationFormattedAddress) {
      // user changed text after selecting a place
      destinationPlaceId = null;
      destinationSelected = false;
    }
  });

  // Add listeners for origin place selection
  originAutocomplete.addListener("place_changed", () => {

    // Clear previous place ID
    const place = originAutocomplete.getPlace();

    // Validate that a place was selected
    if (!place.place_id) {
      alert("Please select a location from the dropdown.");
      return;
    }

    // Store the selected place ID and its formatted address
    originPlaceId = place.place_id;
    originFormattedAddress = place.formatted_address || originInput.value;
    originSelected = true; // mark explicit selection
  });

  // Add listener for destination place selection
  destinationAutocomplete.addListener("place_changed", () => {

    // Clear previous place ID
    const place = destinationAutocomplete.getPlace();
    console.log(place);

    // Validate that a place was selected
    if (!place.place_id || place == null) {
      alert("Please select a location from the dropdown.");
      return;
    }

    // Store the selected place ID and formatted address
    destinationPlaceId = place.place_id;
    destinationFormattedAddress = place.formatted_address || destinationInput.value;
    destinationSelected = true; // mark explicit selection
  });
}

// Function to add a new waypoint input
function addWaypoint() {

  // Check if maximum waypoints reached
  if (waypointInputs.length >= MAX_WAYPOINTS) {
    alert("Maximum of 5 waypoints allowed.");
    return;
  }

  // Create a new input for the waypoint
  const container = document.getElementById("waypoints-container");

  const index = waypointInputs.length;

  // Create a wrapper div for the input and remove button
  const wrapper = document.createElement("div");
  wrapper.className = "waypoint-row";

  // Create the input element
  const input = document.createElement("input");
  input.placeholder = "Enter waypoint";

  // Create the remove button
  const removeBtn = document.createElement("button");
  removeBtn.innerText = "Remove";

  // Add click listener to remove the waypoint
  removeBtn.onclick = function () {
    container.removeChild(wrapper);

    // Remove the corresponding input from the arrays
    waypointInputs = waypointInputs.filter(i => i !== input);
    waypointPlaceIds = waypointPlaceIds.filter(id => id !== input.dataset.placeId);
  };

  // Append the input and remove button to the wrapper, then to the container
  wrapper.appendChild(input);
  wrapper.appendChild(removeBtn);

  container.appendChild(wrapper);

  // Add the new input to the waypointInputs array
  waypointInputs.push(input);

  // Set up autocomplete for the new waypoint input
  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ["place_id", "formatted_address"]
  });

  // Add listener for waypoint place selection
  autocomplete.addListener("place_changed", () => {

    const place = autocomplete.getPlace();

    // Validate that a place was selected
    if (!place.place_id) {
      alert("Please select a valid waypoint from the dropdown.");
      return;
    }

    // Store the selected place ID and formatted address in data attributes
    input.dataset.placeId = place.place_id;
    input.dataset.formattedAddress = place.formatted_address || input.value;
    waypointPlaceIds[index] = place.place_id;
  });

  // Clear waypoint place ID if text no longer matches selected address
  input.addEventListener("input", () => {
    if (input.value === "") {
      input.dataset.placeId = null;
      input.dataset.formattedAddress = null;
    } else if (input.dataset.formattedAddress && input.value !== input.dataset.formattedAddress) {
      waypointPlaceIds.removeChild(index);
      input.dataset.placeId = null;
      input.dataset.formattedAddress = null;
    }
  });
}

// Function to get the user's current location and set it as the origin
function getUserLocation() {

  // Check if geolocation is supported
  if (!navigator.geolocation) return;

  // Get the user's current position
  navigator.geolocation.getCurrentPosition(position => {

    const userLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Center the map on the user's location and add a marker
    map.setCenter(userLocation);
    map.setZoom(12);

    new google.maps.Marker({
      position: userLocation,
      map: map,
      title: "Your Location"
    });

    const geocoder = new google.maps.Geocoder();

    // Reverse geocode the user's location to get the formatted address
    geocoder.geocode({ location: userLocation }, (results, status) => {

      // Validate that a result was returned
      if (status === "OK" && results[0]) {

        // Set the origin input value to the formatted address of the user's location
        document.getElementById("origin-input").value =
          results[0].formatted_address;

        originPlaceId = results[0].place_id;
      }

    });

  });
}

// Function to center the map on the user's current location when "Use My Location" button is clicked
function useMyLocation() {

  navigator.geolocation.getCurrentPosition(
    function (position) {

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      map.setCenter(userLocation);
      map.setZoom(12);

    },
    // User denied geolocation
    function (error) {
      // Handle error
      // console.log("Location not available.");
    }
  );

}

// Function to calculate and display the route when "Start Route" button is clicked
function startRoute() {

  // Validate that origin and destination place IDs are set
  if (!originPlaceId || !destinationPlaceId) {
    alert("Please select an origin and destination from the dropdown.");
    return;
  }

  // Validate that all waypoint inputs have valid place IDs (one per input)
  if (waypointInputs.length > 0 && waypointPlaceIds.length !== waypointInputs.length) {
    console.log(waypointPlaceIds);
    alert("Please select a valid location from the dropdown for every waypoint.");
    return;
  }  

  const savebutton = document.querySelector('.save-route-button');
  if(savebutton) {
      savebutton.style.display = 'block';
  }


  // Build the waypoints array for the DirectionsService request
  let waypoints = waypointInputs.map(input => ({
    location : { placeId: input.dataset.placeId },
    stopover: true
  }));

  // Create the request object for the DirectionsService route method
  const request = {
    origin: { placeId: originPlaceId },
    destination: { placeId: destinationPlaceId },
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.IMPERIAL
  };
  console.log(request);

  // Call the route method of the DirectionsService to calculate the route
  directionsService.route(request, (result, status) => {

    // Validate that the route was successfully calculated
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      showDirections(result);
    } else if (status === "ZERO_RESULTS") {
      alert("No route could be found between the origin and destination.");
    } else if (status === "INVALID_REQUEST") {
      alert("Please check that all waypoints are from the dropdown");
    } else {
      alert("Could not calculate route. Please try again.");
    }

  });
}

// Function to display the total distance and duration of the route in the directions panel
function showDirections(result) {

  // Get the first route from the result
  const route = result.routes[0];
  let totalDistance = 0;
  let totalDuration = 0;

  // Sum up the distance and duration from all legs of the route
  route.legs.forEach(leg => {
    totalDistance += leg.distance.value;
    totalDuration += leg.duration.value;
  });

  // Convert distance from meters to miles and duration from seconds to minutes
  let miles = totalDistance * 0.000621371;
  
  // Round duration to nearest minute
  let minutes = Math.floor(totalDuration / 60);
  let hours;
  
  // Format the duration as hours and minutes
  // If duration is less than 2 hours, display as "X minutes" or "1 hour X minutes"
  if(minutes < 119) {

    // If duration is between 1 and 2 hours, display as "1 hour X minutes"
    if(minutes/60 >= 1) {
      hours = 1 + " hour";
      // If there is 1 minute or less remaining, display as "1 minute"
      if(minutes % 60 <= 1) {
        minutes = 1 + " minute";
        time = hours + " " + minutes;

      // If there is more than 1 minute remaining, display as "X minutes"
      } else {
        minutes = minutes % 60 + " minutes";
        time = hours + " " + minutes;
      }
    
    // If duration is less than 1 hour, display as "X minutes"
    } else {  
      if(minutes % 60 <= 1) {
        minutes = 1 + " minute";
        time = minutes;

      // If there is more than 1 minute remaining, display as "X minutes"
      } else {
        minutes = minutes % 60 + " minutes";
        time = minutes;
      }
    }

  // If duration is 2 hours or more, display as "X hours Y minutes"
  } else {
    // Round hours to nearest whole number and display as "X hours"
    hours = Math.round(minutes/60) + " hours";

    // If there is 1 minute or less remaining, display as "1 minute"
    if(minutes % 60 <= 1) {
      minutes = 1 + " minute";
      time = hours + " " + minutes;

    // If there is more than 1 minute remaining, display as "X minutes"
    } else {
      minutes = minutes % 60 + " minutes";
      time = hours + " " + minutes;
    }
  }

  // Display the distance and duration in the directions panel
  document.getElementById("directions-panel").innerHTML =
    `Distance: ${miles.toFixed(2)} miles<br>` + `Duration: ${time}`;
}

// Make initMap available globally for the Google Maps API callback
window.initMap = initMap;

//THIS IS CURRENTLY EMPTY CODE FOR FRONT END, IT NEEDS TO CONNECT TO THE DATABASE
async function loadFavoriteRoutes() {
    const container = document.getElementById("favorites-panel");

    if (!container) {
        console.error("favorites-panel not found");
        return;
    }

    container.innerHTML = "";

    try {
        const response = await fetch(`/api/routes/favorites?userId=${userId}`);
        const routes = await response.json();

        console.log("Loaded routes:", routes);

        for (let i = 0; i < 5; i++) {
            const row = document.createElement("div");
            row.className = "favorites-row";

            const routeButton = document.createElement("button");

            if (routes[i]) {
                routeButton.innerText = routes[i].routeName;
                routeButton.dataset.routeId = routes[i].routeId;
            } else {
                routeButton.innerText = `Route ${i + 1}`;
                routeButton.disabled = true;
            }

            const removeBtn = document.createElement("img");
            removeBtn.className = "remove-route";
            removeBtn.src = "./images/Trashcan.png";

            if (routes[i]) {
                removeBtn.addEventListener("click", function () {
                    selectedFavoriteRouteId = routes[i].routeId;
                    removeRoute.style.display = "block";
                });
            } else {
                removeBtn.style.opacity = "0.4";
                removeBtn.style.pointerEvents = "none";
            }

            row.appendChild(routeButton);
            row.appendChild(removeBtn);
            container.appendChild(row);
        }

        if (routes[i]) {
    routeButton.innerText = routes[i].routeName;
    routeButton.dataset.routeId = routes[i].routeId;

    routeButton.addEventListener("click", function () {
        loadSavedRoute(routes[i].routeId);
    });
} else {
    routeButton.innerText = `Route ${i + 1}`;
    routeButton.disabled = true;
}

    } catch (error) {
        console.error("Error loading favorite routes:", error);
    }
}

async function loadSavedRoute(routeId) {
    try {
      console.log("Trying to load routeId:", routeId);
        const response = await fetch(`/api/routes/favorites/${routeId}?userId=${userId}`);
        const route = await response.json();

        console.log("Loaded saved route:", route);

        if (!response.ok) {
            alert(route.message || "Could not load saved route.");
            return;
        }

        const waypoints = (route.waypointPlaceIds || []).map(placeId => ({
            location: { placeId: placeId },
            stopover: true
        }));

        directionsService.route(
            {
                origin: { placeId: route.originPlaceId },
                destination: { placeId: route.destinationPlaceId },
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING
            },
            function (result, status) {
                if (status === "OK") {
                    directionsRenderer.setDirections(result);

                    const routeData = result.routes[0];
                    let totalDistance = 0;
                    let totalDuration = 0;

                    routeData.legs.forEach(leg => {
                        totalDistance += leg.distance.value;
                        totalDuration += leg.duration.value;
                    });

                    showDirections(totalDistance, totalDuration);
                    document.getElementById("favorites-panel").style.display = "none";
                } else {
                    console.error("Directions status:", status);
                    alert("Could not display saved route.");
                }
            }
        );
    } catch (error) {
        console.error("Error loading saved route:", error);
        alert("Error loading saved route.");
    }
}

async function confirmDeleteFavoriteRoute() {
    if (!selectedFavoriteRouteId) {
        alert("No route selected.");
        return;
    }

    try {
        const response = await fetch(
            `/api/routes/favorites/${selectedFavoriteRouteId}?userId=${userId}`,
            { method: "DELETE" }
        );

        let result = {};
        const text = await response.text();

        if (text) {
            result = JSON.parse(text);
        }

        if (response.ok) {
            alert(result.message || "Favorite route deleted.");
            selectedFavoriteRouteId = null;
            removeRoute.style.display = "none";
            await loadFavoriteRoutes();
        } else {
            alert(result.message || "Could not delete route.");
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("Error deleting route.");
    }
}

async function toggleFavorites() {
    const container = document.getElementById("favorites-panel");

    if (!container) {
        console.error("favorites-panel not found");
        return;
    }

    if (container.style.display === "block") {
        container.style.display = "none";
        return;
    }

    container.style.display = "block";
    await loadFavoriteRoutes();
}

//logout window/button logic
const logout = document.getElementById("logout_window");
const logoutOpenBtn = document.getElementById("open_logout_window");
const closeLogoutBtn = document.getElementById("close_logout_window_button");

//opens logout window
logoutOpenBtn.onclick = function() {
    logout.style.display = "block";
}

//closes logout window
closeLogoutBtn.onclick = function() {
    logout.style.display = "none";
}

//save route window logic
const saveRoute = document.getElementById("save-route-button");
const saveRouteWindow = document.getElementById("save_route_window");
const confirmSaveRoute = document.getElementById("confirm_save_route");
const cancelSaveRoute = document.getElementById("close_save_route_button");

confirmSaveRoute.onclick = saveFavoriteRoute;

//opens save route window
saveRoute.onclick = function() {
    saveRouteWindow.style.display = "block";
}

cancelSaveRoute.onclick = function() {
    saveRouteWindow.style.display = "none";
}

// remove route window logic
const removeRoute = document.getElementById("remove_route_window");
const removeRouteConfirmBtn = document.getElementById("confirm_remove_route_button");
const removeRouteCloseBtn = document.getElementById("cancel_remove_route_button");

// confirm deletion
removeRouteConfirmBtn.addEventListener("click", confirmDeleteFavoriteRoute);

// cancel deletion
removeRouteCloseBtn.addEventListener("click", function () {
    removeRoute.style.display = "none";
    selectedFavoriteRouteId = null;
});

//closes logout window
removeRouteCloseBtn.onclick = function() {
    removeRoute.style.display = "none";
}

async function saveFavoriteRoute() {
    const routeNameInput = document.getElementById("Route_name");
    const routeName = routeNameInput.value.trim();
if (!routeName) {
    alert("Please enter a route name.");
    return;
}

if (!originPlaceId || !destinationPlaceId) {
    alert("Origin and destination must be selected.");
    return;
}

const data = {
    userId: userId,
    routeName: routeName,
    originPlaceId: originPlaceId,
    destinationPlaceId: destinationPlaceId,
    waypointPlaceIds: waypointPlaceIds
};

    try {
        const response = await fetch("/api/routes/favorites", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

      if (response.ok) {
    alert(result.message);
    document.getElementById("save_route_window").style.display = "none";
    routeNameInput.value = "";

    await loadFavoriteRoutes();
} else {
    alert(result.message || "Could not save route.");
}

    } catch (error) {
        console.error("Error saving favorite route:", error);
        alert("Error connecting to server.");
    }
}