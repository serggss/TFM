package com.tfm.apiseclab.service.fingerprint;

import com.tfm.apiseclab.dto.FingerprintAnalysis;
import com.tfm.apiseclab.model.SecurityEvent;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FingerprintClassifier {

    private static final double WEIGHT_HEADER = 0.40;
    private static final double WEIGHT_UA = 0.25;
    private static final double WEIGHT_TIMING = 0.20;
    private static final double WEIGHT_BEHAVIOR = 0.15;

    private final HeaderSignatureAnalyzer headerAnalyzer;
    private final TimingAnalyzer timingAnalyzer;
    private final BehaviorAnalyzer behaviorAnalyzer;

    public FingerprintClassifier(HeaderSignatureAnalyzer headerAnalyzer,
                                  TimingAnalyzer timingAnalyzer,
                                  BehaviorAnalyzer behaviorAnalyzer) {
        this.headerAnalyzer = headerAnalyzer;
        this.timingAnalyzer = timingAnalyzer;
        this.behaviorAnalyzer = behaviorAnalyzer;
    }

    public FingerprintAnalysis classifyRequest(HttpServletRequest request) {
        String referer = request.getHeader("Referer");
        String host = request.getHeader("Host");
        if (isLabUiRequest(referer, host)) {
            return new FingerprintAnalysis(
                "lab-ui",
                0.95,
                List.of("Referer apunta a la propia interfaz del laboratorio → uso manual desde el navegador"),
                Map.of("lab-ui", 0.95),
                Map.of("referer", referer != null ? referer : ""),
                Map.of(),
                Map.of(),
                false
            );
        }

        HeaderSignatureAnalyzer.HeaderResult headerResult = headerAnalyzer.analyze(request);

        String uaTool = classifyUserAgent(request.getHeader("User-Agent"));

        List<String> allReasons = new ArrayList<>(headerResult.reasons());
        Map<String, Double> toolScores = new LinkedHashMap<>(headerResult.toolScores());

        if (headerResult.spoofSuspected()) {
            allReasons.add("UA-spoof: User-Agent dice navegador pero las cabeceras no corresponden");
        }

        double headerConfidence = headerResult.bestScore();
        double uaConfidence = uaTool.equals(headerResult.bestMatch()) ? 0.9 : 0.5;

        double combinedConfidence = headerConfidence * WEIGHT_HEADER + uaConfidence * WEIGHT_UA;
        double maxPossible = WEIGHT_HEADER + WEIGHT_UA;
        combinedConfidence = combinedConfidence / maxPossible;

        String finalTool = headerConfidence > 0.5 ? headerResult.bestMatch() : uaTool;

        return new FingerprintAnalysis(
            finalTool,
            Math.min(combinedConfidence, 1.0),
            allReasons,
            toolScores,
            Map.of(
                "orden", headerResult.headerOrder(),
                "numCabeceras", headerResult.headerCount(),
                "mejorCoincidencia", headerResult.bestMatch(),
                "puntuacion", headerResult.bestScore(),
                "cabecerasDelatorias", headerResult.telltaleHeadersFound()
            ),
            Map.of(),
            Map.of(),
            headerResult.spoofSuspected()
        );
    }

    public FingerprintAnalysis classifySession(HttpServletRequest currentRequest,
                                                List<SecurityEvent> sessionEvents) {
        FingerprintAnalysis requestAnalysis;
        if (currentRequest != null) {
            requestAnalysis = classifyRequest(currentRequest);
        } else {
            String fp = sessionEvents.isEmpty() ? "" : sessionEvents.get(0).getClientFingerprint();
            String tool = (fp != null && fp.contains("|")) ? fp.split("\\|")[0] : "desconocido";
            requestAnalysis = new FingerprintAnalysis(tool, 0.5, new ArrayList<>(),
                    Map.of(), Map.of(), Map.of(), Map.of(), false);
        }

        TimingAnalyzer.TimingResult timingResult = timingAnalyzer.analyze(sessionEvents);
        BehaviorAnalyzer.BehaviorResult behaviorResult = behaviorAnalyzer.analyze(sessionEvents);

        List<String> allReasons = new ArrayList<>(requestAnalysis.reasons());
        allReasons.addAll(timingResult.reasons());
        allReasons.addAll(behaviorResult.reasons());

        double headerScore = requestAnalysis.confidence();
        double timingScore = computeTimingScore(timingResult);
        double behaviorScore = computeBehaviorScore(behaviorResult);
        double uaScore = requestAnalysis.tool().equals("desconocido") ? 0.3 : 0.7;

        double finalConfidence =
            headerScore * WEIGHT_HEADER +
            uaScore * WEIGHT_UA +
            timingScore * WEIGHT_TIMING +
            behaviorScore * WEIGHT_BEHAVIOR;

        String finalTool = requestAnalysis.tool();
        if (behaviorResult.classification().equals("escáner automatizado") &&
            timingResult.pattern().equals("automatizado")) {
            if (finalTool.equals("browser") || finalTool.equals("desconocido")) {
                finalTool = "escáner-automatizado";
                allReasons.add("Reclasificado: comportamiento y timing indican automatización pese al User-Agent");
            }
        }

        Map<String, Object> timingMap = Map.of(
            "mediaIntervaloMs", timingResult.meanIntervalMs(),
            "desviacionMs", timingResult.stdDevMs(),
            "coeficienteVariacion", timingResult.coefficientOfVariation(),
            "rafagas", timingResult.burstCount(),
            "patron", timingResult.pattern()
        );

        Map<String, Object> behaviorMap = Map.of(
            "escaneoSecuencial", behaviorResult.sequentialScanDetected(),
            "endpointsUnicos", behaviorResult.uniqueEndpoints(),
            "vulnerabilidadesObjetivo", behaviorResult.uniqueVulnerabilities(),
            "estadosVisitados", behaviorResult.uniqueStates(),
            "tasaExitoAtaque", behaviorResult.attackSuccessRate(),
            "clasificacion", behaviorResult.classification()
        );

        return new FingerprintAnalysis(
            finalTool,
            Math.min(finalConfidence, 1.0),
            allReasons,
            requestAnalysis.toolScores(),
            requestAnalysis.headerAnalysis(),
            timingMap,
            behaviorMap,
            requestAnalysis.spoofDetected()
        );
    }

    private double computeTimingScore(TimingAnalyzer.TimingResult timing) {
        if (timing.pattern().equals("insuficiente")) return 0.5;
        if (timing.pattern().equals("automatizado")) return 0.9;
        if (timing.pattern().equals("manual")) return 0.3;
        return 0.6;
    }

    private double computeBehaviorScore(BehaviorAnalyzer.BehaviorResult behavior) {
        double score = 0.5;
        if (behavior.sequentialScanDetected()) score += 0.3;
        if (behavior.uniqueStates() == 3) score += 0.1;
        if (behavior.attackSuccessRate() > 0.7) score += 0.1;
        return Math.min(score, 1.0);
    }

    private String classifyUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "sin-user-agent";
        String ua = userAgent.toLowerCase();
        if (ua.contains("sqlmap"))   return "sqlmap";
        if (ua.contains("nikto"))    return "nikto";
        if (ua.contains("nmap"))     return "nmap";
        if (ua.contains("burp"))     return "burp-suite";
        if (ua.contains("zap"))      return "owasp-zap";
        if (ua.contains("postman"))  return "postman";
        if (ua.contains("insomnia")) return "insomnia";
        if (ua.contains("curl"))     return "curl";
        if (ua.contains("httpie"))   return "httpie";
        if (ua.contains("python"))   return "python-requests";
        if (ua.contains("axios"))    return "axios";
        if (ua.contains("node"))     return "node-fetch";
        if (ua.contains("go-http"))  return "go-http";
        if (ua.contains("wget"))     return "wget";
        if (ua.contains("mozilla"))  return "browser";
        return "desconocido";
    }

    private boolean isLabUiRequest(String referer, String host) {
        if (referer == null || referer.isBlank()) return false;
        if (referer.contains("localhost:5173") || referer.contains("localhost:3000")) return true;
        if (host != null && !host.isBlank()) {
            String hostOnly = host.split(":")[0];
            return referer.contains(hostOnly);
        }
        return false;
    }

    public HeaderSignatureAnalyzer getHeaderAnalyzer() {
        return headerAnalyzer;
    }
}
