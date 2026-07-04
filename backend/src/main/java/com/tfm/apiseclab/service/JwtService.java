package com.tfm.apiseclab.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class JwtService {

    private static final String SECRET = "api-sec-lab-jwt-secret-key-2026-tfm";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRATION_MS = 3600_000;
    private static final String ISSUER = "api-sec-lab";

    private static final String WEAK_SECRET = "weak-secret-key-please-change-me";
    private static final SecretKey WEAK_KEY = Keys.hmacShaKeyFor(WEAK_SECRET.getBytes(StandardCharsets.UTF_8));

    private static final Pattern JSON_PAIR = Pattern.compile("\"([^\"]+)\"\\s*:\\s*(?:\"([^\"]*)\"|([\\d.]+)|([a-z]+))");

    public String generateToken(Long userId, String username, String role) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .claim("role", role)
                .issuer(ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(KEY)
                .compact();
    }

    public String generateWeakKeyToken(Long userId, String username, String role) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .claim("role", role)
                .issuer(ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(WEAK_KEY)
                .compact();
    }

    public String generateExpiredToken(Long userId, String username, String role) {
        Date issuedAt = new Date(System.currentTimeMillis() - 7_200_000L);
        Date expiration = new Date(System.currentTimeMillis() - 3_600_000L);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .claim("role", role)
                .issuer(ISSUER)
                .issuedAt(issuedAt)
                .expiration(expiration)
                .signWith(KEY)
                .compact();
    }

    public Map<String, Object> parseVulnerable(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length < 2) throw new IllegalArgumentException("Token inválido");
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        return parseJson(payload);
    }

    public Map<String, Object> parsePartialAlgNone(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length < 2) throw new IllegalArgumentException("Token inválido");

        String header = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        Map<String, Object> headerMap = parseJson(header);
        String alg = String.valueOf(headerMap.get("alg"));

        if ("none".equalsIgnoreCase(alg)) {
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            return parseJson(payload);
        }

        Claims claims = Jwts.parser().verifyWith(KEY).build().parseSignedClaims(token).getPayload();
        return claimsToMap(claims);
    }

    public Map<String, Object> parsePartialWeakKey(String token) throws Exception {
        Claims claims = Jwts.parser().verifyWith(WEAK_KEY).build().parseSignedClaims(token).getPayload();
        return claimsToMap(claims);
    }

    public Map<String, Object> parsePartialNoExp(String token) throws Exception {
        try {
            Claims claims = Jwts.parser().verifyWith(KEY).build().parseSignedClaims(token).getPayload();
            return claimsToMap(claims);
        } catch (ExpiredJwtException e) {
            return claimsToMap(e.getClaims());
        }
    }

    public Map<String, Object> parseFixed(String token) throws Exception {
        Claims claims = Jwts.parser()
                .verifyWith(KEY)
                .requireIssuer(ISSUER)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (claims.getExpiration().before(new Date())) {
            throw new IllegalArgumentException("Token expirado");
        }

        return claimsToMap(claims);
    }

    public String forgeAlgNoneToken(Long userId, String username, String role) {
        String header = Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
        String payloadJson = String.format(
                "{\"sub\":\"%d\",\"username\":\"%s\",\"role\":\"%s\"}", userId, username, role);
        String payload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
        return header + "." + payload + ".";
    }

    private Map<String, Object> claimsToMap(Claims claims) {
        return Map.of(
                "sub", claims.getSubject(),
                "username", String.valueOf(claims.getOrDefault("username", "unknown")),
                "role", String.valueOf(claims.getOrDefault("role", "user"))
        );
    }

    private Map<String, Object> parseJson(String json) {
        Map<String, Object> result = new HashMap<>();
        Matcher m = JSON_PAIR.matcher(json);
        while (m.find()) {
            String key = m.group(1);
            if (m.group(2) != null) result.put(key, m.group(2));
            else if (m.group(3) != null) result.put(key, m.group(3));
            else if (m.group(4) != null) result.put(key, m.group(4));
        }
        return result;
    }
}
