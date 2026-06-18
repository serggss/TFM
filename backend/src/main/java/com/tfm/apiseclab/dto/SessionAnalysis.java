package com.tfm.apiseclab.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SessionAnalysis(
    String sessionKey,
    String sourceIp,
    String userAgent,
    int requestCount,
    Instant firstSeen,
    Instant lastSeen,
    FingerprintAnalysis fingerprint,
    Map<String, Integer> endpointsVisited,
    Map<String, Integer> statesVisited,
    Map<String, Integer> vulnerabilitiesTargeted,
    int attackSuccessCount,
    int attackBlockedCount
) {}
