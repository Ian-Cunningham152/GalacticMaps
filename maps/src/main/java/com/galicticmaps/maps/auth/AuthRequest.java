package com.galicticmaps.maps.auth;

public record AuthRequest(String username, String password, String confirmPassword) {
}