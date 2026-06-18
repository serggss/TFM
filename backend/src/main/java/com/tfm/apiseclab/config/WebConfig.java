package com.tfm.apiseclab.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allEndpoints = {
            "/api/bola/**", "/api/jwt/**", "/api/mass-assignment/**",
            "/api/auth/**", "/api/exceptions/**", "/api/prompt-injection/**",
            "/api/monitor/**", "/api/diffs/**", "/api/vulnerabilities/**"
        };

        for (String path : allEndpoints) {
            registry.addMapping(path)
                    .allowedOriginPatterns("*")
                    .allowedMethods("GET", "POST", "PUT", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
        }
    }
}
