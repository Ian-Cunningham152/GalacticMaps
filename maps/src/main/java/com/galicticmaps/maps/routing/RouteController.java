
package com.galicticmaps.maps.routing;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    private final RouteService routeService;

    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites(@RequestParam Integer userId) {
        try {
            List<String> favorites = routeService.getFavoriteRoutes(userId);
            return ResponseEntity.ok(favorites);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (SQLException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Could not load favorites."));
        }
    }

    @PostMapping("/favorites")
    public ResponseEntity<?> saveFavorite(@RequestBody FavoriteRouteRequest request) {
        try {
            boolean saved = routeService.saveFavoriteRoute(
                    request.userId(),
                    request.routeName(),
                    request.waypointPlaceIds());
            if(!saved) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "User already has 5 routes."));
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Route saved successfully"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (SQLException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Could not save favorite route."));
        }
    }

    @DeleteMapping("/favorites/{routeId}")
    public ResponseEntity<?> deleteFavorite(@PathVariable Integer routeId, @RequestParam Integer userId) {
        try {
            boolean deleted = routeService.deleteFavoriteRoute(userId, routeId);
            if (!deleted) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Route not found."));
            }
            return ResponseEntity.ok(Map.of("message", "Favorite route deleted."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (SQLException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Could not delete favorite route."));
        }
    }
}