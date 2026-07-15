package com.tfm.apiseclab.dto;

public record OracleResult(
    String state,
    Long authenticatedUserId,
    Long resourceOwnerId,
    boolean accessGranted,
    String verdict
) {}
