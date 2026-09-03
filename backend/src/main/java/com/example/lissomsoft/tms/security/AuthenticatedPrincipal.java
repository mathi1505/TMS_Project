package com.example.lissomsoft.tms.security;

public record AuthenticatedPrincipal(String userId, Integer userNo, String userName, String role) {
}
