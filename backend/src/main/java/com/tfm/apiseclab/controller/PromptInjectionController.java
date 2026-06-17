package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.LlmResult;
import com.tfm.apiseclab.dto.OracleResult;
import com.tfm.apiseclab.service.MockLlmService;
import com.tfm.apiseclab.service.MonitorService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/prompt-injection")
public class PromptInjectionController {

    private final MockLlmService llmService;
    private final MonitorService monitorService;

    public PromptInjectionController(MockLlmService llmService, MonitorService monitorService) {
        this.llmService = llmService;
        this.monitorService = monitorService;
    }

    @PostMapping("/vulnerable/summarize")
    public ResponseEntity<?> summarizeVulnerable(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String text = body.getOrDefault("text", "");
        LlmResult result = llmService.processVulnerable(text);

        OracleResult oracle = new OracleResult(
                "vulnerable", null, null, true,
                result.injectionSucceeded() ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("PROMPT_INJECTION", "vulnerable", result.injectionSucceeded(),
                result.analysis(), request);

        return ResponseEntity.ok(Map.of(
                "llmResponse", result.response(),
                "analysis", result.analysis(),
                "promptSent", result.promptSent(),
                "oracle", oracle
        ));
    }

    @PostMapping("/partial/summarize")
    public ResponseEntity<?> summarizePartial(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String text = body.getOrDefault("text", "");
        LlmResult result = llmService.processPartial(text);

        OracleResult oracle = new OracleResult(
                "partial", null, null, true,
                result.injectionSucceeded() ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("PROMPT_INJECTION", "partial", result.injectionSucceeded(),
                result.analysis(), request);

        return ResponseEntity.ok(Map.of(
                "llmResponse", result.response(),
                "analysis", result.analysis(),
                "promptSent", result.promptSent(),
                "oracle", oracle
        ));
    }

    @PostMapping("/fixed/summarize")
    public ResponseEntity<?> summarizeFixed(
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {

        String text = body.getOrDefault("text", "");
        LlmResult result = llmService.processFixed(text);

        OracleResult oracle = new OracleResult(
                "fixed", null, null, true,
                result.injectionSucceeded() ? "ATTACK_SUCCESS" : "LEGITIMATE_ACCESS"
        );

        monitorService.recordEvent("PROMPT_INJECTION", "fixed", result.injectionSucceeded(),
                result.analysis(), request);

        return ResponseEntity.ok(Map.of(
                "llmResponse", result.response(),
                "analysis", result.analysis(),
                "promptSent", result.promptSent(),
                "oracle", oracle
        ));
    }
}
