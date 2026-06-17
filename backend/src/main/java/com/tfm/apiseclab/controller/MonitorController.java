package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.model.SecurityEvent;
import com.tfm.apiseclab.service.MonitorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API REST de la capa de observación (monitor de eventos de seguridad).
 *
 * Expone endpoints para que el frontend consulte los eventos registrados
 * durante las interacciones con el laboratorio. Es el "panel de control"
 * del SIEM simplificado.
 *
 * Estos endpoints NO generan eventos de seguridad (sería recursivo y
 * contaminaría el log). Solo los endpoints de vulnerabilidades generan eventos.
 *
 * Rutas disponibles:
 *   GET /api/monitor/events                       → todos los eventos
 *   GET /api/monitor/events?vulnerability=BOLA    → filtrar por vulnerabilidad
 *   GET /api/monitor/events?state=partial          → filtrar por estado
 *   DELETE /api/monitor/events                     → limpiar el historial (útil para demos)
 */
@RestController
@RequestMapping("/api/monitor")
public class MonitorController {

    private final MonitorService monitorService;

    public MonitorController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    /**
     * GET /api/monitor/events
     *
     * Devuelve los eventos de seguridad, opcionalmente filtrados.
     * Si no se pasa ningún filtro, devuelve todos los eventos.
     *
     * El frontend usa esto para mostrar la tabla de eventos en tiempo real
     * (bueno, casi real — polling cada pocos segundos).
     */
    @GetMapping("/events")
    public ResponseEntity<List<SecurityEvent>> getEvents(
            @RequestParam(required = false) String vulnerability,
            @RequestParam(required = false) String state) {

        List<SecurityEvent> events;

        if (vulnerability != null && !vulnerability.isBlank()) {
            // Filtrar por vulnerabilidad (ej: "BOLA", "JWT")
            events = monitorService.getEventsByVulnerability(vulnerability);
        } else if (state != null && !state.isBlank()) {
            // Filtrar por estado (ej: "vulnerable", "partial", "fixed")
            events = monitorService.getEventsByState(state);
        } else {
            // Sin filtro: todos los eventos
            events = monitorService.getAllEvents();
        }

        return ResponseEntity.ok(events);
    }

    @DeleteMapping("/events")
    public ResponseEntity<String> clearEvents() {
        monitorService.clearAll();
        return ResponseEntity.ok("Eventos eliminados");
    }
}
