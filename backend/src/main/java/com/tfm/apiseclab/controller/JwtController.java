package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.OracleResult;
import com.tfm.apiseclab.model.UserProfile;
import com.tfm.apiseclab.repository.UserProfileRepository;
import com.tfm.apiseclab.service.JwtService;
import com.tfm.apiseclab.service.MonitorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/jwt")
public class JwtController {

    private final JwtService jwtService;
    private final UserProfileRepository userRepository;
    private final MonitorService monitorService;

    public JwtController(JwtService jwtService, UserProfileRepository userRepository,
                         MonitorService monitorService) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.monitorService = monitorService;
    }

    @GetMapping("/vulnerable/profile")
    public ResponseEntity<?> profileVulnerable(
            @RequestHeader(value = "X-Auth-Token", required = false) String authHeader,
            HttpServletRequest request) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body("Se requiere cabecera X-Auth-Token con el JWT");
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Map<String, Object> claims = jwtService.parseVulnerable(token);
            String sub = String.valueOf(claims.get("sub"));
            String role = String.valueOf(claims.getOrDefault("role", "user"));
            String username = String.valueOf(claims.getOrDefault("username", "unknown"));

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));
            boolean isForged = realUser.isPresent() &&
                    !realUser.get().getRole().equals(role);

            OracleResult oracle = new OracleResult(
                    "vulnerable", Long.parseLong(sub), null,
                    true,
                    isForged ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
            );

            monitorService.recordEvent("JWT", "vulnerable", isForged,
                    String.format("Token aceptado sin verificar firma — sub=%s role=%s forged=%b",
                            sub, role, isForged),
                    request);

            return ResponseEntity.ok(Map.of(
                    "claims", claims,
                    "profile", realUser.orElse(null),
                    "oracle", oracle
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Token inválido: " + e.getMessage());
        }
    }

    @GetMapping("/partial/profile")
    public ResponseEntity<?> profilePartial(
            @RequestHeader(value = "X-Auth-Token", required = false) String authHeader,
            HttpServletRequest request) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body("Se requiere cabecera X-Auth-Token con el JWT");
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Map<String, Object> claims = jwtService.parsePartial(token);
            String sub = String.valueOf(claims.get("sub"));
            String role = String.valueOf(claims.getOrDefault("role", "user"));

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));
            boolean isForged = realUser.isPresent() &&
                    !realUser.get().getRole().equals(role);

            boolean isAlgNone = token.endsWith(".");

            OracleResult oracle = new OracleResult(
                    "partial", Long.parseLong(sub), null,
                    true,
                    isForged ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
            );

            monitorService.recordEvent("JWT", "partial", isForged,
                    String.format("Token aceptado — alg_none=%b sub=%s role=%s forged=%b",
                            isAlgNone, sub, role, isForged),
                    request);

            return ResponseEntity.ok(Map.of(
                    "claims", claims,
                    "profile", realUser.orElse(null),
                    "oracle", oracle
            ));
        } catch (Exception e) {
            monitorService.recordEvent("JWT", "partial", false,
                    "Token rechazado: " + e.getMessage(), request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Token inválido: " + e.getMessage(),
                    "oracle", new OracleResult("partial", null, null, false, "ATTACK_BLOCKED")
            ));
        }
    }

    @GetMapping("/fixed/profile")
    public ResponseEntity<?> profileFixed(
            @RequestHeader(value = "X-Auth-Token", required = false) String authHeader,
            HttpServletRequest request) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body("Se requiere cabecera X-Auth-Token con el JWT");
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Map<String, Object> claims = jwtService.parseFixed(token);
            String sub = String.valueOf(claims.get("sub"));

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));

            OracleResult oracle = new OracleResult(
                    "fixed", Long.parseLong(sub), null,
                    true,
                    "LEGITIMATE_ACCESS"
            );

            monitorService.recordEvent("JWT", "fixed", false,
                    String.format("Token verificado correctamente — sub=%s", sub),
                    request);

            return ResponseEntity.ok(Map.of(
                    "claims", claims,
                    "profile", realUser.orElse(null),
                    "oracle", oracle
            ));
        } catch (Exception e) {
            monitorService.recordEvent("JWT", "fixed", false,
                    "Token rechazado: " + e.getMessage(), request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Token rechazado: " + e.getMessage(),
                    "oracle", new OracleResult("fixed", null, null, false, "ATTACK_BLOCKED")
            ));
        }
    }
}
