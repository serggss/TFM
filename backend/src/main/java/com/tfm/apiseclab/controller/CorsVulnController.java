package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.OracleResult;
import com.tfm.apiseclab.service.MonitorService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/cors")
public class CorsVulnController {

    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "http://localhost:5173",
            "http://localhost:3000"
    );

    private static final Map<String, Object> SENSITIVE_DATA = Map.of(
            "apiVersion", "4.1.0",
            "dbHost", "internal-db.prod.example.com",
            "adminEmail", "admin@company.com",
            "internalEndpoints", new String[]{"/admin", "/debug", "/actuator"},
            "dbPassword", "s3cret_pr0d_2026"
    );

    private final MonitorService monitorService;

    public CorsVulnController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping("/vulnerable/data")
    public ResponseEntity<?> dataVulnerable(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            response.setHeader("Access-Control-Allow-Origin", "*");
        }
        response.setHeader("Access-Control-Allow-Credentials", "true");

        boolean isMalicious = origin != null && !ALLOWED_ORIGINS.contains(origin);

        OracleResult oracle = new OracleResult(
                "vulnerable", null, null, true,
                isMalicious ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("CORS", "vulnerable", isMalicious,
                String.format("Origin '%s' reflejado sin validación — CORS abierto", origin),
                request);

        return ResponseEntity.ok(Map.of(
                "data", SENSITIVE_DATA,
                "corsHeaders", Map.of(
                        "Access-Control-Allow-Origin", origin != null ? origin : "*",
                        "Access-Control-Allow-Credentials", "true"
                ),
                "oracle", oracle
        ));
    }

    @GetMapping("/partial/data")
    public ResponseEntity<?> dataPartial(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        boolean allowed = false;

        if (origin != null && origin.contains("localhost")) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            allowed = true;
        }

        boolean isBypass = allowed && !ALLOWED_ORIGINS.contains(origin);

        OracleResult oracle = new OracleResult(
                "partial", null, null, allowed,
                isBypass ? "ATTACK_SUCCESS" : (allowed ? "LEGITIMATE_ACCESS" : "ATTACK_BLOCKED")
        );

        monitorService.recordEvent("CORS", "partial", isBypass,
                String.format("Origin '%s' — contains('localhost')=%b bypass=%b",
                        origin, allowed, isBypass),
                request);

        Map<String, Object> corsHeaders = allowed
                ? Map.of("Access-Control-Allow-Origin", origin,
                         "Access-Control-Allow-Credentials", "true")
                : Map.of("info", "No CORS headers (origin no permitido)");

        return ResponseEntity.ok(Map.of(
                "data", allowed ? SENSITIVE_DATA : Map.of("error", "Acceso CORS denegado"),
                "corsHeaders", corsHeaders,
                "oracle", oracle
        ));
    }

    @GetMapping("/fixed/data")
    public ResponseEntity<?> dataFixed(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        boolean allowed = origin != null && ALLOWED_ORIGINS.contains(origin);

        if (allowed) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }

        boolean attempted = origin != null && !origin.isBlank() && !allowed;

        OracleResult oracle = new OracleResult(
                "fixed", null, null, allowed,
                attempted ? "ATTACK_BLOCKED" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("CORS", "fixed", false,
                String.format("Origin '%s' — whitelist exacta — allowed=%b", origin, allowed),
                request);

        Map<String, Object> corsHeaders = allowed
                ? Map.of("Access-Control-Allow-Origin", origin,
                         "Access-Control-Allow-Credentials", "true")
                : Map.of("info", "No CORS headers");

        return ResponseEntity.ok(Map.of(
                "data", allowed ? SENSITIVE_DATA : Map.of("error", "Acceso CORS denegado"),
                "corsHeaders", corsHeaders,
                "oracle", oracle
        ));
    }

    @RequestMapping(value = "/{state}/data", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> preflight(
            @PathVariable String state,
            HttpServletRequest request,
            HttpServletResponse response) {

        String origin = request.getHeader("Origin");

        switch (state) {
            case "vulnerable" -> {
                response.setHeader("Access-Control-Allow-Origin", origin != null ? origin : "*");
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.setHeader("Access-Control-Allow-Headers", "*");
                response.setHeader("Access-Control-Allow-Credentials", "true");
            }
            case "partial" -> {
                if (origin != null && origin.contains("localhost")) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                }
            }
            case "fixed" -> {
                if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
                    response.setHeader("Access-Control-Allow-Origin", origin);
                    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
                    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
                    response.setHeader("Access-Control-Allow-Credentials", "true");
                }
            }
        }

        return ResponseEntity.ok().build();
    }
}
