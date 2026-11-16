package com.spotifake.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AdminPortFilter extends OncePerRequestFilter {

    @Value("${server.admin.port:9000}")
    private int adminPort;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        int port = request.getLocalPort() > 0 ? request.getLocalPort() : request.getServerPort();
        boolean isAdminPort = (port == adminPort || request.getServerPort() == adminPort);

        String uri = request.getRequestURI();

        // If accessed on non-admin port and hitting /admin, redirect to dedicated admin port
        if (!isAdminPort && uri != null && uri.startsWith("/admin")) {
            String host = request.getServerName();
            response.sendRedirect("http://" + host + ":" + adminPort + "/admin/dashboard");
            return;
        }

        // If accessed on dedicated admin port
        if (isAdminPort) {
            if (uri == null || "/".equals(uri) || "/admin".equals(uri) || "/admin/".equals(uri)) {
                response.sendRedirect("/admin/dashboard");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
