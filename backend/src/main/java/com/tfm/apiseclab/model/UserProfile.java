package com.tfm.apiseclab.model;

import jakarta.persistence.*;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    private String email;
    private String bio;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private Double balance;

    @Column(nullable = false)
    private Boolean verified;

    @Column(nullable = false)
    private Double discount;

    public UserProfile() {}

    public UserProfile(String username, String password, String name, String email,
                       String bio, String role, Double balance, Boolean verified, Double discount) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.email = email;
        this.bio = bio;
        this.role = role;
        this.balance = balance;
        this.verified = verified;
        this.discount = discount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Double getBalance() { return balance; }
    public void setBalance(Double balance) { this.balance = balance; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }
}
