package com.spotifake.config;

import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final SpotifakeRepository repository;

    private static final long USER_CACHE_TTL_MS = 60_000L;
    private static final java.util.concurrent.ConcurrentHashMap<String, CachedUser> userCache = new java.util.concurrent.ConcurrentHashMap<>();

    private record CachedUser(User user, long timestamp) {}

    public static void evictUser(String username) {
        if (username != null) userCache.remove(username);
    }

    public JwtAuthenticationFilter(JwtUtil jwtUtil, SpotifakeRepository repository) {
        this.jwtUtil = jwtUtil;
        this.repository = repository;
    }

    private User getCachedUser(String username) {
        long now = System.currentTimeMillis();
        CachedUser cached = userCache.get(username);
        if (cached != null && (now - cached.timestamp()) < USER_CACHE_TTL_MS) {
            return cached.user();
        }
        User fresh = repository.getUserByUsername(username);
        if (fresh != null) {
            userCache.put(username, new CachedUser(fresh, now));
        }
        return fresh;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token != null && jwtUtil.validateToken(token)) {
            String username = jwtUtil.getUsernameFromToken(token);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                User user = getCachedUser(username);
                if (user != null) {
                    String role = user.getRole() != null ? user.getRole().toUpperCase() : "USER";
                    SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(authority));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("jwt_token".equals(c.getName())) {
                    return c.getValue();
                }
            }
        }
        return null;
    }
}
