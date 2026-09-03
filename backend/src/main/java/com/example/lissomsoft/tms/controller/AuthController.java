package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.dto.CurrentUser;
import com.example.lissomsoft.tms.dto.LoginRequest;
import com.example.lissomsoft.tms.dto.LoginResponse;
import com.example.lissomsoft.tms.security.AuthenticatedPrincipal;
import com.example.lissomsoft.tms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public CurrentUser me(Authentication authentication) {
        AuthenticatedPrincipal principal = (AuthenticatedPrincipal) authentication.getPrincipal();
        return new CurrentUser(principal.userId(), principal.userNo(), principal.userName(), principal.role());
    }
}
