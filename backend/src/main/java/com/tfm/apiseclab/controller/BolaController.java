package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.BolaResponse;
import com.tfm.apiseclab.dto.OracleResult;
import com.tfm.apiseclab.model.Account;
import com.tfm.apiseclab.repository.AccountRepository;
import com.tfm.apiseclab.service.MonitorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bola")
public class BolaController {

    private final AccountRepository accountRepository;
    private final MonitorService monitorService;

    public BolaController(AccountRepository accountRepository,
                          MonitorService monitorService) {
        this.accountRepository = accountRepository;
        this.monitorService = monitorService;
    }

    @GetMapping("/vulnerable/accounts/{id}")
    public ResponseEntity<BolaResponse> getAccountVulnerable(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        Optional<Account> optAccount = accountRepository.findById(id);
        if (optAccount.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Account account = optAccount.get();

        boolean isOtherUser = userId != null && !userId.equals(account.getOwnerId());
        OracleResult oracle = new OracleResult(
            "vulnerable",
            userId,
            account.getOwnerId(),
            true,
            isOtherUser ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent(
            "BOLA", "vulnerable", isOtherUser,
            String.format("Acceso a cuenta #%d (dueño: %d) por usuario %s — sin control de acceso",
                id, account.getOwnerId(), userId != null ? userId.toString() : "anónimo"),
            request
        );

        return ResponseEntity.ok(new BolaResponse(account, oracle));
    }

    @GetMapping("/vulnerable/accounts")
    public ResponseEntity<?> listAccountsVulnerable(
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        List<Account> allAccounts = accountRepository.findAll();

        monitorService.recordEvent(
            "BOLA", "vulnerable", true,
            String.format("Listado completo de %d cuentas por usuario %s — sin filtrar",
                allAccounts.size(), userId != null ? userId.toString() : "anónimo"),
            request
        );

        OracleResult oracle = new OracleResult("vulnerable", userId, null, true, "ATTACK_SUCCESS");
        return ResponseEntity.ok(Map.of("accounts", allAccounts, "oracle", oracle));
    }

    @GetMapping("/partial/accounts/{id}")
    public ResponseEntity<?> getAccountPartial(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        if (userId == null) {
            monitorService.recordEvent(
                "BOLA", "partial", false,
                "Petición sin autenticación rechazada en endpoint individual",
                request
            );
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        Optional<Account> optAccount = accountRepository.findById(id);
        if (optAccount.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Account account = optAccount.get();

        if (!account.getOwnerId().equals(userId)) {
            OracleResult oracle = new OracleResult(
                "partial", userId, account.getOwnerId(),
                false,
                "ATTACK_BLOCKED"
            );

            monitorService.recordEvent(
                "BOLA", "partial", false,
                String.format("Acceso a cuenta #%d (dueño: %d) BLOQUEADO para usuario %d — control OK",
                    id, account.getOwnerId(), userId),
                request
            );

            return ResponseEntity.status(403).body(oracle);
        }

        OracleResult oracle = new OracleResult(
            "partial", userId, account.getOwnerId(),
            true,
            "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent(
            "BOLA", "partial", false,
            String.format("Acceso legítimo a cuenta #%d por su dueño (usuario %d)",
                id, userId),
            request
        );

        return ResponseEntity.ok(new BolaResponse(account, oracle));
    }

    @GetMapping("/partial/accounts")
    public ResponseEntity<?> searchAccountsPartial(
            @RequestParam(required = false) Long ownerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        if (userId == null) {
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        // bypass: ownerId del cliente no se valida contra el usuario autenticado
        Long effectiveOwnerId = (ownerId != null) ? ownerId : userId;

        List<Account> accounts = accountRepository.findByOwnerId(effectiveOwnerId);

        boolean isAttack = !effectiveOwnerId.equals(userId);

        monitorService.recordEvent(
            "BOLA", "partial", isAttack,
            String.format("Búsqueda de cuentas con ownerId=%d por usuario %d — %s",
                effectiveOwnerId, userId,
                isAttack ? "BYPASS via endpoint de búsqueda" : "acceso legítimo"),
            request
        );

        OracleResult oracle = new OracleResult(
            "partial", userId, effectiveOwnerId, isAttack,
            isAttack ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );
        return ResponseEntity.ok(Map.of("accounts", accounts, "oracle", oracle));
    }

    @GetMapping("/fixed/accounts/{id}")
    public ResponseEntity<?> getAccountFixed(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        if (userId == null) {
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        Optional<Account> optAccount = accountRepository.findById(id);
        if (optAccount.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Account account = optAccount.get();

        if (!account.getOwnerId().equals(userId)) {
            OracleResult oracle = new OracleResult(
                "fixed", userId, account.getOwnerId(),
                false,
                "ATTACK_BLOCKED"
            );

            monitorService.recordEvent(
                "BOLA", "fixed", false,
                String.format("Acceso a cuenta #%d (dueño: %d) BLOQUEADO para usuario %d",
                    id, account.getOwnerId(), userId),
                request
            );

            return ResponseEntity.status(403).body(oracle);
        }

        OracleResult oracle = new OracleResult(
            "fixed", userId, account.getOwnerId(),
            true,
            "LEGITIMATE_ACCESS"
        );

        return ResponseEntity.ok(new BolaResponse(account, oracle));
    }

    @GetMapping("/fixed/accounts")
    public ResponseEntity<?> searchAccountsFixed(
            @RequestParam(required = false) Long ownerId, // se acepta pero se ignora
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        if (userId == null) {
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        List<Account> accounts = accountRepository.findByOwnerId(userId);

        boolean attemptedBypass = ownerId != null && !ownerId.equals(userId);

        monitorService.recordEvent(
            "BOLA", "fixed", false,
            String.format("Búsqueda de cuentas por usuario %d — %s — devueltas %d cuentas propias",
                userId,
                attemptedBypass ? "intento de bypass IGNORADO (ownerId=" + ownerId + ")" : "acceso legítimo",
                accounts.size()),
            request
        );

        OracleResult oracle = new OracleResult(
            "fixed", userId, ownerId, false,
            attemptedBypass ? "ATTACK_BLOCKED" : "LEGITIMATE_ACCESS"
        );
        return ResponseEntity.ok(Map.of("accounts", accounts, "oracle", oracle));
    }
}
