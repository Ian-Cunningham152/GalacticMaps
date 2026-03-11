package com.galicticmaps.maps.service;

import com.galicticmaps.maps.model.User;
import com.galicticmaps.maps.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    UserRepository repo;


    public String createAccount(String username,String password,String repeat){

        if(username.length() < 4)
            return "Username is too short";

        if(username.length() > 20)
            return "Username is too long";

        if(password.length() < 8)
            return "Password is too short";

        if(password.length() > 30)
            return "Password is too long";

        if(!password.equals(repeat))
            return "Passwords do not match";

        if(!validPassword(password))
            return "Password must meet 3 of 4 requirements";

        if(repo.findByUsername(username)!=null)
            return "Username already exists";


        User user = new User();

        user.setUsername(username);
        user.setPasswordHash(PasswordUtil.hash(password));

        repo.save(user);

        return "SUCCESS";
    }



    public String login(String username,String password){

        User user = repo.findByUsername(username);

        if(user == null)
            return "Username does not exist";

        if(!user.getPasswordHash().equals(PasswordUtil.hash(password)))
            return "Password does not match";

        return "SUCCESS";
    }



    public String resetPassword(String username,String password,String repeat){

        User user = repo.findByUsername(username);

        if(user == null)
            return "Username not tied to an account";

        if(password.length() < 8)
            return "Password too short";

        if(password.length() > 30)
            return "Password too long";

        if(!password.equals(repeat))
            return "Passwords do not match";

        if(!validPassword(password))
            return "Password must meet 3 of 4 requirements";

        user.setPasswordHash(PasswordUtil.hash(password));

        repo.save(user);

        return "SUCCESS";
    }



    private boolean validPassword(String password){

        int rules = 0;

        if(password.matches(".*[A-Z].*")) rules++;
        if(password.matches(".*[a-z].*")) rules++;
        if(password.matches(".*[0-9].*")) rules++;
        if(password.matches(".*[^A-Za-z0-9].*")) rules++;

        return rules >= 3;
    }

}