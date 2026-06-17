package com.tfm.apiseclab.controller;

import com.tfm.apiseclab.dto.LoginRequest;
import com.tfm.apiseclab.dto.LoginResponse;
import com.tfm.apiseclab.model.UserProfile;
import com.tfm.apiseclab.repository.UserProfileRepository;
import com.tfm.apiseclab.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserProfileRepository userRepository;
    private final JwtService jwtService;

    public AuthController(UserProfileRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var user = userRepository.findByUsername(request.username());
        if (user.isEmpty() || !user.get().getPassword().equals(request.password())) {
            return ResponseEntity.status(401).body("Credenciales inválidas");
        }

        UserProfile u = user.get();
        String token = jwtService.generateToken(u.getId(), u.getUsername(), u.getRole());
        return ResponseEntity.ok(new LoginResponse(token, u.getId(), u.getUsername(), u.getRole()));
    }

    @GetMapping("/forge-none/{userId}")
    public ResponseEntity<?> forgeAlgNone(@PathVariable Long userId) {
        var user = userRepository.findById(userId);
        if (user.isEmpty()) return ResponseEntity.notFound().build();

        UserProfile u = user.get();
        String forged = jwtService.forgeAlgNoneToken(u.getId(), u.getUsername(), "admin");
        return ResponseEntity.ok(java.util.Map.of(
                "forgedToken", forged,
                "description", "Token con alg=none y role=admin (sin firma)"
        ));
    }
}
