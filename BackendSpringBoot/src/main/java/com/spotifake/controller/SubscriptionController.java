package com.spotifake.controller;

import com.spotifake.config.JwtUtil;
import com.spotifake.model.Transaction;
import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Collections;
import java.util.List;

@Controller
public class SubscriptionController {

    private final SpotifakeRepository repository;
    private final JwtUtil jwtUtil;

    public SubscriptionController(SpotifakeRepository repository, JwtUtil jwtUtil) {
        this.repository = repository;
        this.jwtUtil = jwtUtil;
    }

    private User resolveUser(User principal, HttpServletRequest request) {
        if (principal != null) {
            User fresh = repository.getUserById(principal.getId());
            return fresh != null ? fresh : principal;
        }
        if (request == null) return null;

        String authHeader = request.getHeader("Authorization");
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("jwt_token".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }

        if (token != null && jwtUtil.validateToken(token)) {
            String username = jwtUtil.getUsernameFromToken(token);
            if (username != null) {
                return repository.getUserByUsername(username);
            }
        }
        return null;
    }

    @GetMapping({"/subscription", "/Subscription", "/Subscription/Index", "/subscription/index", "/premium", "/Premium"})
    public String index(@AuthenticationPrincipal User principal, HttpServletRequest request, Model model) {
        User user = resolveUser(principal, request);
        boolean isAuth = user != null;
        boolean isPremium = isAuth && user.isPremium();
        String tier = isAuth && user.getSubscriptionTier() != null ? user.getSubscriptionTier() : "Free";

        List<Transaction> transactions = isAuth ? repository.getUserTransactions(user.getId()) : Collections.emptyList();

        model.addAttribute("currentUser", user);
        model.addAttribute("isAuthenticated", isAuth);
        model.addAttribute("isPremium", isPremium);
        model.addAttribute("subscriptionTier", tier);
        model.addAttribute("transactions", transactions);

        return "Subscription/Index";
    }
}
