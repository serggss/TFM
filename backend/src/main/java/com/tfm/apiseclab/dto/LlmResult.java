package com.tfm.apiseclab.dto;

public record LlmResult(
    String response,
    boolean injectionSucceeded,
    String analysis,
    String promptSent
) {}
