package com.galicticmaps.maps.routing;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RouteService {

    private final JdbcTemplate jdbcTemplate;

    public RouteService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

   @Transactional
public boolean saveFavoriteRoute(int userId, String routeName, String originPlaceId, String destinationPlaceId, List<String> waypointPlaceIds){
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM Route WHERE UserID = ?",
                Integer.class,
                userId
        );

        if (count != null && count >= 5) {
            return false;
        }

        jdbcTemplate.update(
                "INSERT INTO Route (UserID, RouteName, OriginPlaceID, DestinationPlaceID) VALUES (?, ?, ?, ?)",
                userId,
                routeName,
                originPlaceId,
                destinationPlaceId
        );

        Integer routeId = jdbcTemplate.queryForObject(
                "SELECT MAX(RouteID) FROM Route WHERE UserID = ?",
                Integer.class,
                userId
        );

        if (routeId != null && waypointPlaceIds != null) {
            for (int i = 0; i < waypointPlaceIds.size(); i++) {
                jdbcTemplate.update(
                        "INSERT INTO Route_Waypoints (RouteID, Seq, PlaceID) VALUES (?, ?, ?)",
                        routeId,
                        i + 1,
                        waypointPlaceIds.get(i)
                );
            }
        }

        return true;
    }

    public boolean deleteFavoriteRoute(int userId, int routeId) {
        jdbcTemplate.update("DELETE FROM Route_Waypoints WHERE RouteID = ?", routeId);

        int rows = jdbcTemplate.update(
                "DELETE FROM Route WHERE RouteID = ? AND UserID = ?",
                routeId,
                userId
        );

        return rows > 0;
    }

public List<Map<String, Object>> getFavoriteRoutes(int userId) {
    return jdbcTemplate.query(
            "SELECT RouteID, RouteName FROM Route WHERE UserID = ? ORDER BY RouteID",
            (rs, rowNum) -> Map.of(
                    "routeId", rs.getInt("RouteID"),
                    "routeName", rs.getString("RouteName")
            ),
            userId
    );
}

 public Map<String, Object> getFavoriteRouteById(int userId, int routeId) {
    Map<String, Object> route = jdbcTemplate.queryForObject(
            "SELECT RouteID, RouteName, OriginPlaceID, DestinationPlaceID FROM Route WHERE RouteID = ? AND UserID = ?",
            (rs, rowNum) -> Map.of(
                    "routeId", rs.getInt("RouteID"),
                    "routeName", rs.getString("RouteName"),
                    "originPlaceId", rs.getString("OriginPlaceID"),
                    "destinationPlaceId", rs.getString("DestinationPlaceID")
            ),
            routeId, userId
    );

    List<String> waypointPlaceIds = jdbcTemplate.query(
            "SELECT PlaceID FROM Route_Waypoints WHERE RouteID = ? ORDER BY Seq",
            (rs, rowNum) -> rs.getString("PlaceID"),
            routeId
    );

    return Map.of(
            "routeId", route.get("routeId"),
            "routeName", route.get("routeName"),
            "originPlaceId", route.get("originPlaceId"),
            "destinationPlaceId", route.get("destinationPlaceId"),
            "waypointPlaceIds", waypointPlaceIds
    );
}
}