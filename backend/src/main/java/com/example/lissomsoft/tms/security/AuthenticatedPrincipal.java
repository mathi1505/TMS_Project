package com.example.lissomsoft.tms.security;

public record AuthenticatedPrincipal(String username, Role role) {
}
