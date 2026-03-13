package com.galicticmaps.maps.routing;

import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class RouteService {

    private final JdbcTemplate jdbcTemplate;

    public RouteService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean saveFavoriteRoute(int userId, String routeName, List<String> waypointPlaceIds) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM Route WHERE UserID = ?",
                Integer.class,
                userId
        );

        if (count != null && count >= 5) {
            return false;
        }

        jdbcTemplate.update(
                "INSERT INTO Route (UserID, RouteName) VALUES (?, ?)",
                userId,
                routeName
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

    public List<String> getFavoriteRoutes(int userId) {
        return jdbcTemplate.query(
                "SELECT RouteID, RouteName FROM Route WHERE UserID = ?",
                (rs, rowNum) -> rs.getInt("RouteID") + " - " + rs.getString("RouteName"),
                userId
        );
    }
}