package com.tfm.apiseclab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de la aplicación Spring Boot.
 *
 * DECISIÓN IMPORTANTE: NO se incluye Spring Security en el proyecto.
 *
 * Justificación para el tribunal:
 * Spring Security intercepta y protege automáticamente muchos de los
 * vectores de ataque que queremos demostrar (CORS, sesiones, CSRF, etc.).
 * Al no incluirlo, la autenticación y autorización se implementan a mano,
 * lo que permite:
 *   1. Crear deliberadamente versiones vulnerables de cada mecanismo.
 *   2. Mostrar con precisión qué falla en cada estado (vulnerable/partial/fixed).
 *   3. Que el estudiante entienda QUÉ hace Spring Security por debajo,
 *      en lugar de confiar ciegamente en la autoconfiguración.
 *
 * En la Semana 1 la autenticación se simula con la cabecera X-User-Id.
 * En la Semana 2 se reemplaza por JWT manual con JJWT.
 */
@SpringBootApplication
public class ApiSecLabApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiSecLabApplication.class, args);
    }
}
