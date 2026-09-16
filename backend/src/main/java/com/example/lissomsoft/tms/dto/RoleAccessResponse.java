package com.example.lissomsoft.tms.dto;

import java.util.List;

public record RoleAccessResponse(String role, boolean fullAccess, List<String> screenCodes) {
}
