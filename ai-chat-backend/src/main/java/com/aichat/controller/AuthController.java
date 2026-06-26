package com.aichat.controller;

import com.aichat.dto.LoginRequest;
import com.aichat.dto.RegisterRequest;
import com.aichat.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Object register(@Valid @RequestBody RegisterRequest req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public Object login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }
}
