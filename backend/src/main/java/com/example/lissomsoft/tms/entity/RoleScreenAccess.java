package com.example.lissomsoft.tms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;


@Entity
@Table(name = "role_screen_access")
@IdClass(RoleScreenAccessId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleScreenAccess {

    @Id
    @Column(name = "role", length = 20, nullable = false)
    private String role;

    @Id
    @Column(name = "screen_code", length = 20, nullable = false)
    private String screenCode;

    @Column(name = "entry_by", length = 25)
    private String entryBy;

    @Column(name = "entry_date")
    private LocalDate entryDate;
}
