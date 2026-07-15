package com.tfm.apiseclab.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private String vulnerability;

    @Column(nullable = false)
    private String state;

    @Column(nullable = false)
    private String endpoint;

    @Column(nullable = false)
    private String method;

    @Column
    private String sourceIp;

    @Column(length = 500)
    private String userAgent;

    @Column
    private String clientFingerprint;

    @Column(nullable = false)
    private boolean attackSuccess;

    @Column(length = 1000)
    private String description;

    @Column(length = 2000)
    private String headerOrderSignature;

    @Column
    private Long requestIntervalMs;

    public SecurityEvent() {
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getVulnerability() { return vulnerability; }
    public void setVulnerability(String vulnerability) { this.vulnerability = vulnerability; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }

    public String getSourceIp() { return sourceIp; }
    public void setSourceIp(String sourceIp) { this.sourceIp = sourceIp; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public String getClientFingerprint() { return clientFingerprint; }
    public void setClientFingerprint(String clientFingerprint) { this.clientFingerprint = clientFingerprint; }

    public boolean isAttackSuccess() { return attackSuccess; }
    public void setAttackSuccess(boolean attackSuccess) { this.attackSuccess = attackSuccess; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getHeaderOrderSignature() { return headerOrderSignature; }
    public void setHeaderOrderSignature(String headerOrderSignature) { this.headerOrderSignature = headerOrderSignature; }

    public Long getRequestIntervalMs() { return requestIntervalMs; }
    public void setRequestIntervalMs(Long requestIntervalMs) { this.requestIntervalMs = requestIntervalMs; }
}
