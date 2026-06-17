package com.tfm.apiseclab.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración de CORS (Cross-Origin Resource Sharing) para desarrollo.
 *
 * CONTEXTO: El frontend (React/Vite) corre en localhost:5173 y el backend
 * (Spring Boot) en localhost:8080. Son orígenes distintos → el navegador
 * bloquea las peticiones cross-origin por defecto.
 *
 * Esta configuración PERMITE todas las peticiones cross-origin durante
 * el desarrollo. Es deliberadamente permisiva porque:
 *   1. Necesitamos que el frontend pueda llamar al backend sin proxy.
 *   2. La vulnerabilidad #3 (CORS mal configurado) se demuestra en sus
 *      propios endpoints con configuraciones explícitas por estado.
 *      Esta config global es solo para que la app funcione en dev.
 *
 * NOTA PARA EL TRIBUNAL: Esta configuración se restringe en Docker
 * (docker-compose usa un proxy nginx que evita problemas de CORS).
 * La vulnerabilidad CORS (#3, Semana 2) tiene su propia configuración
 * independiente con los tres estados.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry
            // Aplica a todos los endpoints de la API
            .addMapping("/api/**")
            // Permite peticiones desde el frontend de desarrollo
            .allowedOrigins("http://localhost:5173", "http://localhost:3000")
            // Métodos HTTP permitidos
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            // Permite todas las cabeceras (incluyendo X-User-Id para auth simulada)
            .allowedHeaders("*")
            // Permite enviar cookies/credenciales (necesario para algunos tests)
            .allowCredentials(true);
    }
}
