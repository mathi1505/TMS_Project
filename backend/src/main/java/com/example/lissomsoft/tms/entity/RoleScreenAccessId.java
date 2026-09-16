package com.example.lissomsoft.tms.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleScreenAccessId implements Serializable {
    private String role;
    private String screenCode;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RoleScreenAccessId that)) return false;
        return Objects.equals(role, that.role) && Objects.equals(screenCode, that.screenCode);
    }

    @Override
    public int hashCode() {
        return Objects.hash(role, screenCode);
    }
}
