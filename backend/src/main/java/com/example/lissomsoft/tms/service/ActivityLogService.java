package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.audit.ActivityDiffUtil;
import com.example.lissomsoft.tms.entity.ActivityLog;
import com.example.lissomsoft.tms.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private static final int ACTIVITY_INFO_MAX_LENGTH = 500;


    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Kolkata");

    public static final String STATUS_SUCCESS = "Success";
    public static final String STATUS_FAILED = "Failed";
    public static final String STATUS_LOGOUT = "Logout";
    public static final String STATUS_LOCKED = "Locked";

    private final ActivityLogRepository activityLogRepository;

    private static LocalDateTime now() {
        return LocalDateTime.now(APP_ZONE);
    }

    public String recordLogin(String userId, Integer userNo, String userName, String loginStatus) {
        String sessionId = STATUS_SUCCESS.equals(loginStatus) ? UUID.randomUUID().toString() : null;

        ActivityLog log = new ActivityLog();
        log.setUserId(userId);
        log.setUserNo(userNo);
        log.setUserName(userName);
        log.setLoginDateTime(now());
        log.setLoginStatus(loginStatus);
        log.setSessionId(sessionId);
        activityLogRepository.save(log);

        return sessionId;
    }


    public void appendActivity(String sessionId, String entry) {
        Optional<ActivityLog> current = activityLogRepository.findFirstBySessionIdOrderByLoginDateTimeDesc(sessionId)
                .filter(log -> log.getLogoutDateTime() == null);

        if (current.isEmpty()) {
            return;
        }

        ActivityLog log = current.get();
        String existing = log.getActivityInfo();


        if (existing != null && !existing.isBlank()) {
            String lastEntry = existing.substring(existing.lastIndexOf(';') + 1);
            if (lastEntry.equals(entry)) {
                return;
            }
        }

        String appended = (existing == null || existing.isBlank()) ? entry : existing + ";" + entry;

        if (appended.length() <= ACTIVITY_INFO_MAX_LENGTH) {
            log.setActivityInfo(appended);
            activityLogRepository.save(log);
            return;
        }

        ActivityLog rollOver = new ActivityLog();
        rollOver.setUserId(log.getUserId());
        rollOver.setUserNo(log.getUserNo());
        rollOver.setUserName(log.getUserName());
        rollOver.setLoginDateTime(now());
        rollOver.setLoginStatus(log.getLoginStatus());
        rollOver.setSessionId(sessionId);
        rollOver.setActivityInfo(entry);
        activityLogRepository.save(rollOver);
    }

    public Map<String, Object> snapshot(Object entity) {
        return ActivityDiffUtil.snapshot(entity);
    }


    public void appendModifyDiff(String screenName, String tableName, Map<String, Object> before, Object after) {
        String sessionId = currentSessionId();
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        String diff = ActivityDiffUtil.diff(before, after);
        if (diff.isBlank()) {
            return;
        }
        appendActivity(sessionId, "Menu - " + screenName + " - modify - " + tableName + ": " + diff);
    }

    private static final String SESSION_HEADER = "X-Session-Id";

    private String currentSessionId() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) {
            return null;
        }
        return attrs.getRequest().getHeader(SESSION_HEADER);
    }


    public void recordLogout(String sessionId) {
        activityLogRepository.findFirstBySessionIdOrderByLoginDateTimeDesc(sessionId)
                .filter(log -> log.getLogoutDateTime() == null)
                .ifPresent(log -> {
                    log.setLogoutDateTime(now());
                    activityLogRepository.save(log);
                });
    }
}
