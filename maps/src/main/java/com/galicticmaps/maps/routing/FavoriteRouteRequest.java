package com.galicticmaps.maps.routing;

import java.util.List;

public record FavoriteRouteRequest(
        Integer userId,
        String routeName,
        String originPlaceId,
        String destinationPlaceId,
        List<String> waypointPlaceIds
){}