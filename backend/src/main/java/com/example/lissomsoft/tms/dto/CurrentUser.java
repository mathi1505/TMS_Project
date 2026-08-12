package com.example.lissomsoft.tms.dto;

import com.example.lissomsoft.tms.security.Role;

public record CurrentUser(String username, Role role) {
}
