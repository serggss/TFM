package com.tfm.apiseclab.model;

import jakarta.persistence.*;

/**
 * Entidad que representa una cuenta bancaria simplificada.
 *
 * Se usa como recurso protegido para demostrar BOLA/IDOR (API1:2023):
 * cada cuenta pertenece a un usuario (ownerId), y la vulnerabilidad
 * consiste en que un usuario pueda acceder a la cuenta de OTRO usuario
 * manipulando el identificador en la petición.
 *
 * ¿Por qué un modelo bancario?
 *   1. Es intuitivo: todo el mundo entiende que no debes ver la cuenta de otro.
 *   2. El impacto es obvio: datos financieros → alta severidad.
 *   3. Es el ejemplo canónico en la documentación de OWASP API1:2023.
 *   4. Permite datos de prueba sencillos (nombre, IBAN, saldo) que se
 *      entienden sin contexto adicional.
 *
 * Los campos se mantienen simples a propósito. En un sistema real habría
 * relaciones más complejas, pero aquí la prioridad es la claridad pedagógica.
 */
@Entity
@Table(name = "accounts")
public class Account {

    /** Identificador auto-generado. Es el valor que se manipula en un ataque IDOR. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID del usuario propietario de esta cuenta.
     * En Semana 1 se corresponde con el valor de la cabecera X-User-Id.
     * En Semana 2 se extraerá del claim 'sub' del JWT.
     */
    @Column(nullable = false)
    private Long ownerId;

    /** Nombre del propietario (para mostrar en la UI de la demo). */
    @Column(nullable = false)
    private String ownerName;

    /** Email del propietario — dato sensible que no debería ser accesible a otros. */
    @Column(nullable = false)
    private String email;

    /** IBAN — dato especialmente sensible (permite transferencias). */
    @Column(nullable = false)
    private String iban;

    /** Saldo actual de la cuenta. */
    @Column(nullable = false)
    private Double balance;

    // =========================================================================
    // Constructores
    // =========================================================================

    /** Constructor vacío — requerido por JPA/Hibernate para la reflexión. */
    public Account() {
    }

    /**
     * Constructor completo para crear datos semilla en el DataInitializer.
     * No incluye 'id' porque lo genera la BD automáticamente.
     */
    public Account(Long ownerId, String ownerName, String email,
                   String iban, Double balance) {
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.email = email;
        this.iban = iban;
        this.balance = balance;
    }

    // =========================================================================
    // Getters y Setters
    // =========================================================================
    // JPA necesita los setters para hidratar la entidad desde la BD.
    // Jackson (serialización JSON) necesita los getters para generar la respuesta.

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getIban() { return iban; }
    public void setIban(String iban) { this.iban = iban; }

    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }
}
