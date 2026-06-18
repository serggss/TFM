package com.tfm.apiseclab.service.fingerprint;

import com.tfm.apiseclab.model.SecurityEvent;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.*;

@Component
public class TimingAnalyzer {

    public record TimingResult(
        double meanIntervalMs,
        double stdDevMs,
        double coefficientOfVariation,
        int burstCount,
        int totalIntervals,
        String pattern,
        List<String> reasons
    ) {}

    private static final long BURST_THRESHOLD_MS = 500;
    private static final int BURST_MIN_REQUESTS = 3;
    private static final double CV_AUTOMATED_THRESHOLD = 0.3;
    private static final double CV_HUMAN_THRESHOLD = 0.8;

    public TimingResult analyze(List<SecurityEvent> sessionEvents) {
        List<String> reasons = new ArrayList<>();

        if (sessionEvents.size() < 2) {
            return new TimingResult(0, 0, 0, 0, 0, "insuficiente", List.of("Menos de 2 peticiones, análisis no posible"));
        }

        List<SecurityEvent> sorted = sessionEvents.stream()
                .sorted(Comparator.comparing(SecurityEvent::getTimestamp))
                .toList();

        List<Long> intervals = new ArrayList<>();
        for (int i = 1; i < sorted.size(); i++) {
            long ms = Duration.between(sorted.get(i - 1).getTimestamp(), sorted.get(i).getTimestamp()).toMillis();
            intervals.add(ms);
        }

        double mean = intervals.stream().mapToLong(Long::longValue).average().orElse(0);
        double variance = intervals.stream().mapToDouble(v -> Math.pow(v - mean, 2)).average().orElse(0);
        double stdDev = Math.sqrt(variance);
        double cv = mean > 0 ? stdDev / mean : 0;

        int burstCount = 0;
        int consecutive = 1;
        for (long interval : intervals) {
            if (interval < BURST_THRESHOLD_MS) {
                consecutive++;
                if (consecutive >= BURST_MIN_REQUESTS) burstCount++;
            } else {
                consecutive = 1;
            }
        }

        boolean highVolume = sessionEvents.size() > 20;
        boolean manyBursts = burstCount > 2;
        boolean fastAverage = mean < 3000 && sessionEvents.size() > 20;

        String pattern;
        if (highVolume && manyBursts) {
            pattern = "automatizado";
            reasons.add(String.format("Volumen alto (%d peticiones) con %d ráfagas → escáner multi-hilo (CV=%.2f alto por mezcla de fases rápidas y pausas)",
                    sessionEvents.size(), burstCount, cv));
        } else if (fastAverage) {
            pattern = "automatizado";
            reasons.add(String.format("Intervalo medio=%.0fms con %d peticiones → velocidad no humana", mean, sessionEvents.size()));
        } else if (cv < CV_AUTOMATED_THRESHOLD) {
            pattern = "automatizado";
            reasons.add(String.format("CV=%.2f (< %.1f) → intervalos muy regulares, típico de herramienta automatizada", cv, CV_AUTOMATED_THRESHOLD));
        } else if (cv > CV_HUMAN_THRESHOLD && !highVolume) {
            pattern = "manual";
            reasons.add(String.format("CV=%.2f (> %.1f) con pocas peticiones → interacción humana", cv, CV_HUMAN_THRESHOLD));
        } else {
            pattern = "semi-automatizado";
            reasons.add(String.format("CV=%.2f → patrón mixto (herramienta con pausas o humano con scripts)", cv));
        }

        if (burstCount > 0) {
            reasons.add(String.format("%d ráfaga(s) detectada(s) (>%d peticiones en <%dms)", burstCount, BURST_MIN_REQUESTS, BURST_THRESHOLD_MS));
        }

        if (mean < 1000 && sessionEvents.size() > 5) {
            reasons.add(String.format("Intervalo medio=%.0fms con %d peticiones", mean, sessionEvents.size()));
        }

        return new TimingResult(mean, stdDev, cv, burstCount, intervals.size(), pattern, reasons);
    }
}
