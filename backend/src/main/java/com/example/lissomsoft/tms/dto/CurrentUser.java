package com.example.lissomsoft.tms.dto;


public record CurrentUser(
    String userId,
    Integer userNo,
    String userName,
    String role
) {
}
