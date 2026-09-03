package com.example.lissomsoft.tms.dto;

import com.example.lissomsoft.tms.entity.User;

import java.time.LocalDate;

public record UserResponse(
    String userId,
    Integer userNo,
    String userName,
    String role,
    String createdBy,
    LocalDate createdDate,
    String delFlg
) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getUserId(), u.getUserNo(), u.getUserName(), u.getRole(),
                u.getCreatedBy(), u.getCreatedDate(), u.getDelFlg());
    }
}
