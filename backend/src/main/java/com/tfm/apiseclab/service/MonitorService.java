package com.tfm.apiseclab.service;

import com.tfm.apiseclab.model.SecurityEvent;
import com.tfm.apiseclab.repository.SecurityEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MonitorService {

    private final SecurityEventRepository eventRepository;

    public MonitorService(SecurityEventRepository eventRepository) {
        this.eventRepository = eventRepository;
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

        String userAgent = request.getHeader("User-Agent");
        event.setUserAgent(userAgent);

        String headerOrder = extractHeaderOrder(request);
        int headerCount = Collections.list(request.getHeaderNames()).size();
        String toolGuess = fingerprintClient(userAgent);
        event.setClientFingerprint(String.format("%s|headers=%d|order_hash=%d",
                toolGuess, headerCount, headerOrder.hashCode()));

        eventRepository.save(event);
    }

    private String extractHeaderOrder(HttpServletRequest request) {
        return Collections.list(request.getHeaderNames()).stream()
                .map(String::toLowerCase)
                .collect(Collectors.joining(","));
    }

    private String fingerprintClient(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "no-user-agent";

        String ua = userAgent.toLowerCase();

        if (ua.contains("sqlmap"))       return "sqlmap";
        if (ua.contains("nikto"))        return "nikto";
        if (ua.contains("nmap"))         return "nmap";
        if (ua.contains("burp"))         return "burp-suite";
        if (ua.contains("zap"))          return "owasp-zap";
        if (ua.contains("postman"))      return "postman";
        if (ua.contains("insomnia"))     return "insomnia";
        if (ua.contains("curl"))         return "curl";
        if (ua.contains("httpie"))       return "httpie";
        if (ua.contains("python"))       return "python-script";
        if (ua.contains("axios"))        return "axios";
        if (ua.contains("node"))         return "node-fetch";
        if (ua.contains("mozilla"))      return "browser";

        return "unknown";
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

    public void clearAll() {
        eventRepository.deleteAll();
    }

    public Map<String, Object> getStats() {
        List<SecurityEvent> all = eventRepository.findAll();
        long totalEvents = all.size();
        long totalAttacks = all.stream().filter(SecurityEvent::isAttackSuccess).count();

        Map<String, Long> byVuln = all.stream()
                .collect(Collectors.groupingBy(SecurityEvent::getVulnerability, Collectors.counting()));

        Map<String, Long> byState = all.stream()
                .collect(Collectors.groupingBy(SecurityEvent::getState, Collectors.counting()));

        Map<String, Long> attacksByVuln = all.stream()
                .filter(SecurityEvent::isAttackSuccess)
                .collect(Collectors.groupingBy(SecurityEvent::getVulnerability, Collectors.counting()));

        Map<String, Long> byFingerprint = all.stream()
                .map(e -> e.getClientFingerprint() != null ? e.getClientFingerprint().split("\\|")[0] : "unknown")
                .collect(Collectors.groupingBy(f -> f, Collectors.counting()));

        return Map.of(
                "totalEvents", totalEvents,
                "totalAttacks", totalAttacks,
                "successRate", totalEvents > 0 ? Math.round(totalAttacks * 100.0 / totalEvents) : 0,
                "byVulnerability", byVuln,
                "byState", byState,
                "attacksByVulnerability", attacksByVuln,
                "byClientTool", byFingerprint
        );
    }
}
