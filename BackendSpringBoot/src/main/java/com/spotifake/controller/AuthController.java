package com.spotifake.controller;

import com.spotifake.config.JwtUtil;
import com.spotifake.dto.AuthDto;
import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Controller
public class AuthController {

    private final SpotifakeRepository repository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(SpotifakeRepository repository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    // ==========================================
    // REST API ENDPOINTS
    // ==========================================
    @PostMapping(value = {"/api/auth/login", "/auth/login"}, consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> apiLogin(@RequestBody AuthDto.LoginRequest req, HttpServletResponse response) {
        User user = repository.getUserByUsername(req.getUsername());
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Invalid username or password");
            return ResponseEntity.status(401).body(err);
        }

        String token = jwtUtil.generateToken(user);
        setCookie(response, token);
        repository.logUserActivity(user.getId(), "LOGIN", "API login successful for user " + user.getUsername(), "127.0.0.1");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Login successful");
        res.put("token", token);
        res.put("access_token", token);
        res.put("role", user.getRole());
        res.put("username", user.getUsername());
        res.put("user", user);
        return ResponseEntity.ok(res);
    }


    @PostMapping(value = {"/api/auth/register", "/auth/register"}, consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<?> apiRegister(@RequestBody AuthDto.RegisterRequest req, HttpServletResponse response) {
        if (req.getUsername() == null || req.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Username is required", "detail", "Username is required"));
        }
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required", "detail", "Email is required"));
        }
        if (req.getPassword() == null || req.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Password is required", "detail", "Password is required"));
        }

        if (repository.getUserByUsername(req.getUsername().trim()) != null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Username already exists. Please choose another username or sign in.");
            err.put("detail", "Username already exists. Please choose another username or sign in.");
            return ResponseEntity.badRequest().body(err);
        }

        if (repository.getUserByEmail(req.getEmail().trim()) != null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Email address is already registered. Please sign in or use another email.");
            err.put("detail", "Email address is already registered. Please sign in or use another email.");
            return ResponseEntity.badRequest().body(err);
        }

        String userId = UUID.randomUUID().toString();
        String hash = passwordEncoder.encode(req.getPassword());
        User user = repository.createUser(userId, req.getUsername().trim(), req.getEmail().trim(), hash, "user", req.getDisplayName());

        if (user == null) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to create user account", "detail", "Database error creating user"));
        }

        String token = jwtUtil.generateToken(user);
        setCookie(response, token);
        repository.logUserActivity(user.getId(), "REGISTER", "New user registered: @" + user.getUsername(), "127.0.0.1");

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Registration successful");
        res.put("token", token);
        res.put("access_token", token);
        res.put("role", user.getRole());
        res.put("username", user.getUsername());
        res.put("user", user);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/api/auth/me")
    @ResponseBody
    public ResponseEntity<?> apiMe(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        User fresh = repository.getUserById(user.getId());
        return ResponseEntity.ok(fresh != null ? fresh : user);
    }

    @PostMapping("/api/auth/logout")
    @ResponseBody
    public ResponseEntity<?> apiLogout(HttpServletResponse response) {
        clearCookie(response);
        return ResponseEntity.ok(Map.of("success", true, "message", "Logged out"));
    }

    // ==========================================
    // MVC VIEW ENDPOINTS
    // ==========================================
    @GetMapping({"/Auth/Login", "/auth/login"})
    public String viewLogin(@RequestParam(required = false) String returnUrl,
                            @RequestParam(required = false) String error,
                            Model model) {
        model.addAttribute("returnUrl", returnUrl != null ? returnUrl : "/");
        if (error != null) {
            model.addAttribute("errorMessage", "Invalid credentials or access denied.");
        }
        return "Auth/Login";
    }

    @PostMapping({"/Auth/Login", "/auth/login"})
    public String handleLogin(@RequestParam String username,
                              @RequestParam String password,
                              @RequestParam(required = false, defaultValue = "/") String returnUrl,
                              HttpServletResponse response,
                              Model model) {
        User user = repository.getUserByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
            model.addAttribute("errorMessage", "Invalid username or password");
            model.addAttribute("returnUrl", returnUrl);
            return "Auth/Login";
        }

        String token = jwtUtil.generateToken(user);
        setCookie(response, token);
        repository.logUserActivity(user.getId(), "LOGIN", "Web browser login as @" + user.getUsername(), "127.0.0.1");

        if (returnUrl != null && !returnUrl.isEmpty() && !"/Auth/Login".equalsIgnoreCase(returnUrl)) {
            return "redirect:" + returnUrl;
        }
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return "redirect:/admin/dashboard";
        } else if ("artist".equalsIgnoreCase(user.getRole())) {
            return "redirect:/artist/manager";
        }
        return "redirect:/";
    }

    @GetMapping({"/Auth/Register", "/auth/register"})
    public String viewRegister(Model model) {
        return "Auth/Register";
    }

    @PostMapping({"/Auth/Register", "/auth/register"})
    public String handleRegister(@RequestParam String username,
                                 @RequestParam String email,
                                 @RequestParam String password,
                                 @RequestParam(required = false) String displayName,
                                 HttpServletResponse response,
                                 Model model) {
        if (repository.getUserByUsername(username) != null) {
            model.addAttribute("errorMessage", "Username already exists");
            return "Auth/Register";
        }
        if (repository.getUserByEmail(email) != null) {
            model.addAttribute("errorMessage", "Email already in use");
            return "Auth/Register";
        }

        String userId = UUID.randomUUID().toString();
        String hash = passwordEncoder.encode(password);
        User user = repository.createUser(userId, username, email, hash, "user", displayName != null ? displayName : username);

        String token = jwtUtil.generateToken(user);
        setCookie(response, token);
        return "redirect:/";
    }

    @GetMapping({"/Auth/Profile", "/auth/profile"})
    public String viewProfile(@AuthenticationPrincipal User user, Model model) {
        if (user == null) {
            return "redirect:/Auth/Login?returnUrl=/Auth/Profile";
        }
        User current = repository.getUserById(user.getId());
        model.addAttribute("user", current != null ? current : user);
        return "Auth/Profile";
    }

    @GetMapping({"/Auth/Logout", "/auth/logout"})
    public String handleLogout(HttpServletResponse response) {
        clearCookie(response);
        return "redirect:/Auth/Login";
    }

    private void setCookie(HttpServletResponse response, String token) {
        Cookie c = new Cookie("jwt_token", token);
        c.setPath("/");
        c.setHttpOnly(false); // Accessible for client-side fetch if needed
        c.setMaxAge(86400 * 7);
        response.addCookie(c);
    }

    private void clearCookie(HttpServletResponse response) {
        Cookie c = new Cookie("jwt_token", "");
        c.setPath("/");
        c.setMaxAge(0);
        response.addCookie(c);
    }
}
