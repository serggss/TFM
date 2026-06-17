package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.OracleResult;
import com.tfm.apiseclab.dto.ProfileUpdateRequest;
import com.tfm.apiseclab.model.UserProfile;
import com.tfm.apiseclab.repository.UserProfileRepository;
import com.tfm.apiseclab.service.MonitorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/mass-assignment")
public class MassAssignmentController {

    private final UserProfileRepository profileRepository;
    private final MonitorService monitorService;

    public MassAssignmentController(UserProfileRepository profileRepository,
                                     MonitorService monitorService) {
        this.profileRepository = profileRepository;
        this.monitorService = monitorService;
    }

    @GetMapping("/{state}/profile/{id}")
    public ResponseEntity<?> getProfile(@PathVariable String state, @PathVariable Long id) {
        return profileRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/vulnerable/profile/{id}")
    public ResponseEntity<?> updateVulnerable(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        Optional<UserProfile> opt = profileRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        UserProfile profile = opt.get();
        String oldRole = profile.getRole();
        Double oldBalance = profile.getBalance();
        Boolean oldVerified = profile.getVerified();
        Double oldDiscount = profile.getDiscount();

        applyAllFields(profile, body);
        profileRepository.save(profile);

        List<String> modified = detectModifiedProtectedFields(
                oldRole, oldBalance, oldVerified, oldDiscount, profile);

        boolean isAttack = !modified.isEmpty();

        OracleResult oracle = new OracleResult(
                "vulnerable", id, null, true,
                isAttack ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("MASS_ASSIGNMENT", "vulnerable", isAttack,
                String.format("Campos protegidos modificados: %s", modified), request);

        return ResponseEntity.ok(Map.of(
                "profile", profile,
                "modifiedProtectedFields", modified,
                "oracle", oracle
        ));
    }

    @PutMapping("/partial/profile/{id}")
    public ResponseEntity<?> updatePartial(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {

        Optional<UserProfile> opt = profileRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        UserProfile profile = opt.get();
        String oldRole = profile.getRole();
        Double oldBalance = profile.getBalance();
        Boolean oldVerified = profile.getVerified();
        Double oldDiscount = profile.getDiscount();

        Set<String> blocked = Set.of("role", "balance");
        List<String> rejectedFields = new ArrayList<>();

        for (Map.Entry<String, Object> entry : body.entrySet()) {
            String field = entry.getKey();
            if (blocked.contains(field)) {
                rejectedFields.add(field);
                continue;
            }
            applyField(profile, field, entry.getValue());
        }
        profileRepository.save(profile);

        List<String> modified = detectModifiedProtectedFields(
                oldRole, oldBalance, oldVerified, oldDiscount, profile);

        boolean isBypass = !modified.isEmpty();

        OracleResult oracle = new OracleResult(
                "partial", id, null, true,
                isBypass ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("MASS_ASSIGNMENT", "partial", isBypass,
                String.format("Bloqueados: %s — Bypass en: %s", rejectedFields, modified), request);

        return ResponseEntity.ok(Map.of(
                "profile", profile,
                "rejectedFields", rejectedFields,
                "modifiedProtectedFields", modified,
                "oracle", oracle
        ));
    }

    @PutMapping("/fixed/profile/{id}")
    public ResponseEntity<?> updateFixed(
            @PathVariable Long id,
            @RequestBody ProfileUpdateRequest dto,
            HttpServletRequest request) {

        Optional<UserProfile> opt = profileRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        UserProfile profile = opt.get();

        if (dto.name() != null) profile.setName(dto.name());
        if (dto.email() != null) profile.setEmail(dto.email());
        if (dto.bio() != null) profile.setBio(dto.bio());

        profileRepository.save(profile);

        OracleResult oracle = new OracleResult(
                "fixed", id, null, true,
                "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("MASS_ASSIGNMENT", "fixed", false,
                "Actualización con DTO restrictivo — solo name/email/bio", request);

        return ResponseEntity.ok(Map.of(
                "profile", profile,
                "acceptedFields", List.of("name", "email", "bio"),
                "oracle", oracle
        ));
    }

    @PostMapping("/{state}/profile/{id}/reset")
    public ResponseEntity<?> resetProfile(@PathVariable String state, @PathVariable Long id) {
        Optional<UserProfile> opt = profileRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        UserProfile p = opt.get();
        p.setRole("user");
        p.setBalance(1205.50);
        p.setVerified(false);
        p.setDiscount(0.0);
        profileRepository.save(p);

        return ResponseEntity.ok(Map.of("message", "Perfil reseteado", "profile", p));
    }

    private void applyAllFields(UserProfile profile, Map<String, Object> body) {
        for (Map.Entry<String, Object> entry : body.entrySet()) {
            applyField(profile, entry.getKey(), entry.getValue());
        }
    }

    private void applyField(UserProfile profile, String field, Object value) {
        switch (field) {
            case "name" -> profile.setName((String) value);
            case "email" -> profile.setEmail((String) value);
            case "bio" -> profile.setBio((String) value);
            case "role" -> profile.setRole((String) value);
            case "balance" -> profile.setBalance(((Number) value).doubleValue());
            case "verified" -> profile.setVerified((Boolean) value);
            case "discount" -> profile.setDiscount(((Number) value).doubleValue());
        }
    }

    private List<String> detectModifiedProtectedFields(
            String oldRole, Double oldBalance, Boolean oldVerified, Double oldDiscount,
            UserProfile current) {
        List<String> modified = new ArrayList<>();
        if (!oldRole.equals(current.getRole())) modified.add("role");
        if (!oldBalance.equals(current.getBalance())) modified.add("balance");
        if (!oldVerified.equals(current.getVerified())) modified.add("verified");
        if (!oldDiscount.equals(current.getDiscount())) modified.add("discount");
        return modified;
    }
}
