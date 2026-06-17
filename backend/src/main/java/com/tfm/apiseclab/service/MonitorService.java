package com.tfm.apiseclab.service;

import com.tfm.apiseclab.model.SecurityEvent;
import com.tfm.apiseclab.repository.SecurityEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Servicio central de la capa de observación del laboratorio.
 *
 * Responsabilidades:
 *   1. Registrar cada petición sospechosa como un SecurityEvent.
 *   2. Realizar un fingerprinting básico del cliente atacante.
 *   3. Proporcionar consultas para el frontend (panel de monitorización).
 *
 * DISEÑO: Este servicio actúa como "SIEM simplificado" (Security Information
 * and Event Management). En un sistema real se usaría ELK, Splunk o similar.
 * Aquí se implementa en memoria para mantener el laboratorio autocontenido.
 *
 * El fingerprinting se basa inicialmente solo en el User-Agent. En la Semana 3
 * se ampliará con análisis de orden de cabeceras y patrones de timing, que es
 * la segunda contribución del TFM.
 */
@Service
public class MonitorService {

    private final SecurityEventRepository eventRepository;

    /**
     * Inyección por constructor (recomendada sobre @Autowired en campo).
     * Ventajas: inmutabilidad, testabilidad, fallo rápido si falta la dependencia.
     */
    public MonitorService(SecurityEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /**
     * Registra un evento de seguridad en el monitor.
     *
     * Se llama desde cada controlador de vulnerabilidad después de procesar
     * la petición. El controlador aporta los datos específicos de la
     * vulnerabilidad (estado, veredicto del oráculo) y este servicio
     * complementa con la información de la petición HTTP (IP, User-Agent,
     * fingerprint).
     *
     * @param vulnerability Nombre de la vulnerabilidad (ej: "BOLA").
     * @param state         Estado del endpoint ("vulnerable", "partial", "fixed").
     * @param attackSuccess true si el oráculo determinó que el ataque tuvo éxito.
     * @param description   Descripción legible del evento.
     * @param request       Petición HTTP original (para extraer IP, cabeceras, etc.).
     */
    public void recordEvent(String vulnerability, String state, boolean attackSuccess,
                            String description, HttpServletRequest request) {

        SecurityEvent event = new SecurityEvent();
        event.setVulnerability(vulnerability);
        event.setState(state);
        event.setAttackSuccess(attackSuccess);
        event.setDescription(description);

        // --- Datos de la petición HTTP ---
        event.setEndpoint(request.getRequestURI());
        event.setMethod(request.getMethod());

        // IP: en desarrollo local siempre será 127.0.0.1 o 0:0:0:0:0:0:0:1.
        // En Docker, será la IP del contenedor. Se registra igualmente para
        // mantener la coherencia con un sistema real.
        event.setSourceIp(request.getRemoteAddr());

        // User-Agent: primera línea de fingerprinting.
        // Herramientas comunes y sus User-Agents típicos:
        //   - curl: "curl/8.x.x"
        //   - Postman: "PostmanRuntime/7.x.x"
        //   - sqlmap: "sqlmap/1.x.x"
        //   - Burp Suite: "Mozilla/5.0 ..." (simula un navegador)
        //   - Navegador real: "Mozilla/5.0 ..." (difícil de distinguir de Burp)
        String userAgent = request.getHeader("User-Agent");
        event.setUserAgent(userAgent);

        // Fingerprint básico: clasifica el cliente por su User-Agent.
        // En Semana 3 se sofisticará con orden de cabeceras y timing.
        event.setClientFingerprint(fingerprintClient(userAgent));

        eventRepository.save(event);
    }

    /**
     * Fingerprinting básico basado en User-Agent.
     *
     * Clasifica la herramienta atacante en categorías conocidas.
     * Es deliberadamente simple: el objetivo es tener una base funcional
     * que se pueda ampliar en la Semana 3.
     *
     * @param userAgent cabecera User-Agent del cliente.
     * @return nombre de la herramienta detectada o "unknown".
     */
    private String fingerprintClient(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            // Sin User-Agent: podría ser un script básico o una herramienta
            // que no envía esta cabecera. Es sospechoso por sí mismo.
            return "no-user-agent";
        }

        String ua = userAgent.toLowerCase();

        // Orden de comprobación: de más específico a más genérico.
        // Las herramientas de pentesting suelen identificarse claramente.
        if (ua.contains("sqlmap"))       return "sqlmap";
        if (ua.contains("nikto"))        return "nikto";
        if (ua.contains("nmap"))         return "nmap";
        if (ua.contains("burp"))         return "burp-suite";
        if (ua.contains("zap"))          return "owasp-zap";
        if (ua.contains("postman"))      return "postman";
        if (ua.contains("insomnia"))     return "insomnia";
        if (ua.contains("curl"))         return "curl";
        if (ua.contains("httpie"))       return "httpie";
        if (ua.contains("python"))       return "python-script";
        if (ua.contains("axios"))        return "axios";
        if (ua.contains("node"))         return "node-fetch";

        // Si contiene Mozilla pero no es ninguna herramienta conocida,
        // asumimos que es un navegador (o algo que lo simula).
        if (ua.contains("mozilla"))      return "browser";

        return "unknown";
    }

    // =========================================================================
    // Consultas para el frontend
    // =========================================================================

    /** Todos los eventos, ordenados del más reciente al más antiguo. */
    public List<SecurityEvent> getAllEvents() {
        return eventRepository.findAllByOrderByTimestampDesc();
    }

    /** Eventos filtrados por vulnerabilidad. */
    public List<SecurityEvent> getEventsByVulnerability(String vulnerability) {
        return eventRepository.findByVulnerabilityOrderByTimestampDesc(vulnerability);
    }

    /** Eventos filtrados por estado. */
    public List<SecurityEvent> getEventsByState(String state) {
        return eventRepository.findByStateOrderByTimestampDesc(state);
    }

    public void clearAll() {
        eventRepository.deleteAll();
    }
}
