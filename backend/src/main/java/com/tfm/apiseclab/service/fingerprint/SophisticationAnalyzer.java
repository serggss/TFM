package com.tfm.apiseclab.service.fingerprint;

import com.tfm.apiseclab.model.SecurityEvent;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class SophisticationAnalyzer {

    public record SophisticationResult(
        int level,
        String label,
        double score,
        List<String> evidence,
        Map<String, StateProgression> progressionByVuln,
        List<EurekaMoment> eurekas
    ) {}

    public record StateProgression(
        boolean triedVulnerable,
        boolean triedPartial,
        boolean exploitedPartialBypass,
        boolean triedFixed,
        String maxStateReached
    ) {}

    public record EurekaMoment(
        String vulnerability,
        long timestampMs,
        String description,
        int blockedAttemptsBefore,
        long timeToDiscoverMs,
        String fromEndpoint,
        String toEndpoint
    ) {}

    public SophisticationResult analyze(List<SecurityEvent> sessionEvents) {
        if (sessionEvents.isEmpty()) {
            return new SophisticationResult(0, "sin datos", 0, List.of(), Map.of(), List.of());
        }

        List<SecurityEvent> sorted = sessionEvents.stream()
                .sorted(Comparator.comparing(SecurityEvent::getTimestamp))
                .toList();

        Map<String, List<SecurityEvent>> byVuln = sorted.stream()
                .collect(Collectors.groupingBy(SecurityEvent::getVulnerability, LinkedHashMap::new, Collectors.toList()));

        Map<String, StateProgression> progressions = new LinkedHashMap<>();
        List<EurekaMoment> eurekas = new ArrayList<>();
        List<String> evidence = new ArrayList<>();

        double totalScore = 0;
        int vulnCount = 0;

        for (var entry : byVuln.entrySet()) {
            String vuln = entry.getKey();
            List<SecurityEvent> events = entry.getValue();

            Set<String> statesTried = events.stream().map(SecurityEvent::getState).collect(Collectors.toSet());
            boolean triedVuln = statesTried.contains("vulnerable");
            boolean triedPartial = statesTried.contains("partial");
            boolean triedFixed = statesTried.contains("fixed");

            boolean exploitedBypass = events.stream()
                    .anyMatch(e -> "partial".equals(e.getState()) && e.isAttackSuccess());

            String maxState = "ninguno";
            if (triedFixed) maxState = "fixed";
            else if (triedPartial) maxState = "partial";
            else if (triedVuln) maxState = "vulnerable";

            progressions.put(vuln, new StateProgression(triedVuln, triedPartial, exploitedBypass, triedFixed, maxState));

            double vulnScore = 0;
            if (triedVuln) vulnScore += 0.2;
            if (triedPartial) vulnScore += 0.3;
            if (exploitedBypass) vulnScore += 0.3;
            if (triedFixed) vulnScore += 0.2;

            totalScore += vulnScore;
            vulnCount++;

            if (triedVuln && !triedPartial) {
                evidence.add(String.format("%s: solo explotó estado vulnerable → nivel bajo", vuln));
            }
            if (exploitedBypass) {
                evidence.add(String.format("%s: descubrió el bypass del estado partial → nivel medio-alto", vuln));
            }
            if (triedFixed && !exploitedBypass) {
                evidence.add(String.format("%s: intentó fixed sin encontrar bypass de partial → exploración sin metodología", vuln));
            }

            EurekaMoment eureka = detectEureka(vuln, events);
            if (eureka != null) {
                eurekas.add(eureka);
                evidence.add(String.format("%s: momento eureka detectado — %d intentos fallidos antes del bypass, descubierto en %dms",
                        vuln, eureka.blockedAttemptsBefore(), eureka.timeToDiscoverMs()));
            }
        }

        double avgScore = vulnCount > 0 ? totalScore / vulnCount : 0;

        if (byVuln.size() > 1) {
            avgScore += 0.05 * (byVuln.size() - 1);
            evidence.add(String.format("Atacó %d vulnerabilidades distintas → reconocimiento amplio (+%.0f%% al score)",
                    byVuln.size(), 5.0 * (byVuln.size() - 1)));
        }

        if (!eurekas.isEmpty()) {
            avgScore += 0.1;
            evidence.add(String.format("%d momento(s) eureka detectado(s) → capacidad de adaptación demostrada (+10%%)", eurekas.size()));
        }

        avgScore = Math.min(avgScore, 1.0);

        int level;
        String label;
        if (avgScore >= 0.75) { level = 4; label = "avanzado"; }
        else if (avgScore >= 0.50) { level = 3; label = "intermedio-alto"; }
        else if (avgScore >= 0.30) { level = 2; label = "intermedio"; }
        else if (avgScore > 0) { level = 1; label = "básico"; }
        else { level = 0; label = "sin actividad"; }

        evidence.add(0, String.format("Score global: %.0f%% → Nivel %d (%s)", avgScore * 100, level, label));

        return new SophisticationResult(level, label, avgScore, evidence, progressions, eurekas);
    }

    private EurekaMoment detectEureka(String vuln, List<SecurityEvent> events) {
        List<SecurityEvent> partialEvents = events.stream()
                .filter(e -> "partial".equals(e.getState()))
                .sorted(Comparator.comparing(SecurityEvent::getTimestamp))
                .toList();

        if (partialEvents.size() < 2) return null;

        int blockedCount = 0;
        SecurityEvent firstBlocked = null;

        for (SecurityEvent event : partialEvents) {
            if (!event.isAttackSuccess()) {
                blockedCount++;
                if (firstBlocked == null) firstBlocked = event;
            } else if (blockedCount > 0 && firstBlocked != null) {
                long timeToDiscover = Duration.between(firstBlocked.getTimestamp(), event.getTimestamp()).toMillis();

                return new EurekaMoment(
                    vuln,
                    event.getTimestamp().toEpochMilli(),
                    String.format("Tras %d intento(s) bloqueado(s), cambió de estrategia y encontró el bypass", blockedCount),
                    blockedCount,
                    timeToDiscover,
                    firstBlocked.getEndpoint(),
                    event.getEndpoint()
                );
            }
        }

        return null;
    }
}
