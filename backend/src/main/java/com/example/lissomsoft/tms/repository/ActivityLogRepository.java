package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.ActivityLog;
import com.example.lissomsoft.tms.entity.ActivityLogId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, ActivityLogId> {

    List<ActivityLog> findByUserIdAndUserNoOrderByLoginDateTimeDesc(String userId, Integer userNo);

    List<ActivityLog> findBySessionId(String sessionId);


    Optional<ActivityLog> findFirstBySessionIdOrderByLoginDateTimeDesc(String sessionId);

    List<ActivityLog> findByLoginDateTimeBetweenOrderByLoginDateTimeDesc(LocalDateTime from, LocalDateTime to);

    List<ActivityLog> findByLoginStatus(String loginStatus);
}
