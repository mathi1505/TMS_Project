package com.example.lissomsoft.tms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserUpsertRequest(
    @NotBlank String userName,

    String password,

    @NotBlank String role,

    String studentId,
    Integer studentNo,
    String delFlg
) {
}
