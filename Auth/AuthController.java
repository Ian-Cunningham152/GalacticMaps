package com.galicticmaps.maps.controller;

import com.galicticmaps.maps.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {

    @Autowired
    AuthService auth;

    @PostMapping("/login")
    public String login(@RequestBody Request r){

        return auth.login(r.username,r.password);
    }

    @PostMapping("/create-account")
    public String create(@RequestBody Request r){

        return auth.createAccount(r.username,r.password,r.repeatPassword);
    }

    @PostMapping("/reset-password")
    public String reset(@RequestBody Request r){

        return auth.resetPassword(r.username,r.password,r.repeatPassword);
    }

}

class Request{

    public String username;
    public String password;
    public String repeatPassword;

}