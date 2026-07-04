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

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));
            boolean isForged = realUser.isPresent() && !realUser.get().getRole().equals(role);

            OracleResult oracle = new OracleResult(
                    "vulnerable", Long.parseLong(sub), null, true,
                    isForged ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS");

            monitorService.recordEvent("JWT", "vulnerable", isForged,
                    String.format("Token aceptado sin verificar firma — sub=%s role=%s forged=%b", sub, role, isForged),
                    request);

            return ResponseEntity.ok(Map.of("claims", claims, "profile", realUser.orElse(null), "oracle", oracle));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Token inválido: " + e.getMessage());
        }
    }

    @GetMapping({"/partial/profile", "/partial-alg-none/profile"})
    public ResponseEntity<?> profilePartialAlgNone(
            @RequestHeader(value = "X-Auth-Token", required = false) String authHeader,
            HttpServletRequest request) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body("Se requiere cabecera X-Auth-Token con el JWT");
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Map<String, Object> claims = jwtService.parsePartialAlgNone(token);
            String sub = String.valueOf(claims.get("sub"));
            String role = String.valueOf(claims.getOrDefault("role", "user"));

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));
            boolean isForged = realUser.isPresent() && !realUser.get().getRole().equals(role);
            boolean isAlgNone = token.endsWith(".");

            OracleResult oracle = new OracleResult(
                    "partial-alg-none", Long.parseLong(sub), null, true,
                    isForged ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS");

            monitorService.recordEvent("JWT", "partial-alg-none", isForged,
                    String.format("alg_none=%b sub=%s role=%s forged=%b", isAlgNone, sub, role, isForged),
                    request);

            return ResponseEntity.ok(Map.of("claims", claims, "profile", realUser.orElse(null), "oracle", oracle));
        } catch (Exception e) {
            monitorService.recordEvent("JWT", "partial-alg-none", false, "Token rechazado: " + e.getMessage(), request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Token inválido: " + e.getMessage(),
                    "oracle", new OracleResult("partial-alg-none", null, null, false, "ATTACK_BLOCKED")));
        }
    }

    @GetMapping("/partial-weak-key/profile")
    public ResponseEntity<?> profilePartialWeakKey(
            @RequestHeader(value = "X-Auth-Token", required = false) String authHeader,
            HttpServletRequest request) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body("Se requiere cabecera X-Auth-Token con el JWT");
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Map<String, Object> claims = jwtService.parsePartialWeakKey(token);
            String sub = String.valueOf(claims.get("sub"));
            String role = String.valueOf(claims.getOrDefault("role", "user"));

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));
            boolean isForged = realUser.isPresent() && !realUser.get().getRole().equals(role);

            OracleResult oracle = new OracleResult(
                    "partial-weak-key", Long.parseLong(sub), null, true,
                    isForged ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS");

            monitorService.recordEvent("JWT", "partial-weak-key", isForged,
                    String.format("Clave débil — sub=%s role=%s forged=%b", sub, role, isForged),
                    request);

            return ResponseEntity.ok(Map.of("claims", claims, "profile", realUser.orElse(null), "oracle", oracle));
        } catch (Exception e) {
            monitorService.recordEvent("JWT", "partial-weak-key", false, "Token rechazado: " + e.getMessage(), request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Token inválido o firmado con clave incorrecta: " + e.getMessage(),
                    "oracle", new OracleResult("partial-weak-key", null, null, false, "ATTACK_BLOCKED")));
        }
    }

    @GetMapping("/partial-no-exp/profile")
    public ResponseEntity<?> profilePartialNoExp(
            @RequestHeader(value = "X-Auth-Token", required = false) String authHeader,
            HttpServletRequest request) {

        if (authHeader == null || authHeader.isBlank()) {
            return ResponseEntity.status(401).body("Se requiere cabecera X-Auth-Token con el JWT");
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Map<String, Object> claims = jwtService.parsePartialNoExp(token);
            String sub = String.valueOf(claims.get("sub"));
            String role = String.valueOf(claims.getOrDefault("role", "user"));

            Optional<UserProfile> realUser = userRepository.findById(Long.parseLong(sub));
            boolean isExpiredReplay = realUser.isPresent();

            OracleResult oracle = new OracleResult(
                    "partial-no-exp", Long.parseLong(sub), null, true,
                    isExpiredReplay ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS");

            monitorService.recordEvent("JWT", "partial-no-exp", isExpiredReplay,
                    String.format("Token expirado aceptado — sub=%s role=%s", sub, role),
                    request);

            return ResponseEntity.ok(Map.of(
                    "claims", claims,
                    "profile", realUser.orElse(null),
                    "oracle", oracle,
                    "_warning", "Token expirado aceptado: el servidor captura ExpiredJwtException y continúa"
            ));
        } catch (Exception e) {
            monitorService.recordEvent("JWT", "partial-no-exp", false, "Token rechazado: " + e.getMessage(), request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Token inválido: " + e.getMessage(),
                    "oracle", new OracleResult("partial-no-exp", null, null, false, "ATTACK_BLOCKED")));
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

            OracleResult oracle = new OracleResult("fixed", Long.parseLong(sub), null, true, "LEGITIMATE_ACCESS");
            monitorService.recordEvent("JWT", "fixed", false,
                    String.format("Token verificado correctamente — sub=%s", sub), request);

            return ResponseEntity.ok(Map.of("claims", claims, "profile", realUser.orElse(null), "oracle", oracle));
        } catch (Exception e) {
            monitorService.recordEvent("JWT", "fixed", false, "Token rechazado: " + e.getMessage(), request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Token rechazado: " + e.getMessage(),
                    "oracle", new OracleResult("fixed", null, null, false, "ATTACK_BLOCKED")));
        }
    }
}
