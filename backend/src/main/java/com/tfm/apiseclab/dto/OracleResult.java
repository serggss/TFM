package com.tfm.apiseclab.dto;

/**
 * Resultado del oráculo de verificación para un intento de ataque.
 *
 * El "oráculo" es un concepto de testing de seguridad: es la función que
 * determina automáticamente si un ataque tuvo éxito o no. En nuestro caso:
 *
 *   - Compara el usuario autenticado (authenticatedUserId) con el propietario
 *     del recurso solicitado (resourceOwnerId).
 *   - Si son diferentes Y el acceso fue concedido → ATTACK_SUCCESS.
 *   - Si son diferentes Y el acceso fue denegado → ATTACK_BLOCKED.
 *   - Si son iguales → LEGITIMATE_ACCESS (no es un ataque).
 *
 * Posibles valores de 'verdict':
 *   - "ATTACK_SUCCESS"   → el atacante accedió a un recurso ajeno (mal).
 *   - "ATTACK_BLOCKED"   → el control de acceso funcionó (bien).
 *   - "LEGITIMATE_ACCESS" → el usuario accedió a su propio recurso (neutral).
 *   - "UNAUTHENTICATED"  → no se proporcionó identidad (depende del estado).
 *
 * Este resultado se muestra en el frontend y se registra en el monitor
 * para análisis posterior.
 */
public record OracleResult(

    /** Estado del endpoint ("vulnerable", "partial", "fixed"). */
    String state,

    /** ID del usuario que hizo la petición (extraído de X-User-Id o JWT). */
    Long authenticatedUserId,

    /** ID del propietario real del recurso solicitado. */
    Long resourceOwnerId,

    /** true si el servidor devolvió los datos (acceso concedido). */
    boolean accessGranted,

    /** Veredicto legible del oráculo. */
    String verdict

) {}
