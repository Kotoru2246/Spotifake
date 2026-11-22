package com.spotifake.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Static resources
                .requestMatchers("/css/**", "/js/**", "/lib/**", "/favicon.ico", "/WebClientMVC.styles.css", "/uploads/**").permitAll()
                // Public MVC and API
                .requestMatchers("/", "/Home/**", "/home/**", "/Auth/**", "/auth/**", "/api/auth/**").permitAll()
                .requestMatchers("/api/music/**", "/api/albums/**", "/api/search/**", "/api/playlists/**", "/api/recommendations/**", "/api/subscription/**", "/api/artists/**").permitAll()
                // "/artist/details" is a legacy alias for spotifake_mobile (canonical: /api/artists)
                .requestMatchers("/artist/details/**").permitAll()
                .requestMatchers("/artist/register", "/artist/pending").permitAll()
                // Public settings, announcements, and ads for the web player
                .requestMatchers("/api/public/**").permitAll()
                // Admin dashboard (chart-data and management are strictly ADMIN only)
                .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                // spotdl downloader runs processes on the host
                .requestMatchers("/api/downloader/**").hasRole("ADMIN")
                // Artist dashboard
                .requestMatchers("/artist/**").hasAnyRole("ARTIST", "ADMIN")
                .anyRequest().permitAll()

            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    String uri = request.getRequestURI();
                    if (uri.startsWith("/api/")) {
                        response.setStatus(401);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + authException.getMessage() + "\"}");
                    } else {
                        response.sendRedirect("/Auth/Login?returnUrl=" + uri);
                    }
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    String uri = request.getRequestURI();
                    if (uri.startsWith("/api/")) {
                        response.setStatus(403);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"" + accessDeniedException.getMessage() + "\"}");
                    } else {
                        response.sendRedirect("/Auth/Login?error=access_denied");
                    }
                })
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
