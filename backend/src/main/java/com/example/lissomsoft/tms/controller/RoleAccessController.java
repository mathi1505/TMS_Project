package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.dto.RoleAccessResponse;
import com.example.lissomsoft.tms.dto.RoleAccessSaveRequest;
import com.example.lissomsoft.tms.dto.RoleOption;
import com.example.lissomsoft.tms.dto.ScreenDefinition;
import com.example.lissomsoft.tms.security.AuthenticatedPrincipal;
import com.example.lissomsoft.tms.service.RoleAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/role-access")
@RequiredArgsConstructor
public class RoleAccessController {

    private final RoleAccessService service;


    @GetMapping("/screens")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ScreenDefinition> screens() {
        return service.getScreens();
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RoleOption> roles() {
        return service.getRoles();
    }

    @GetMapping("/my-screens")
    @NoActivityAudit
    public List<String> myScreens(Authentication authentication) {
        AuthenticatedPrincipal principal = (AuthenticatedPrincipal) authentication.getPrincipal();
        return service.getAccessForRole(principal.role());
    }

    @GetMapping("/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public RoleAccessResponse getForRole(@PathVariable String role) {
        String normalized = role.trim().toUpperCase();
        return new RoleAccessResponse(normalized, "ADMIN".equals(normalized), service.getAccessForRole(role));
    }

    @PutMapping("/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public RoleAccessResponse save(@PathVariable String role, @RequestBody RoleAccessSaveRequest request) {
        String normalized = role.trim().toUpperCase();
        List<String> saved = service.saveAccessForRole(role, request.screenCodes());
        return new RoleAccessResponse(normalized, false, saved);
    }
}
