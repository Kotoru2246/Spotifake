package com.spotifake;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class SpotifakeApplication {

    public static void main(String[] args) {
        System.out.println("====================================================");
        System.out.println("Starting Spotifake Spring Boot Application (Port 8000)");
        System.out.println("====================================================");
        SpringApplication.run(SpotifakeApplication.class, args);
    }
}
