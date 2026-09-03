package com.example.lissomsoft.tms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "app_user")
@IdClass(UserId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;
    @Id
    @Column(name = "user_no", nullable = false)
    private Integer userNo;

    @Column(name = "user_name", length = 25, nullable = false)
    private String userName;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(name = "role", length = 20, nullable = false)
    private String role;

    @Column(name = "created_by", length = 25)
    private String createdBy;

    @Column(name = "created_date")
    private LocalDate createdDate;

    @Column(name = "del_flg", length = 1, nullable = false)
    private String delFlg = "A";
}
