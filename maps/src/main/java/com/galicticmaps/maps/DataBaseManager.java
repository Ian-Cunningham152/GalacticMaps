/**
 * Ian Cunningham 3/11/2026
 * This is the java file that connects to the database.
 * It doesn't need to be run that often, only if the connection to the database
 * is severed.
 */
package com.galicticmaps.maps;
import java.sql.*;
import java.util.*;

public class DataBaseManager {
    public static String dburl = "jdbc:mysql://127.0.0.1:3306/galacticMaps";

    public static String dbUsername = "root";

    public static String dbPassword = "password";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(dburl, dbUsername, dbPassword);
    }

    public static void connect() {
        try (Connection conn = getConnection()) {
            System.out.println("Connection successful");
        } catch (Exception exception) {
            System.out.println("Exception");
        }
    }

    public static void main(String[] args) {
        connect();
    }
}
