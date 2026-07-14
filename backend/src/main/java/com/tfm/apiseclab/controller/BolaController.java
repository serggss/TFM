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

/**
 * Controlador de la vulnerabilidad BOLA / IDOR (Broken Object Level Authorization).
 *
 * ============================================================================
 * REFERENCIA OWASP
 * ============================================================================
 *   - API Security Top 10 2023: API1:2023 — Broken Object Level Authorization
 *   - OWASP Top 10 2025 (web): A01:2025 — Broken Access Control
 *
 * ============================================================================
 * ¿QUÉ ES BOLA/IDOR?
 * ============================================================================
 * BOLA (Broken Object Level Authorization) ocurre cuando una API expone
 * endpoints que reciben un identificador de objeto (ID) y NO verifica que
 * el usuario autenticado tenga permiso para acceder a ese objeto concreto.
 *
 * Ejemplo real: GET /api/accounts/123 devuelve la cuenta #123 sin comprobar
 * si el usuario que hace la petición es el dueño de esa cuenta.
 *
 * Es la vulnerabilidad #1 en el OWASP API Top 10 porque:
 *   - Es trivial de explotar (basta cambiar el ID en la URL).
 *   - Es difícil de detectar con herramientas automatizadas (requiere lógica
 *     de negocio para saber quién puede acceder a qué).
 *   - El impacto es alto (acceso a datos de otros usuarios).
 *
 * ============================================================================
 * MODELO DE TRES ESTADOS
 * ============================================================================
 *
 * VULNERABLE (/api/bola/vulnerable/...):
 *   - No hay NINGÚN control de acceso.
 *   - Cualquier usuario (o sin autenticar) puede ver cualquier cuenta.
 *   - Ataque: cambiar el ID en la URL → acceso inmediato.
 *
 * PARTIAL (/api/bola/partial/...):
 *   - El endpoint individual SÍ verifica propiedad (GET /accounts/{id}).
 *   - BYPASS: el endpoint de búsqueda (GET /accounts?ownerId=X) NO verifica
 *     que el parámetro ownerId coincida con el usuario autenticado.
 *     El atacante puede listar las cuentas de cualquier usuario usando
 *     el parámetro de búsqueda.
 *   - Este patrón es MUY común en aplicaciones reales: el desarrollador
 *     protege la ruta obvia pero olvida una ruta alternativa que expone
 *     los mismos datos. Los bug bounty reports están llenos de esto.
 *
 * FIXED (/api/bola/fixed/...):
 *   - TODOS los endpoints verifican propiedad.
 *   - El endpoint individual comprueba ownerId == userId.
 *   - El endpoint de búsqueda IGNORA el parámetro ownerId y siempre
 *     filtra por el usuario autenticado.
 *   - No hay forma de acceder a datos ajenos.
 *
 * ============================================================================
 * AUTENTICACIÓN (SEMANA 1)
 * ============================================================================
 * Se simula con la cabecera X-User-Id (ej: "X-User-Id: 2" = soy el usuario 2).
 * Es intencionalmente inseguro: permite demostrar BOLA sin la complejidad
 * de JWT (que se añade en Semana 2). En la memoria del TFM se justifica
 * como simplificación temporal para aislar la vulnerabilidad de acceso.
 */
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

    // =========================================================================
    //  ESTADO VULNERABLE — Sin ningún control de acceso
    // =========================================================================

    /**
     * GET /api/bola/vulnerable/accounts/{id}
     *
     * Devuelve la cuenta solicitada sin verificar NADA.
     * Ni siquiera requiere que el usuario esté autenticado.
     *
     * ATAQUE: Simplemente cambiar el {id} en la URL.
     *   curl http://localhost:8080/api/bola/vulnerable/accounts/1
     *   → Devuelve la cuenta de Alice aunque no seas Alice.
     */
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

        // --- FALLO DE SEGURIDAD: No se comprueba si userId == account.ownerId ---
        // En un sistema seguro, aquí habría una comprobación del tipo:
        //   if (!account.getOwnerId().equals(userId)) return 403;
        // Pero en el estado vulnerable, simplemente se devuelven los datos.

        // Oráculo: determinar si esto es un ataque (acceso a recurso ajeno)
        boolean isOtherUser = userId != null && !userId.equals(account.getOwnerId());
        OracleResult oracle = new OracleResult(
            "vulnerable",
            userId,
            account.getOwnerId(),
            true, // acceso siempre concedido (no hay control)
            isOtherUser ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        // Registrar en el monitor
        monitorService.recordEvent(
            "BOLA", "vulnerable", isOtherUser,
            String.format("Acceso a cuenta #%d (dueño: %d) por usuario %s — sin control de acceso",
                id, account.getOwnerId(), userId != null ? userId.toString() : "anónimo"),
            request
        );

        return ResponseEntity.ok(new BolaResponse(account, oracle));
    }

    /**
     * GET /api/bola/vulnerable/accounts
     *
     * Lista TODAS las cuentas del sistema sin filtrar.
     * Otro vector de ataque: no hace falta adivinar IDs,
     * simplemente listar todo.
     */
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

    // =========================================================================
    //  ESTADO PARTIAL — Mitigación incompleta (con bypass)
    // =========================================================================
    //
    //  El desarrollador protegió el endpoint individual (GET /accounts/{id})
    //  pero OLVIDÓ proteger el endpoint de búsqueda (GET /accounts?ownerId=X).
    //
    //  Este es el estado central del TFM: demuestra que una mitigación parcial
    //  puede dar falsa sensación de seguridad.
    // =========================================================================

    /**
     * GET /api/bola/partial/accounts/{id}
     *
     * Este endpoint SÍ verifica propiedad: comprueba que el X-User-Id
     * coincida con el ownerId de la cuenta. Si no coincide, devuelve 403.
     *
     * Por sí solo, este endpoint es seguro. El problema está en que existe
     * OTRO endpoint (la búsqueda) que da acceso a los mismos datos sin
     * la misma comprobación.
     */
    @GetMapping("/partial/accounts/{id}")
    public ResponseEntity<?> getAccountPartial(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        // Paso 1: Verificar que el usuario está autenticado
        if (userId == null) {
            monitorService.recordEvent(
                "BOLA", "partial", false,
                "Petición sin autenticación rechazada en endpoint individual",
                request
            );
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        // Paso 2: Buscar la cuenta
        Optional<Account> optAccount = accountRepository.findById(id);
        if (optAccount.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Account account = optAccount.get();

        // Paso 3: CONTROL DE ACCESO — verificar propiedad
        // Esta comprobación es CORRECTA y bloquea el ataque directo por ID.
        if (!account.getOwnerId().equals(userId)) {
            OracleResult oracle = new OracleResult(
                "partial", userId, account.getOwnerId(),
                false, // acceso denegado
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

        // Acceso legítimo: el usuario accede a su propia cuenta
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

    /**
     * GET /api/bola/partial/accounts?ownerId={ownerId}
     *
     * *** AQUÍ ESTÁ EL BYPASS ***
     *
     * Este endpoint de búsqueda filtra cuentas por ownerId, pero NO verifica
     * que el parámetro ownerId coincida con el usuario autenticado.
     *
     * El desarrollador pensó: "ya protegí el GET por ID, esto es solo un filtro".
     * Pero el filtro acepta CUALQUIER ownerId → el atacante puede listar las
     * cuentas de cualquier usuario.
     *
     * ATAQUE:
     *   curl -H "X-User-Id: 2" \
     *        "http://localhost:8080/api/bola/partial/accounts?ownerId=1"
     *   → Devuelve las cuentas de Alice (ownerId=1) siendo Bob (userId=2).
     *
     * Este patrón es extremadamente común en aplicaciones reales porque:
     *   1. Los endpoints de búsqueda se crean como "utilidades" sin pensar
     *      en seguridad.
     *   2. Las revisiones de código se centran en los endpoints CRUD obvios.
     *   3. Los tests de seguridad automatizados no detectan esta lógica
     *      (no saben qué ownerId "debería" poder ver cada usuario).
     */
    @GetMapping("/partial/accounts")
    public ResponseEntity<?> searchAccountsPartial(
            @RequestParam(required = false) Long ownerId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        if (userId == null) {
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        // --- FALLO DE SEGURIDAD ---
        // Se usa directamente el parámetro ownerId del query string
        // sin verificar que coincida con el usuario autenticado.
        // Lo correcto sería: Long effectiveOwnerId = userId;
        // Pero aquí se confía en el parámetro del cliente.
        Long effectiveOwnerId = (ownerId != null) ? ownerId : userId;

        List<Account> accounts = accountRepository.findByOwnerId(effectiveOwnerId);

        // Oráculo: si el ownerId buscado no coincide con el usuario autenticado,
        // es un bypass exitoso.
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

    // =========================================================================
    //  ESTADO FIXED — Mitigación completa
    // =========================================================================
    //
    //  TODOS los endpoints verifican propiedad de forma consistente.
    //  No hay forma de acceder a datos de otro usuario.
    // =========================================================================

    /**
     * GET /api/bola/fixed/accounts/{id}
     *
     * Acceso individual con verificación de propiedad.
     * Igual que en partial — este ya estaba bien.
     */
    @GetMapping("/fixed/accounts/{id}")
    public ResponseEntity<?> getAccountFixed(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        // Paso 1: Autenticación obligatoria
        if (userId == null) {
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        // Paso 2: Buscar la cuenta
        Optional<Account> optAccount = accountRepository.findById(id);
        if (optAccount.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Account account = optAccount.get();

        // Paso 3: Verificar propiedad — idéntico al partial
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

    /**
     * GET /api/bola/fixed/accounts
     *
     * Listado de cuentas con filtrado FORZADO por usuario autenticado.
     *
     * CORRECCIÓN CLAVE respecto al estado partial:
     * Se IGNORA cualquier parámetro ownerId que envíe el cliente.
     * Siempre se filtra por el userId del usuario autenticado.
     *
     * ¿Por qué ignorar el parámetro en vez de validarlo?
     *   - Validar (if ownerId != userId → 403) revelaría que el parámetro
     *     existe y es un vector de ataque potencial (information disclosure).
     *   - Ignorar es más seguro: el atacante ni siquiera sabe que el
     *     parámetro tiene efecto. Principio de mínima sorpresa.
     *   - En REST puro, GET /accounts debería devolver "mis cuentas" sin
     *     necesidad de filtro explícito.
     */
    @GetMapping("/fixed/accounts")
    public ResponseEntity<?> searchAccountsFixed(
            @RequestParam(required = false) Long ownerId, // Se acepta pero se IGNORA
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            HttpServletRequest request) {

        if (userId == null) {
            return ResponseEntity.status(401).body("Se requiere autenticación (cabecera X-User-Id)");
        }

        // --- CORRECCIÓN: Siempre usar el userId autenticado, NUNCA el parámetro ---
        // Aunque el cliente envíe ?ownerId=1 siendo el usuario 2,
        // este endpoint devuelve solo las cuentas del usuario 2.
        List<Account> accounts = accountRepository.findByOwnerId(userId);

        // Oráculo: si se intentó buscar con un ownerId diferente, registrarlo
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
