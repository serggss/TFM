package com.tfm.apiseclab.dto;

public record LoginResponse(String token, Long userId, String username, String role) {}
