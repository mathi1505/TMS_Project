package com.example.lissomsoft.tms.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLogId implements Serializable {
    private String userId;
    private Integer userNo;
    private LocalDateTime loginDateTime;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ActivityLogId that)) return false;
        return Objects.equals(userId, that.userId)
                && Objects.equals(userNo, that.userNo)
                && Objects.equals(loginDateTime, that.loginDateTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, userNo, loginDateTime);
    }
}
