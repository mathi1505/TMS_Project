package com.example.lissomsoft.tms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_log")
@IdClass(ActivityLogId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityLog {

    @Id
    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Id
    @Column(name = "user_no", nullable = false)
    private Integer userNo;

    @Column(name = "user_name", length = 25)
    private String userName;

    @Id
    @Column(name = "login_date_time", nullable = false)
    private LocalDateTime loginDateTime;

    /** Success / Failed / Logout / Locked */
    @Column(name = "login_status", length = 24, nullable = false)
    private String loginStatus;


    @Column(name = "activity_info", length = 500)
    private String activityInfo;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "logout_date_time")
    private LocalDateTime logoutDateTime;
}
