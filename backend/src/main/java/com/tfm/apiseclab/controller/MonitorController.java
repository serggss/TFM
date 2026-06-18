package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.SessionAnalysis;
import com.tfm.apiseclab.model.SecurityEvent;
import com.tfm.apiseclab.service.MonitorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monitor")
public class MonitorController {

    private final MonitorService monitorService;

    public MonitorController(MonitorService monitorService) {
        this.monitorService = monitorService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<SecurityEvent>> getEvents(
            @RequestParam(required = false) String vulnerability,
            @RequestParam(required = false) String state) {

        List<SecurityEvent> events;
        if (vulnerability != null && !vulnerability.isBlank()) {
            events = monitorService.getEventsByVulnerability(vulnerability);
        } else if (state != null && !state.isBlank()) {
            events = monitorService.getEventsByState(state);
        } else {
            events = monitorService.getAllEvents();
        }
        return ResponseEntity.ok(events);
    }

    @PostMapping("/events/clear")
    public ResponseEntity<String> clearEvents() {
        monitorService.clearAll();
        return ResponseEntity.ok("Eventos eliminados");
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(monitorService.getStats());
    }

    @GetMapping("/progress")
    public ResponseEntity<Map<String, Object>> getProgress() {
        return ResponseEntity.ok(monitorService.getProgress());
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionAnalysis>> getSessions() {
        return ResponseEntity.ok(monitorService.getSessions());
    }

    @GetMapping("/sessions/{sessionKey}")
    public ResponseEntity<?> getSession(@PathVariable String sessionKey) {
        SessionAnalysis session = monitorService.getSessionByKey(sessionKey);
        if (session == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(session);
    }

    @GetMapping("/signatures")
    public ResponseEntity<?> getKnownSignatures() {
        return ResponseEntity.ok(monitorService.getClassifier().getHeaderAnalyzer().getKnownSignatures());
    }
}
