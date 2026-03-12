package com.galicticmaps.maps.auth;

public record UserAccount(Integer userId, String username, String passwordHash) {
}