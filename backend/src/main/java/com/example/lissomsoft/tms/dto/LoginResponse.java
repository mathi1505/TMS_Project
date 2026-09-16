package com.example.lissomsoft.tms.dto;


public record LoginResponse(
    String token,
    String userId,
    Integer userNo,
    String userName,
    String role,
    String sessionId
) {
}
