import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class RouteService {

    private final Connection connection;

    public RouteService(Connection connection) {
        this.connection = connection;
    }

    // Save a favorite route for a user
    public boolean saveFavoriteRoute(int userId, String routeName, List<String> waypointPlaceIds) throws SQLException {
        // Step 1: Check how many favorites this user already has
        String countSql = "SELECT COUNT(*) FROM Route WHERE UserID = ?";
        try (PreparedStatement countStmt = connection.prepareStatement(countSql)) {
            countStmt.setInt(1, userId);

            try (ResultSet rs = countStmt.executeQuery()) {
                if (rs.next()) {
                    int count = rs.getInt(1);
                    if (count >= 5) {
                        System.out.println("You already have 5 routes.");
                        return false;
                    }
                }
            }
        }

        // Step 2: Insert the route
        String insertRouteSql = "INSERT INTO Route (UserID, RouteName) VALUES (?, ?)";
        int routeId = -1;

        try (PreparedStatement routeStmt = connection.prepareStatement(insertRouteSql, Statement.RETURN_GENERATED_KEYS)) {
            routeStmt.setInt(1, userId);
            routeStmt.setString(2, routeName);

            int rows = routeStmt.executeUpdate();
            if (rows == 0) {
                throw new SQLException("Failed to insert route.");
            }

            try (ResultSet generatedKeys = routeStmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    routeId = generatedKeys.getInt(1);
                } else {
                    throw new SQLException("Failed to get RouteID.");
                }
            }
        }

        // Step 3: Insert waypoints if provided
        if (waypointPlaceIds != null && !waypointPlaceIds.isEmpty()) {
            String insertWaypointSql = "INSERT INTO Route_Waypoints (RouteID, Seq, PlaceID) VALUES (?, ?, ?)";

            try (PreparedStatement waypointStmt = connection.prepareStatement(insertWaypointSql)) {
                for (int i = 0; i < waypointPlaceIds.size(); i++) {
                    waypointStmt.setInt(1, routeId);
                    waypointStmt.setInt(2, i + 1); // sequence starts at 1
                    waypointStmt.setString(3, waypointPlaceIds.get(i));
                    waypointStmt.addBatch();
                }
                waypointStmt.executeBatch();
            }
        }

        System.out.println("SUCCESS! ROUTE SAVED!");
        return true;
    }

    // Delete a favorite route for a user
    public boolean deleteFavoriteRoute(int userId, int routeId) throws SQLException {
        // Delete waypoints first because Route_Waypoints references Route
        String deleteWaypointsSql = "DELETE FROM Route_Waypoints WHERE RouteID = ?";
        try (PreparedStatement waypointStmt = connection.prepareStatement(deleteWaypointsSql)) {
            waypointStmt.setInt(1, routeId);
            waypointStmt.executeUpdate();
        }

        // Delete the route only if it belongs to the user
        String deleteRouteSql = "DELETE FROM Route WHERE RouteID = ? AND UserID = ?";
        try (PreparedStatement routeStmt = connection.prepareStatement(deleteRouteSql)) {
            routeStmt.setInt(1, routeId);
            routeStmt.setInt(2, userId);

            int rowsAffected = routeStmt.executeUpdate();
            if (rowsAffected > 0) {
                System.out.println("SUCCESS! ROUTE DELETED!");
                return true;
            } else {
                System.out.println("THERE IS NO ROUTE SILLY!");
                return false;
            }
        }
    }

    // Get all favorite routes for a user
    public List<String> getFavoriteRoutes(int userId) throws SQLException {
        List<String> favorites = new ArrayList<>();

        String sql = "SELECT RouteID, RouteName FROM Route WHERE UserID = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, userId);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int routeId = rs.getInt("RouteID");
                    String routeName = rs.getString("RouteName");
                    favorites.add(routeId + " - " + routeName);
                }
            }
        }

        return favorites;
    }
}