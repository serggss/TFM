package com.tfm.apiseclab.service;

import com.tfm.apiseclab.dto.FingerprintAnalysis;
import com.tfm.apiseclab.dto.SessionAnalysis;
import com.tfm.apiseclab.model.SecurityEvent;
import com.tfm.apiseclab.repository.SecurityEventRepository;
import com.tfm.apiseclab.service.fingerprint.FingerprintClassifier;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MonitorService {

    private final SecurityEventRepository eventRepository;
    private final FingerprintClassifier classifier;

    public MonitorService(SecurityEventRepository eventRepository,
                          FingerprintClassifier classifier) {
        this.eventRepository = eventRepository;
        this.classifier = classifier;
    }

    public void recordEvent(String vulnerability, String state, boolean attackSuccess,
                            String description, HttpServletRequest request) {

        SecurityEvent event = new SecurityEvent();
        event.setVulnerability(vulnerability);
        event.setState(state);
        event.setAttackSuccess(attackSuccess);
        event.setDescription(description);
        event.setEndpoint(request.getRequestURI());
        event.setMethod(request.getMethod());
        event.setSourceIp(request.getRemoteAddr());
        event.setUserAgent(request.getHeader("User-Agent"));

        String headerOrder = Collections.list(request.getHeaderNames()).stream()
                .map(String::toLowerCase).collect(Collectors.joining(", "));
        event.setHeaderOrderSignature(headerOrder);

        String sessionKey = buildSessionKey(request);
        List<SecurityEvent> sessionEvents = getEventsBySessionKey(sessionKey);
        if (!sessionEvents.isEmpty()) {
            long intervalMs = Duration.between(sessionEvents.get(0).getTimestamp(), Instant.now()).toMillis();
            event.setRequestIntervalMs(intervalMs);
        }

        FingerprintAnalysis analysis = classifier.classifyRequest(request);
        event.setClientFingerprint(String.format("%s|confianza=%.0f%%|cabeceras=%d",
                analysis.tool(), analysis.confidence() * 100, headerOrder.split(",").length));

        eventRepository.save(event);
    }

    public String buildSessionKey(HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String ua = request.getHeader("User-Agent");
        return Objects.hash(ip, ua) + "-" + (ip != null ? ip.replace(":", "") : "noip");
    }

    private String sessionKeyFromEvent(SecurityEvent e) {
        return Objects.hash(e.getSourceIp(), e.getUserAgent())
               + "-" + (e.getSourceIp() != null ? e.getSourceIp().replace(":", "") : "noip");
    }

    public List<SecurityEvent> getEventsBySessionKey(String sessionKey) {
        return eventRepository.findAllByOrderByTimestampDesc().stream()
                .filter(e -> sessionKeyFromEvent(e).equals(sessionKey)).toList();
    }

    public List<SessionAnalysis> getSessions() {
        List<SecurityEvent> all = eventRepository.findAllByOrderByTimestampDesc();
        Map<String, List<SecurityEvent>> grouped = new LinkedHashMap<>();
        for (SecurityEvent e : all) {
            grouped.computeIfAbsent(sessionKeyFromEvent(e), k -> new ArrayList<>()).add(e);
        }

        List<SessionAnalysis> sessions = new ArrayList<>();
        for (var entry : grouped.entrySet()) {
            List<SecurityEvent> events = entry.getValue();
            SecurityEvent oldest = events.get(events.size() - 1);
            SecurityEvent newest = events.get(0);

            FingerprintAnalysis fp = classifier.classifySession(null, events);

            Map<String, Integer> endpoints = new HashMap<>();
            Map<String, Integer> states = new HashMap<>();
            Map<String, Integer> vulns = new HashMap<>();
            int success = 0, blocked = 0;
            for (SecurityEvent e : events) {
                endpoints.merge(e.getEndpoint(), 1, Integer::sum);
                states.merge(e.getState(), 1, Integer::sum);
                vulns.merge(e.getVulnerability(), 1, Integer::sum);
                if (e.isAttackSuccess()) success++; else blocked++;
            }

            sessions.add(new SessionAnalysis(entry.getKey(), oldest.getSourceIp(),
                    oldest.getUserAgent(), events.size(), oldest.getTimestamp(),
                    newest.getTimestamp(), fp, endpoints, states, vulns, success, blocked));
        }
        return sessions;
    }

    public SessionAnalysis getSessionByKey(String sessionKey) {
        return getSessions().stream()
                .filter(s -> s.sessionKey().equals(sessionKey))
                .findFirst().orElse(null);
    }

    public List<SecurityEvent> getAllEvents() {
        return eventRepository.findAllByOrderByTimestampDesc();
    }

    public List<SecurityEvent> getEventsByVulnerability(String vulnerability) {
        return eventRepository.findByVulnerabilityOrderByTimestampDesc(vulnerability);
    }

    public List<SecurityEvent> getEventsByState(String state) {
        return eventRepository.findByStateOrderByTimestampDesc(state);
    }

    public void clearAll() { eventRepository.deleteAll(); }

    public Map<String, Object> getStats() {
        List<SecurityEvent> all = eventRepository.findAll();
        long total = all.size();
        long attacks = all.stream().filter(SecurityEvent::isAttackSuccess).count();
        return Map.of(
                "totalEvents", total,
                "totalAttacks", attacks,
                "successRate", total > 0 ? Math.round(attacks * 100.0 / total) : 0,
                "byVulnerability", all.stream().collect(Collectors.groupingBy(SecurityEvent::getVulnerability, Collectors.counting())),
                "byState", all.stream().collect(Collectors.groupingBy(SecurityEvent::getState, Collectors.counting())),
                "attacksByVulnerability", all.stream().filter(SecurityEvent::isAttackSuccess).collect(Collectors.groupingBy(SecurityEvent::getVulnerability, Collectors.counting())),
                "byClientTool", all.stream().map(e -> e.getClientFingerprint() != null ? e.getClientFingerprint().split("\\|")[0] : "desconocido").collect(Collectors.groupingBy(f -> f, Collectors.counting()))
        );
    }

    public Map<String, Object> getProgress() {
        List<SecurityEvent> all = eventRepository.findAll();
        Map<String, Set<String>> byVuln = new HashMap<>();
        for (SecurityEvent e : all) byVuln.computeIfAbsent(e.getVulnerability(), k -> new HashSet<>()).add(e.getState());
        Map<String, Object> result = new HashMap<>();
        for (var entry : byVuln.entrySet()) {
            Set<String> s = entry.getValue();
            result.put(entry.getKey(), Map.of("statesTried", s, "status", s.size() >= 3 ? "completed" : "in_progress", "progress", s.size() + "/3"));
        }
        return Map.of("vulnerabilities", result);
    }

    public FingerprintClassifier getClassifier() { return classifier; }
}
