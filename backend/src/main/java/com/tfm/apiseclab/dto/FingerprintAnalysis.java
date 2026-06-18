package com.tfm.apiseclab.dto;

import java.util.List;
import java.util.Map;

public record FingerprintAnalysis(
    String tool,
    double confidence,
    List<String> reasons,
    Map<String, Double> toolScores,
    Map<String, Object> headerAnalysis,
    Map<String, Object> timingAnalysis,
    Map<String, Object> behaviorAnalysis,
    boolean spoofDetected
) {}
