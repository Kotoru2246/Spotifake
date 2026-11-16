package com.spotifake.config;

import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdminPortConfig {

    @Value("${server.admin.port:9000}")
    private int adminPort;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> adminPortCustomizer() {
        return factory -> {
            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setPort(adminPort);
            factory.addAdditionalTomcatConnectors(connector);
        };
    }
}
