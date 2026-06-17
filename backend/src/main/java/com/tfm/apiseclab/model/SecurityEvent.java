package com.tfm.apiseclab.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entidad que representa un evento de seguridad registrado por el monitor.
 *
 * Cada petición a un endpoint del laboratorio genera un SecurityEvent que captura:
 *   - QUÉ se solicitó (endpoint, vulnerabilidad, estado).
 *   - QUIÉN lo solicitó (IP, User-Agent, fingerprint de cabeceras).
 *   - QUÉ PASÓ (si el oráculo determinó que el ataque tuvo éxito o no).
 *
 * Esta entidad es la base de la capa de observación del laboratorio y conecta
 * directamente con varias categorías OWASP:
 *   - A09:2025 (Security Logging & Monitoring Failures): un sistema real debería
 *     registrar estos eventos para detectar ataques en curso.
 *   - La segunda contribución del TFM (fingerprinting de herramientas atacantes)
 *     se apoya en los campos userAgent y clientFingerprint.
 *
 * NOTA: El fingerprinting avanzado (análisis de orden de cabeceras, timing, etc.)
 * se implementará en la Semana 3. Por ahora se registra el User-Agent tal cual
 * y un fingerprint básico calculado en MonitorService.
 */
@Entity
@Table(name = "security_events")
public class SecurityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Momento exacto en que se registró el evento (UTC). */
    @Column(nullable = false)
    private Instant timestamp;

    /** Nombre corto de la vulnerabilidad (ej: "BOLA", "JWT", "CORS"). */
    @Column(nullable = false)
    private String vulnerability;

    /**
     * Estado del endpoint cuando se recibió la petición.
     * Valores posibles: "vulnerable", "partial", "fixed".
     */
    @Column(nullable = false)
    private String state;

    /** Ruta completa del endpoint solicitado (ej: "/api/bola/vulnerable/accounts/3"). */
    @Column(nullable = false)
    private String endpoint;

    /** Método HTTP utilizado (GET, POST, PUT, DELETE). */
    @Column(nullable = false)
    private String method;

    /** Dirección IP de origen del cliente. */
    @Column
    private String sourceIp;

    /**
     * Cabecera User-Agent tal como la envía el cliente.
     * Es el campo más básico para identificar la herramienta atacante
     * (curl, Postman, sqlmap, Burp Suite, navegador, etc.).
     * Se almacena completo para análisis posterior.
     */
    @Column(length = 500)
    private String userAgent;

    /**
     * Fingerprint calculado del cliente atacante.
     * En Semana 1 es simplemente el User-Agent parseado.
     * En Semana 3 incorporará orden de cabeceras y patrones de timing.
     */
    @Column
    private String clientFingerprint;

    /**
     * Veredicto del oráculo: true si el ataque tuvo éxito.
     * El oráculo determina si la petición logró acceder a un recurso
     * que no le corresponde (BOLA), usar un token manipulado (JWT), etc.
     */
    @Column(nullable = false)
    private boolean attackSuccess;

    /** Descripción legible de lo que ocurrió, para mostrar en el frontend. */
    @Column(length = 1000)
    private String description;

    // =========================================================================
    // Constructores
    // =========================================================================

    /** Constructor vacío para JPA. Inicializa el timestamp al momento actual. */
    public SecurityEvent() {
        this.timestamp = Instant.now();
    }

    // =========================================================================
    // Getters y Setters
    // =========================================================================

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
}
