package com.example.lissomsoft.tms.dto;

import com.example.lissomsoft.tms.security.Role;

public record LoginResponse(
    String token,
    String username,
    String fullName,
    Role role
) {
}
