package com.galicticmaps.maps.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean existsByUsername(String username) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM `User` WHERE Username = ?",
                Integer.class,
                username
        );
        return count != null && count > 0;
    }

    public Integer createUser(String username, String passwordHash) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO `User` (Username, PasswordHash) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, username);
            statement.setString(2, passwordHash);
            return statement;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    public Optional<UserAccount> findByUsername(String username) {
        List<UserAccount> users = jdbcTemplate.query(
                "SELECT UserID, Username, PasswordHash FROM `User` WHERE Username = ?",
                (rs, rowNum) -> new UserAccount(
                        rs.getInt("UserID"),
                        rs.getString("Username"),
                        rs.getString("PasswordHash")
                ),
                username
        );

        return users.stream().findFirst();
    }

    public boolean updatePassword(String username, String passwordHash) {
        return jdbcTemplate.update(
                "UPDATE `User` SET PasswordHash = ? WHERE Username = ?",
                passwordHash,
                username
        ) > 0;
    }
}