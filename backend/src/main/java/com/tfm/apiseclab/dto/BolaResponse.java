package com.tfm.apiseclab.dto;

import com.tfm.apiseclab.model.Account;

/**
 * DTO (Data Transfer Object) que envuelve la respuesta de los endpoints BOLA.
 *
 * Incluye dos partes:
 *   - data: los datos de la cuenta solicitada.
 *   - oracle: el veredicto del oráculo de verificación.
 *
 * ¿Por qué un wrapper y no devolver la entidad directamente?
 *   1. El oráculo es fundamental para la experiencia pedagógica: el estudiante
 *      ve inmediatamente si el ataque tuvo éxito o no, sin tener que interpretar
 *      el HTTP status code.
 *   2. Separar data de oracle evita contaminar la entidad Account con campos
 *      que no son parte del modelo de dominio.
 *   3. En un sistema real, la información del oráculo NO existiría (sería una
 *      ventaja para el atacante). Aquí se incluye explícitamente porque estamos
 *      en un contexto educativo.
 *
 * Se usa un record de Java (disponible desde Java 16, estable en 21) porque
 * es inmutable, conciso y genera automáticamente constructor, getters,
 * equals, hashCode y toString. Perfecto para un DTO sin lógica.
 */
public record BolaResponse(

    /** Datos de la cuenta bancaria solicitada. */
    Account data,

    /** Resultado del oráculo de verificación. */
    OracleResult oracle

) {}
