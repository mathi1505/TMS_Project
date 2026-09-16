package com.example.lissomsoft.tms.audit;

import com.example.lissomsoft.tms.dto.ScreenCatalog;
import com.example.lissomsoft.tms.security.AuthenticatedPrincipal;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.ActivityLogService;
import com.example.lissomsoft.tms.service.RoleAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


@Component
@RequiredArgsConstructor
public class ActivityAuditInterceptor implements HandlerInterceptor {

    private static final String SESSION_HEADER = "X-Session-Id";
    private static final int MAX_BODY_CHARS = 300;
    private static final Pattern SECRET_FIELD = Pattern.compile(
            "(?i)\"([a-z]*password[a-z]*)\"\\s*:\\s*\"[^\"]*\"");

    private static final Map<String, String> SCREEN_NAMES_BY_CODE = ScreenCatalog.SCREENS.stream()
            .collect(Collectors.toMap(s -> s.code(), s -> s.name()));

    /** Controller simple class name -> the @Table name it reads/writes. */
    private static final Map<String, String> TABLE_NAMES_BY_CONTROLLER = Map.ofEntries(
            Map.entry("StudentMasterController", "student_master"),
            Map.entry("CourseDetailController", "course_det"),
            Map.entry("CourseMasterController", "course_master"),
            Map.entry("StudentDetController", "student_det"),
            Map.entry("TrxnMasterController", "Trxn_master"),
            Map.entry("TrxnDetController", "trxn_det"),
            Map.entry("ConfigDetController", "Config_det"),
            Map.entry("UserController", "app_user"),
            Map.entry("RoleAccessController", "role_screen_access")
    );

    private final ActivityLogService activityLogService;
    private final RoleAccessService roleAccessService;

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler,
                            ModelAndView modelAndView) {

        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return;
        }


        if (AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getMethod(), NoActivityAudit.class) != null) {
            return;
        }


        if ("GET".equals(request.getMethod())) {
            return;
        }

        String sessionId = request.getHeader(SESSION_HEADER);
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        if (!(SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            return;
        }

        String screenName = screenNameOf(handlerMethod, principal);
        String tableName = tableNameOf(handlerMethod);
        String entry = buildEntry(request, screenName, tableName);
        if (entry != null) {
            activityLogService.appendActivity(sessionId, entry);
        }
    }

    private String buildEntry(HttpServletRequest request, String screenName, String tableName) {
        String method = request.getMethod();
        return switch (method) {
            case "POST" -> "Menu - " + screenName + " - newEntry - " + tableName;
            case "PUT", "PATCH" -> "Menu - " + screenName + " - modify - " + tableName + bodySuffix(request);
            case "DELETE" -> "Menu - " + screenName + " - modify - " + tableName + " (deleted): " + request.getRequestURI();
            default -> null;
        };
    }

    private String bodySuffix(HttpServletRequest request) {
        String body = readBody(request);
        if (body == null || body.isBlank()) {
            return "";
        }
        body = SECRET_FIELD.matcher(body).replaceAll("\"$1\":\"***\"");
        if (body.length() > MAX_BODY_CHARS) {
            body = body.substring(0, MAX_BODY_CHARS) + "...(truncated)";
        }
        return ": " + body;
    }


    private String readBody(HttpServletRequest request) {
        try {
            byte[] bytes = StreamUtils.copyToByteArray(request.getInputStream());
            if (bytes.length == 0) {
                return null;
            }
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    private String screenNameOf(HandlerMethod handlerMethod, AuthenticatedPrincipal principal) {
        RequiresScreen requiresScreen = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(), RequiresScreen.class);
        if (requiresScreen == null) {
            requiresScreen = AnnotatedElementUtils.findMergedAnnotation(
                    handlerMethod.getBeanType(), RequiresScreen.class);
        }

        if (requiresScreen != null) {
            List<String> granted = roleAccessService.getAccessForRole(principal.role());
            for (String code : requiresScreen.value()) {
                if (granted.contains(code)) {
                    return SCREEN_NAMES_BY_CODE.getOrDefault(code, code);
                }
            }

        }

        return classNameScreenLabel(handlerMethod);
    }

    private String classNameScreenLabel(HandlerMethod handlerMethod) {
        String className = handlerMethod.getBeanType().getSimpleName();
        String stripped = className.endsWith("Controller")
                ? className.substring(0, className.length() - "Controller".length())
                : className;
        return stripped.replaceAll("(?<=[a-z])(?=[A-Z])", " ");
    }

    private String tableNameOf(HandlerMethod handlerMethod) {
        String className = handlerMethod.getBeanType().getSimpleName();
        String known = TABLE_NAMES_BY_CONTROLLER.get(className);
        if (known != null) {
            return known;
        }

        String stripped = className.endsWith("Controller")
                ? className.substring(0, className.length() - "Controller".length())
                : className;
        return stripped.replaceAll("(?<=[a-z])(?=[A-Z])", "_").toLowerCase();
    }
}

