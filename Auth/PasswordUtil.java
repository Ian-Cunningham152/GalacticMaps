package com.galicticmaps.maps.service;

import java.security.MessageDigest;

public class PasswordUtil {

    public static String hash(String password){

        try{

            MessageDigest md = MessageDigest.getInstance("SHA-256");

            byte[] bytes = md.digest(password.getBytes());

            StringBuilder sb = new StringBuilder();

            for(byte b : bytes){
                sb.append(String.format("%02x", b));
            }

            return sb.toString().substring(0,45);

        }
        catch(Exception e){
            throw new RuntimeException(e);
        }

    }

}