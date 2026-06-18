package com.tfm.apiseclab.service.fingerprint;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
public class HeaderSignatureAnalyzer {

    public record ToolSignature(
        String name,
        List<String> typicalHeaderOrder,
        Set<String> requiredHeaders,
        Set<String> absentHeaders,
        Set<String> telltaleHeaders,
        Map<String, String> typicalValues
    ) {}

    private static final List<ToolSignature> KNOWN_SIGNATURES = List.of(
        new ToolSignature("curl",
            List.of("host", "user-agent", "accept"),
            Set.of("host", "user-agent", "accept"),
            Set.of("sec-fetch-mode", "sec-fetch-site", "accept-language", "postman-token"),
            Set.of(),
            Map.of()),

        new ToolSignature("postman",
            List.of("user-agent", "accept", "cache-control", "postman-token", "host", "accept-encoding", "connection"),
            Set.of("postman-token"),
            Set.of("sec-fetch-mode", "sec-fetch-site"),
            Set.of("postman-token"),
            Map.of()),

        new ToolSignature("insomnia",
            List.of("host", "user-agent", "accept"),
            Set.of("user-agent"),
            Set.of("sec-fetch-mode", "postman-token"),
            Set.of(),
            Map.of()),

        new ToolSignature("chrome",
            List.of("host", "connection", "sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform",
                     "upgrade-insecure-requests", "user-agent", "accept", "sec-fetch-site",
                     "sec-fetch-mode", "sec-fetch-user", "sec-fetch-dest", "accept-encoding", "accept-language"),
            Set.of("sec-ch-ua", "sec-fetch-mode", "sec-fetch-site"),
            Set.of("postman-token"),
            Set.of("sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform"),
            Map.of()),

        new ToolSignature("firefox",
            List.of("host", "user-agent", "accept", "accept-language", "accept-encoding", "connection",
                     "upgrade-insecure-requests", "sec-fetch-dest", "sec-fetch-mode", "sec-fetch-site", "sec-fetch-user"),
            Set.of("sec-fetch-mode", "accept-language"),
            Set.of("sec-ch-ua", "postman-token"),
            Set.of(),
            Map.of()),

        new ToolSignature("python-requests",
            List.of("host", "user-agent", "accept-encoding", "accept", "connection"),
            Set.of("user-agent", "accept-encoding"),
            Set.of("sec-fetch-mode", "sec-ch-ua", "postman-token", "accept-language"),
            Set.of(),
            Map.of()),

        new ToolSignature("sqlmap",
            List.of("host", "cache-control", "user-agent", "accept", "accept-encoding"),
            Set.of("cache-control"),
            Set.of("sec-fetch-mode", "postman-token", "accept-language"),
            Set.of(),
            Map.of("cache-control", "no-cache")),

        new ToolSignature("burp-suite",
            List.of("host", "user-agent", "accept", "accept-language", "accept-encoding", "connection"),
            Set.of("user-agent", "accept"),
            Set.of("sec-ch-ua", "postman-token"),
            Set.of(),
            Map.of()),

        new ToolSignature("owasp-zap",
            List.of("host", "user-agent", "accept", "accept-language", "accept-encoding"),
            Set.of("user-agent"),
            Set.of("sec-ch-ua", "postman-token"),
            Set.of(),
            Map.of()),

        new ToolSignature("httpie",
            List.of("host", "user-agent", "accept-encoding", "accept", "connection"),
            Set.of("user-agent"),
            Set.of("sec-fetch-mode", "postman-token"),
            Set.of(),
            Map.of()),

        new ToolSignature("wget",
            List.of("user-agent", "accept", "host", "connection"),
            Set.of("user-agent", "accept"),
            Set.of("sec-fetch-mode", "postman-token", "accept-language", "accept-encoding"),
            Set.of(),
            Map.of()),

        new ToolSignature("go-http",
            List.of("host", "user-agent", "accept-encoding"),
            Set.of("user-agent"),
            Set.of("sec-fetch-mode", "postman-token", "accept-language", "accept"),
            Set.of(),
            Map.of()),

        new ToolSignature("axios",
            List.of("accept", "user-agent", "accept-encoding", "host", "connection"),
            Set.of("accept"),
            Set.of("sec-fetch-mode", "postman-token"),
            Set.of(),
            Map.of("accept", "application/json, text/plain, */*")),

        new ToolSignature("node-fetch",
            List.of("host", "accept", "accept-encoding", "connection", "user-agent"),
            Set.of(),
            Set.of("sec-fetch-mode", "postman-token", "accept-language"),
            Set.of(),
            Map.of())
    );

    public record HeaderResult(
        Map<String, Double> toolScores,
        String bestMatch,
        double bestScore,
        List<String> reasons,
        String headerOrder,
        int headerCount,
        Set<String> telltaleHeadersFound,
        boolean spoofSuspected
    ) {}

    public HeaderResult analyze(HttpServletRequest request) {
        List<String> headerNames = Collections.list(request.getHeaderNames()).stream()
                .map(String::toLowerCase).toList();
        Set<String> headerSet = new HashSet<>(headerNames);
        Map<String, String> headerValues = new HashMap<>();
        for (String h : headerNames) {
            headerValues.put(h, request.getHeader(h));
        }

        Map<String, Double> scores = new LinkedHashMap<>();
        List<String> reasons = new ArrayList<>();
        Set<String> telltaleFound = new HashSet<>();

        for (ToolSignature sig : KNOWN_SIGNATURES) {
            double score = computeScore(headerNames, headerSet, headerValues, sig);
            scores.put(sig.name(), score);

            for (String t : sig.telltaleHeaders()) {
                if (headerSet.contains(t)) {
                    telltaleFound.add(t + " → " + sig.name());
                }
            }
        }

        String bestMatch = scores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("desconocido");
        double bestScore = scores.getOrDefault(bestMatch, 0.0);

        if (bestScore > 0.6) {
            reasons.add(String.format("Firma de cabeceras coincide con %s (Jaccard=%.2f)", bestMatch, bestScore));
        }
        if (!telltaleFound.isEmpty()) {
            reasons.add("Cabeceras delatorias: " + telltaleFound);
        }

        boolean spoofSuspected = detectSpoof(headerSet, headerValues);
        if (spoofSuspected) {
            reasons.add("User-Agent dice ser navegador pero faltan cabeceras Sec-Fetch-* → posible suplantación");
        }

        String headerOrder = String.join(", ", headerNames);
        return new HeaderResult(scores, bestMatch, bestScore, reasons, headerOrder,
                headerNames.size(), telltaleFound, spoofSuspected);
    }

    private double computeScore(List<String> observedOrder, Set<String> observedSet,
                                Map<String, String> values, ToolSignature sig) {
        double jaccardScore = jaccardSimilarity(observedSet, new HashSet<>(sig.typicalHeaderOrder()));

        double orderScore = orderSimilarity(observedOrder, sig.typicalHeaderOrder());

        double presenceScore = 1.0;
        for (String req : sig.requiredHeaders()) {
            if (!observedSet.contains(req)) presenceScore -= (1.0 / sig.requiredHeaders().size());
        }
        presenceScore = Math.max(0, presenceScore);

        double absenceScore = 1.0;
        for (String abs : sig.absentHeaders()) {
            if (observedSet.contains(abs)) absenceScore -= (1.0 / sig.absentHeaders().size());
        }
        absenceScore = Math.max(0, absenceScore);

        double telltaleScore = 0.0;
        if (!sig.telltaleHeaders().isEmpty()) {
            long found = sig.telltaleHeaders().stream().filter(observedSet::contains).count();
            telltaleScore = (double) found / sig.telltaleHeaders().size();
        }

        double valueScore = 1.0;
        if (!sig.typicalValues().isEmpty()) {
            int matches = 0;
            for (Map.Entry<String, String> e : sig.typicalValues().entrySet()) {
                String actual = values.get(e.getKey());
                if (actual != null && actual.contains(e.getValue())) matches++;
            }
            valueScore = (double) matches / sig.typicalValues().size();
        }

        return jaccardScore * 0.25
             + orderScore * 0.20
             + presenceScore * 0.15
             + absenceScore * 0.15
             + telltaleScore * 0.15
             + valueScore * 0.10;
    }

    private double jaccardSimilarity(Set<String> a, Set<String> b) {
        if (a.isEmpty() && b.isEmpty()) return 1.0;
        Set<String> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        Set<String> union = new HashSet<>(a);
        union.addAll(b);
        return union.isEmpty() ? 0 : (double) intersection.size() / union.size();
    }

    private double orderSimilarity(List<String> observed, List<String> expected) {
        if (expected.isEmpty() || observed.isEmpty()) return 0;
        List<String> common = observed.stream().filter(expected::contains).toList();
        if (common.size() < 2) return 0;

        int concordant = 0;
        int total = 0;
        for (int i = 0; i < common.size(); i++) {
            for (int j = i + 1; j < common.size(); j++) {
                int obsI = observed.indexOf(common.get(i));
                int obsJ = observed.indexOf(common.get(j));
                int expI = expected.indexOf(common.get(i));
                int expJ = expected.indexOf(common.get(j));
                if ((obsI < obsJ) == (expI < expJ)) concordant++;
                total++;
            }
        }
        return total == 0 ? 0 : (double) concordant / total;
    }

    private boolean detectSpoof(Set<String> headers, Map<String, String> values) {
        String ua = values.getOrDefault("user-agent", "").toLowerCase();
        boolean claimsBrowser = ua.contains("mozilla") || ua.contains("chrome") || ua.contains("safari");
        boolean hasSecFetch = headers.contains("sec-fetch-mode") || headers.contains("sec-fetch-site");
        boolean hasSecCh = headers.contains("sec-ch-ua");
        return claimsBrowser && !hasSecFetch && !hasSecCh;
    }

    public List<Map<String, Object>> getKnownSignatures() {
        return KNOWN_SIGNATURES.stream().map(sig -> Map.<String, Object>of(
                "name", sig.name(),
                "headerOrder", sig.typicalHeaderOrder(),
                "requiredHeaders", sig.requiredHeaders(),
                "absentHeaders", sig.absentHeaders(),
                "telltaleHeaders", sig.telltaleHeaders()
        )).toList();
    }
}
