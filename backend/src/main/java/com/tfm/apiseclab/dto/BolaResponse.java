package com.tfm.apiseclab.dto;

import com.tfm.apiseclab.model.Account;

public record BolaResponse(
    Account data,
    OracleResult oracle
) {}
