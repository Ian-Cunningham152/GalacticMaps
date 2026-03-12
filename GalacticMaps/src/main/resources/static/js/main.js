// Global variables
let map;
let directionsService;
let directionsRenderer;

let originPlaceId = null;
let destinationPlaceId = null;

let waypointPlaceIds = [];
let waypointInputs = [];

// Maximum number of waypoints allowed 
const MAX_WAYPOINTS = 5;

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

  // Add listeners for origin place selection
  originAutocomplete.addListener("place_changed", () => {

    // Clear previous place ID
    const place = originAutocomplete.getPlace();

    // Validate that a place was selected
    if (!place.place_id) {
      alert("Please select a location from the dropdown.");
      return;
    }

    // Store the selected place ID
    originPlaceId = place.place_id;
  });

  // Add listener for destination place selection
  destinationAutocomplete.addListener("place_changed", () => {

    // Clear previous place ID
    const place = destinationAutocomplete.getPlace();

    // Validate that a place was selected
    if (!place.place_id) {
      alert("Please select a location from the dropdown.");
      return;
    }

    // Store the selected place ID
    destinationPlaceId = place.place_id;
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

  // Create a wrapper div for the input and remove button
  const wrapper = document.createElement("div");
  wrapper.className = "waypoint-row";

  // Create the input element
  const input = document.createElement("input");
  input.placeholder = "Enter waypoint";

  // Create the remove button
  const removeBtn = document.createElement("button");
  removeBtn.className = "removeBtn";
  removeBtn.innerText = "Remove";

  // Add click listener to remove the waypoint
  removeBtn.onclick = function () {
    container.removeChild(wrapper);

    // Remove the corresponding place ID from the waypoints array
    waypointInputs = waypointInputs.filter(i => i !== input);

    // Remove the place ID from the waypointPlaceIds array    
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
    fields: ["place_id"]
  });

  // Add listener for waypoint place selection
  autocomplete.addListener("place_changed", () => {

    const place = autocomplete.getPlace();

    // Validate that a place was selected
    if (!place.place_id) {
      alert("Please select a valid waypoint from the dropdown.");
      return;
    }

    // Store the selected place ID in a data attribute on the input
    input.dataset.placeId = place.place_id;
    waypointPlaceIds.push(place.place_id);


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

  // Validate that all waypoint inputs have valid place IDs
  if (waypointInputs.length > 0 && waypointPlaceIds.length === 0) {
    alert("Please select a valid location from the dropdown for all waypoints.");
    return;
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

  // Call the route method of the DirectionsService to calculate the route
  directionsService.route(request, (result, status) => {

    // Validate that the route was successfully calculated
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      showDirections(result);
    } else {
      alert("Route failed: " + status);
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
  let minutes = Math.round(totalDuration / 60);
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