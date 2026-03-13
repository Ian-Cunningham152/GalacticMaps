package com.galicticmaps.maps.routing;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Service;

@Service
public class RouteService {

    private final DataSource dataSource;

    public RouteService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public FavoriteRoute saveFavoriteRoute(Integer userId, String routeName, List<String> waypointPlaceIds) throws SQLException {
        if (userId == null) {
            throw new IllegalArgumentException("You must be logged in to save favorites.");
        }

        String cleanedRouteName = (routeName == null || routeName.isBlank())
                ? "Saved Route"
                : routeName.trim();

        List<String> cleanedWaypoints = waypointPlaceIds == null ? List.of() : waypointPlaceIds.stream()
                .filter(placeId -> placeId != null && !placeId.isBlank())
                .toList();

        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);

            try {
                String countSql = "SELECT COUNT(*) FROM Route WHERE UserID = ?";
                try (PreparedStatement countStmt = connection.prepareStatement(countSql)) {
                    countStmt.setInt(1, userId);

                    try (ResultSet rs = countStmt.executeQuery()) {
                        if (rs.next() && rs.getInt(1) >= 5) {
                            throw new IllegalArgumentException("You already have 5 favorite routes. Delete one before saving another.");
                        }
                    }
                }

                int routeId;
                String insertRouteSql = "INSERT INTO Route (UserID, RouteName) VALUES (?, ?)";
                try (PreparedStatement routeStmt = connection.prepareStatement(insertRouteSql, Statement.RETURN_GENERATED_KEYS)) {
                    routeStmt.setInt(1, userId);
                    routeStmt.setString(2, cleanedRouteName);

                    int rows = routeStmt.executeUpdate();
                    if (rows == 0) {
                        throw new SQLException("Failed to insert route.");
                    }

                    try (ResultSet generatedKeys = routeStmt.getGeneratedKeys()) {
                        if (!generatedKeys.next()) {
                            throw new SQLException("Failed to get RouteID.");
                        }
                        routeId = generatedKeys.getInt(1);
                    }
                }

                if (!cleanedWaypoints.isEmpty()) {
                    String insertWaypointSql = "INSERT INTO Route_Waypoints (RouteID, Seq, PlaceID) VALUES (?, ?, ?)";
                    try (PreparedStatement waypointStmt = connection.prepareStatement(insertWaypointSql)) {
                        for (int i = 0; i < cleanedWaypoints.size(); i++) {
                            waypointStmt.setInt(1, routeId);
                            waypointStmt.setInt(2, i + 1);
                            waypointStmt.setString(3, cleanedWaypoints.get(i));
                            waypointStmt.addBatch();
                        }
                        waypointStmt.executeBatch();
                    }
                }

                connection.commit();
                return new FavoriteRoute(routeId, cleanedRouteName, cleanedWaypoints);
            } catch (Exception ex) {
                connection.rollback();
                if (ex instanceof IllegalArgumentException illegalArgumentException) {
                    throw illegalArgumentException;
                }
                if (ex instanceof SQLException sqlException) {
                    throw sqlException;
                }
                throw new SQLException("Failed to save favorite route.", ex);
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    public boolean deleteFavoriteRoute(Integer userId, Integer routeId) throws SQLException {
        if (userId == null) {
            throw new IllegalArgumentException("You must be logged in to delete favorites.");
        }
        if (routeId == null) {
            throw new IllegalArgumentException("A route id is required.");
        }

        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);

            try {
                String deleteWaypointsSql = "DELETE FROM Route_Waypoints WHERE RouteID = ?";
                try (PreparedStatement waypointStmt = connection.prepareStatement(deleteWaypointsSql)) {
                    waypointStmt.setInt(1, routeId);
                    waypointStmt.executeUpdate();
                }

                String deleteRouteSql = "DELETE FROM Route WHERE RouteID = ? AND UserID = ?";
                int rowsAffected;
                try (PreparedStatement routeStmt = connection.prepareStatement(deleteRouteSql)) {
                    routeStmt.setInt(1, routeId);
                    routeStmt.setInt(2, userId);
                    rowsAffected = routeStmt.executeUpdate();
                }

                connection.commit();
                return rowsAffected > 0;
            } catch (Exception ex) {
                connection.rollback();
                if (ex instanceof IllegalArgumentException illegalArgumentException) {
                    throw illegalArgumentException;
                }
                if (ex instanceof SQLException sqlException) {
                    throw sqlException;
                }
                throw new SQLException("Failed to delete favorite route.", ex);
            } finally {
                connection.setAutoCommit(true);
            }
        }
    }

    public List<FavoriteRoute> getFavoriteRoutes(Integer userId) throws SQLException {
        if (userId == null) {
            throw new IllegalArgumentException("You must be logged in to view favorites.");
        }

        List<FavoriteRoute> favorites = new ArrayList<>();
        String sql = "SELECT RouteID, RouteName FROM Route WHERE UserID = ? ORDER BY RouteID ASC";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int routeId = rs.getInt("RouteID");
                    String routeName = rs.getString("RouteName");
                    List<String> waypointPlaceIds = getWaypointPlaceIds(connection, routeId);
                    favorites.add(new FavoriteRoute(routeId, routeName, waypointPlaceIds));
                }
            }
        }

        return favorites;
    }

    private List<String> getWaypointPlaceIds(Connection connection, int routeId) throws SQLException {
        List<String> waypointPlaceIds = new ArrayList<>();
        String sql = "SELECT PlaceID FROM Route_Waypoints WHERE RouteID = ? ORDER BY Seq ASC";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, routeId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    waypointPlaceIds.add(rs.getString("PlaceID"));
                }
            }
        }

        return waypointPlaceIds;
    }
}
