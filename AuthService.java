package com.galicticmaps.maps.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class AuthService {

    private static final int MIN_USERNAME_LENGTH = 4;
    private static final int MAX_USERNAME_LENGTH = 20;
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 30;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*[a-z].*");
    private static final Pattern NUMBER_PATTERN = Pattern.compile(".*\\d.*");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile(".*[^A-Za-z0-9].*");

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthResponse register(String username, String password, String confirmPassword) {
        String cleanedUsername = validateUsername(username);
        validatePassword(password);
        validatePasswordsMatch(password, confirmPassword);

        if (userRepository.existsByUsername(cleanedUsername)) {
            throw new IllegalArgumentException("Username already exists.");
        }

        Integer userId = userRepository.createUser(cleanedUsername, hashPassword(password));
        return new AuthResponse(userId, cleanedUsername, "Account created successfully.");
    }

    public AuthResponse login(String username, String password) {
        String cleanedUsername = requireUsername(username);
        requirePassword(password);

        UserAccount user = userRepository.findByUsername(cleanedUsername)
                .orElseThrow(() -> new IllegalArgumentException("Username does not exist."));

        String hashedInput = hashPassword(password);
        if (!user.passwordHash().equals(hashedInput)) {
            throw new IllegalArgumentException("Password does not match existing username.");
        }

        return new AuthResponse(user.userId(), user.username(), "Login successful.");
    }

    public AuthResponse resetPassword(String username, String password, String confirmPassword) {
        String cleanedUsername = requireUsername(username);

        if (!userRepository.existsByUsername(cleanedUsername)) {
            throw new IllegalArgumentException("The input username is not tied to a GalacticMaps account.");
        }

        validatePassword(password);
        validatePasswordsMatch(password, confirmPassword);
        userRepository.updatePassword(cleanedUsername, hashPassword(password));

        UserAccount user = userRepository.findByUsername(cleanedUsername)
                .orElseThrow(() -> new IllegalArgumentException("The input username is not tied to a GalacticMaps account."));

        return new AuthResponse(user.userId(), user.username(), "Password reset successful.");
    }

    private String validateUsername(String username) {
        String cleanedUsername = requireUsername(username);

        if (cleanedUsername.length() < MIN_USERNAME_LENGTH) {
            throw new IllegalArgumentException("Username is too short.");
        }

        if (cleanedUsername.length() > MAX_USERNAME_LENGTH) {
            throw new IllegalArgumentException("Username is too long.");
        }

        return cleanedUsername;
    }

    private String requireUsername(String username) {
        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("Username is required.");
        }

        return username.trim();
    }

    private void requirePassword(String password) {
        if (!StringUtils.hasText(password)) {
            throw new IllegalArgumentException("Password is required.");
        }
    }

    private void validatePasswordsMatch(String password, String confirmPassword) {
        requirePassword(confirmPassword);

        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match.");
        }
    }

    private void validatePassword(String password) {
        requirePassword(password);

        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password is too short.");
        }

        if (password.length() > MAX_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password is too long.");
        }

        int requirementCount = 0;

        if (UPPERCASE_PATTERN.matcher(password).matches()) {
            requirementCount++;
        }
        if (LOWERCASE_PATTERN.matcher(password).matches()) {
            requirementCount++;
        }
        if (NUMBER_PATTERN.matcher(password).matches()) {
            requirementCount++;
        }
        if (SPECIAL_PATTERN.matcher(password).matches()) {
            requirementCount++;
        }

        if (requirementCount < 3) {
            throw new IllegalArgumentException("Password does not meet 3 of the 4 password requirements.");
        }
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available.", ex);
        }
    }
}