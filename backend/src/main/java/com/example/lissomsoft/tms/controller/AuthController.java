package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.dto.ChangePasswordRequest;
import com.example.lissomsoft.tms.dto.CurrentUser;
import com.example.lissomsoft.tms.dto.LoginRequest;
import com.example.lissomsoft.tms.dto.LoginResponse;
import com.example.lissomsoft.tms.security.AuthenticatedPrincipal;
import com.example.lissomsoft.tms.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    @NoActivityAudit
    public CurrentUser me(Authentication authentication) {
        AuthenticatedPrincipal principal = (AuthenticatedPrincipal) authentication.getPrincipal();
        return new CurrentUser(principal.userId(), principal.userNo(), principal.userName(), principal.role());
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        AuthenticatedPrincipal principal = (AuthenticatedPrincipal) authentication.getPrincipal();
        authService.changePassword(principal.userId(), principal.userNo(), request);
    }

    /**
     * Stamps Logout_date_time on the caller's activity_log row. The
     * session id is the one returned in LoginResponse at login time.
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestParam String sessionId) {
        authService.logout(sessionId);
    }
}
