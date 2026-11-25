package com.spotifake.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Serves saved cover images at /uploads/covers/**, the path stored on songs and albums.
 * The folder is resolved to its real path because uploads/ may be a symbolic link,
 * which Spring refuses to serve static files through. Only covers are exposed here.
 */
@Configuration
public class CoverResourceConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public CoverResourceConfig(@Value("${app.uploads.dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // The backend runs from BackendSpringBoot/, so the shared folder is usually one level up.
        registry.addResourceHandler("/uploads/covers/**")
                .addResourceLocations(location("../uploads"), location(uploadDir));
    }

    private static String location(String uploads) {
        Path covers = new File(uploads, "covers").toPath().toAbsolutePath().normalize();
        try {
            covers = covers.toRealPath();
        } catch (IOException ignored) {
            // Folder does not exist (yet); keep the plain path.
        }
        String uri = covers.toUri().toString();
        return Files.isDirectory(covers) && uri.endsWith("/") ? uri : uri + "/";
    }
}
