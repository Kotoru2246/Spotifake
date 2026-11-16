package com.spotifake.controller;

import com.spotifake.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping({"/", "/Home", "/home", "/Home/Index", "/home/index"})
    public String index(@AuthenticationPrincipal User user, Model model) {
        if (user != null) {
            model.addAttribute("currentUser", user);
            model.addAttribute("isAuthenticated", true);
            model.addAttribute("username", user.getUsername());
            model.addAttribute("role", user.getRole());
        } else {
            model.addAttribute("isAuthenticated", false);
        }
        return "Home/Index";
    }
}
