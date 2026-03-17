//loads the favorite routes
async function loadFavoriteRoutes() {

    const container = document.getElementById("favorites-panel");

    if (!container) {
        console.error("favorites-panel not found");
        return;
    }

    container.innerHTML = "";

    //tries to fetch favorite routes from database
    try {
        console.log("Current userId:", userId);

        const response = await fetch(`/api/routes/favorites?userId=${userId}`);
        const routes = await response.json();

        console.log("Loaded routes:", routes);

        //creates a div for each favorite route for user
        for (let i = 0; i < routes.length; i++) {
            const row = document.createElement("div");
            row.className = "favorites-row";

            //adds button and image to div
            const routeButton = document.createElement("button");
            routeButton.type = "button";
            const removeBtn = document.createElement("img");
            removeBtn.className = "remove-route";
            removeBtn.src = "./images/Trashcan.png";

            //sets route name and id
            if (routes[i]) {
                routeButton.innerText = routes[i].routeName;
                routeButton.dataset.routeId = routes[i].routeId;

            //functionality for the loadSavedRoute
            routeButton.addEventListener("click", function () {
              loadSavedRoute(routes[i].routeId);
            });

            //functinality for trash can, opens up removeRoute window
            removeBtn.addEventListener("click", function () {
                selectedFavoriteRouteId = routes[i].routeId;
                removeRoute.style.display = "block";
            });
            } 

            //appends div to container
            row.appendChild(routeButton);
            row.appendChild(removeBtn);
            container.appendChild(row);
        }

    //catches database error
    } catch (error) {
        console.error("Error loading favorite routes:", error);
    }
}

//loads the route from database to the map api
async function loadSavedRoute(routeId) {
    try {
        console.log("Trying to load routeId:", routeId);

        const response = await fetch(`/api/routes/favorites/${routeId}?userId=${userId}`);
        const route = await response.json();

        console.log("Loaded saved route:", route);

        //if route failed to be grabbed from database
        if (!response.ok) {
            alert(route.message || "Could not load saved route.");
            return;
        }

        //sets waypoints
        const waypoints = (route.waypointPlaceIds || []).map(placeId => ({
            location: { placeId: placeId },
            stopover: true
        }));

        console.log("Origin:", route.originPlaceId);
        console.log("Destination:", route.destinationPlaceId);

        //puts route in the map api
        directionsService.route(
            {
                origin: { placeId: route.originPlaceId },
                destination: { placeId: route.destinationPlaceId },
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING
            },
            function (result, status) {

                console.log("Directions status:", status);

                if (status === "OK") {
                    directionsRenderer.setDirections(result);
                    showDirections(result);
                    document.getElementById("favorites-panel").style.display = "none";
                } else {
                    alert("Could not display saved route. Status: " + status);
                }
            }
        );

    //if database couldn't get routeId
    } catch (error) {
        console.error("Error loading saved route:", error);
        alert("Error loading saved route.");
    }
}

//pops up a window to confirm the deletion of a saved route
//must hit the trash can next to a route to delete
async function confirmDeleteFavoriteRoute() {
    if (!selectedFavoriteRouteId) {
        alert("No route selected.");
        return;
    }

    //try to delete route from database
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

        //if successful
        if (response.ok) {
            alert(result.message || "Favorite route deleted.");
            selectedFavoriteRouteId = null;
            removeRoute.style.display = "none";
            await loadFavoriteRoutes();
        }
        //if failed
        else {
            alert(result.message || "Could not delete route.");
        }
    }
    //if could not connect to database
    catch (error) {
        console.error("Delete error:", error);
        alert("Error deleting route.");
    }
}

//this toggles the favorites panel. If there are no favorites, nothing shows up
function toggleFavorites() {

    const panel = document.getElementById("favorites-panel");

    //display the panel
    if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
        loadFavoriteRoutes();
    } 
    
    //hides the panel
    else {
        panel.style.display = "none";
    }
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

//function to save a favorite route
async function saveFavoriteRoute() {
    const routeNameInput = document.getElementById("Route_name");
    const routeName = routeNameInput.value.trim();

    //Check if there is aroute name
    if (!routeName) {
        alert("Please enter a route name.");
        return;
    }

    //Makes sure there is a valid route
    if (!originPlaceId || !destinationPlaceId) {
        alert("Origin and destination must be selected.");
        return;
    }

    //structure data
    const data = {
        userId: userId,
        routeName: routeName,
        originPlaceId: originPlaceId,
        destinationPlaceId: destinationPlaceId,
        waypointPlaceIds: waypointPlaceIds
    };

        //try to send it to database
        try {
            const response = await fetch("/api/routes/favorites", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

        //if successful
        if (response.ok) {
        alert(result.message);
        document.getElementById("save_route_window").style.display = "none";
        routeNameInput.value = "";

        await loadFavoriteRoutes();
    } 
    
    //if failed to save
    else {
        alert(result.message || "Could not save route.");
    }

    //catch bad connection to database
    } catch (error) {
        console.error("Error saving favorite route:", error);
        alert("Error connecting to server.");
    }
}