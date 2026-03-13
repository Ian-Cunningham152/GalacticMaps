package com.galicticmaps.maps.routing;

import java.util.List;

public record FavoriteRouteRequest(Integer userId, String routeName, List<String> waypointPlaceIds) {}
