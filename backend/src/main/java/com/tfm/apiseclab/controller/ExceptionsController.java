package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.OracleResult;
import com.tfm.apiseclab.model.UserProfile;
import com.tfm.apiseclab.repository.UserProfileRepository;
import com.tfm.apiseclab.service.MonitorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/exceptions")
public class ExceptionsController {

    private static final Map<String, Object> ADMIN_CONFIG = Map.of(
            "dbHost", "internal-db.prod.example.com:5432",
            "dbUser", "admin_prod",
            "dbPassword", "s3cret_pr0d_2026",
            "apiKeys", Map.of("stripe", "sk_live_abc123", "sendgrid", "SG.xyz789"),
            "debugMode", true,
            "internalEndpoints", new String[]{"/actuator", "/admin/users", "/debug/heap"}
    );

    private final UserProfileRepository userRepository;
    private final MonitorService monitorService;

    public ExceptionsController(UserProfileRepository userRepository, MonitorService monitorService) {
        this.userRepository = userRepository;
        this.monitorService = monitorService;
    }

    @GetMapping("/vulnerable/admin/config")
    public ResponseEntity<?> configVulnerable(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            HttpServletRequest request) {

        try {
            if (userIdStr != null) {
                Long userId = Long.parseLong(userIdStr);
                userRepository.findById(userId).orElseThrow(
                        () -> new RuntimeException("Usuario no encontrado en BD: userId=" + userId +
                                " tabla=user_profiles esquema=PUBLIC datasource=jdbc:h2:mem:apiseclab"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage(),
                    "type", e.getClass().getName(),
                    "stackTrace", Arrays.stream(e.getStackTrace()).limit(8)
                            .map(StackTraceElement::toString).toList(),
                    "serverInfo", Map.of(
                            "javaVersion", System.getProperty("java.version"),
                            "osName", System.getProperty("os.name"),
                            "userDir", System.getProperty("user.dir")
                    )
            ));
        }

        monitorService.recordEvent("EXCEPTIONS", "vulnerable", true,
                "Configuración admin expuesta sin autorización", request);

        return ResponseEntity.ok(Map.of(
                "config", ADMIN_CONFIG,
                "oracle", new OracleResult("vulnerable", null, null, true, "ATTACK_SUCCESS")
        ));
    }

    @GetMapping("/partial/admin/config")
    public ResponseEntity<?> configPartial(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            HttpServletRequest request) {

        boolean isAuthorized = true;

        try {
            if (userIdStr == null) {
                isAuthorized = false;
            } else {
                Long userId = Long.parseLong(userIdStr);
                UserProfile user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
                isAuthorized = "admin".equals(user.getRole());
            }
        } catch (Exception e) {
            monitorService.recordEvent("EXCEPTIONS", "partial", true,
                    String.format("Fail-open: excepción '%s' con input '%s' — isAuthorized quedó en true",
                            e.getClass().getSimpleName(), userIdStr),
                    request);

            return ResponseEntity.ok(Map.of(
                    "config", ADMIN_CONFIG,
                    "error_debug", Map.of(
                            "message", e.getMessage(),
                            "type", e.getClass().getName(),
                            "input", userIdStr
                    ),
                    "oracle", new OracleResult("partial", null, null, true, "ATTACK_SUCCESS"),
                    "_explanation", "fail-open: isAuthorized defaulted to true, exception skipped the check"
            ));
        }

        if (!isAuthorized) {
            monitorService.recordEvent("EXCEPTIONS", "partial", false,
                    "Acceso denegado correctamente en happy path", request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Acceso denegado",
                    "oracle", new OracleResult("partial", null, null, false, "ATTACK_BLOCKED")
            ));
        }

        boolean isAdmin = false;
        try {
            Long uid = Long.parseLong(userIdStr);
            isAdmin = userRepository.findById(uid).map(u -> "admin".equals(u.getRole())).orElse(false);
        } catch (Exception ignored) {}

        monitorService.recordEvent("EXCEPTIONS", "partial", !isAdmin,
                isAdmin ? "Acceso admin legítimo" : "Fail-open: acceso concedido por default true", request);

        return ResponseEntity.ok(Map.of(
                "config", ADMIN_CONFIG,
                "oracle", new OracleResult("partial", null, null, true,
                        isAdmin ? "LEGITIMATE_ACCESS" : "ATTACK_SUCCESS")
        ));
    }

    @GetMapping("/fixed/admin/config")
    public ResponseEntity<?> configFixed(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            HttpServletRequest request) {

        boolean isAuthorized = false;

        try {
            if (userIdStr != null) {
                Long userId = Long.parseLong(userIdStr);
                UserProfile user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    isAuthorized = "admin".equals(user.getRole());
                }
            }
        } catch (Exception e) {
            monitorService.recordEvent("EXCEPTIONS", "fixed", false,
                    String.format("Excepción capturada, fail-closed — input: '%s'", userIdStr), request);
        }

        if (!isAuthorized) {
            monitorService.recordEvent("EXCEPTIONS", "fixed", false,
                    "Acceso denegado (fail-closed)", request);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "Acceso denegado",
                    "oracle", new OracleResult("fixed", null, null, false, "ATTACK_BLOCKED")
            ));
        }

        monitorService.recordEvent("EXCEPTIONS", "fixed", false,
                "Acceso admin legítimo", request);

        return ResponseEntity.ok(Map.of(
                "config", ADMIN_CONFIG,
                "oracle", new OracleResult("fixed", null, null, true, "LEGITIMATE_ACCESS")
        ));
    }
}
