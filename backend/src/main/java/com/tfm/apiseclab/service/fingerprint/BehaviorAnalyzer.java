package com.tfm.apiseclab.service.fingerprint;

import com.tfm.apiseclab.model.SecurityEvent;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class BehaviorAnalyzer {

    public record BehaviorResult(
        boolean sequentialScanDetected,
        List<Integer> idsAccessed,
        int uniqueEndpoints,
        int uniqueVulnerabilities,
        int uniqueStates,
        double attackSuccessRate,
        int totalAttacks,
        int successfulAttacks,
        String classification,
        List<String> reasons
    ) {}

    private static final Pattern ID_PATTERN = Pattern.compile("/accounts/(\\d+)");

    public BehaviorResult analyze(List<SecurityEvent> sessionEvents) {
        List<String> reasons = new ArrayList<>();

        Set<String> endpoints = sessionEvents.stream()
                .map(SecurityEvent::getEndpoint).collect(Collectors.toSet());
        Set<String> vulns = sessionEvents.stream()
                .map(SecurityEvent::getVulnerability).collect(Collectors.toSet());
        Set<String> states = sessionEvents.stream()
                .map(SecurityEvent::getState).collect(Collectors.toSet());

        long attacks = sessionEvents.stream().filter(SecurityEvent::isAttackSuccess).count();
        double attackRate = sessionEvents.isEmpty() ? 0 : (double) attacks / sessionEvents.size();

        List<Integer> ids = sessionEvents.stream()
                .map(e -> {
                    Matcher m = ID_PATTERN.matcher(e.getEndpoint());
                    return m.find() ? Integer.parseInt(m.group(1)) : null;
                })
                .filter(Objects::nonNull)
                .toList();

        boolean sequential = detectSequentialScan(ids);

        if (sequential) {
            reasons.add("Escaneo secuencial de IDs detectado (" + ids + ") → enumeración automática de IDOR");
        }

        if (vulns.size() >= 3) {
            reasons.add(String.format("%d vulnerabilidades distintas → reconocimiento amplio del sistema", vulns.size()));
        }

        if (states.size() == 3) {
            reasons.add("Visitó los 3 estados (vulnerable/partial/fixed) → exploración sistemática");
        }

        if (attackRate > 0.7 && sessionEvents.size() > 3) {
            reasons.add(String.format("Tasa de ataques exitosos=%.0f%% → ataque dirigido y efectivo", attackRate * 100));
        } else if (attackRate < 0.2 && sessionEvents.size() > 5) {
            reasons.add(String.format("Tasa de ataques exitosos=%.0f%% con %d peticiones → posible fuzzing", attackRate * 100, sessionEvents.size()));
        }

        if (endpoints.size() > 8) {
            reasons.add(String.format("%d endpoints distintos → reconocimiento exhaustivo", endpoints.size()));
        }

        String classification;
        if (sequential && sessionEvents.size() > 5) {
            classification = "escáner automatizado";
        } else if (vulns.size() >= 3 && states.size() == 3) {
            classification = "exploración pedagógica";
        } else if (attackRate > 0.6) {
            classification = "ataque dirigido";
        } else if (endpoints.size() > 6) {
            classification = "reconocimiento";
        } else {
            classification = "uso normal";
        }

        return new BehaviorResult(
            sequential, ids, endpoints.size(), vulns.size(), states.size(),
            attackRate, sessionEvents.size(), (int) attacks,
            classification, reasons
        );
    }

    private boolean detectSequentialScan(List<Integer> ids) {
        if (ids.size() < 3) return false;

        int sequentialCount = 0;
        for (int i = 1; i < ids.size(); i++) {
            if (ids.get(i) == ids.get(i - 1) + 1) {
                sequentialCount++;
            }
        }
        return sequentialCount >= 2;
    }
}
