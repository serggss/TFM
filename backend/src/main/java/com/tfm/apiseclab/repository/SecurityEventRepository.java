package com.tfm.apiseclab.repository;

import com.tfm.apiseclab.model.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio para los eventos de seguridad del monitor.
 *
 * Permite consultar el historial de eventos por diferentes criterios:
 *   - Por vulnerabilidad: ver todos los intentos contra BOLA, JWT, etc.
 *   - Por estado: comparar ataques en vulnerable vs. partial vs. fixed.
 *   - Todos ordenados por timestamp: vista cronológica en el frontend.
 *
 * Estos métodos alimentan el MonitorController, que expone la API
 * para el panel de observación del frontend.
 */
@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, Long> {

    /** Eventos de una vulnerabilidad concreta, ordenados del más reciente al más antiguo. */
    List<SecurityEvent> findByVulnerabilityOrderByTimestampDesc(String vulnerability);

    /** Eventos de un estado concreto (para comparar "vulnerable" vs "fixed"). */
    List<SecurityEvent> findByStateOrderByTimestampDesc(String state);

    /** Todos los eventos, del más reciente al más antiguo (vista general). */
    List<SecurityEvent> findAllByOrderByTimestampDesc();
}
