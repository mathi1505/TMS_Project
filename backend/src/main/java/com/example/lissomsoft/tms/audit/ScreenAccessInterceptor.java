package com.example.lissomsoft.tms.audit;

import com.example.lissomsoft.tms.exception.ApiException;
import com.example.lissomsoft.tms.security.AuthenticatedPrincipal;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.RoleAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.List;


@Component
@RequiredArgsConstructor
public class ScreenAccessInterceptor implements HandlerInterceptor {

    private final RoleAccessService roleAccessService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequiresScreen requiresScreen = AnnotatedElementUtils.findMergedAnnotation(
                handlerMethod.getMethod(), RequiresScreen.class);
        if (requiresScreen == null) {
            requiresScreen = AnnotatedElementUtils.findMergedAnnotation(
                    handlerMethod.getBeanType(), RequiresScreen.class);
        }
        if (requiresScreen == null) {
            return true;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication != null && authentication.getPrincipal() instanceof AuthenticatedPrincipal principal)) {
            // No authenticated principal on an annotated endpoint: let Spring
            // Security's own authenticated()/permitAll rules (already
            // evaluated before this interceptor runs) be the source of
            // truth rather than duplicating that decision here.
            return true;
        }

        List<String> granted = roleAccessService.getAccessForRole(principal.role());
        String[] required = requiresScreen.value();
        boolean allowed = Arrays.stream(required).anyMatch(granted::contains);
        if (!allowed) {
            throw ApiException.forbidden("Your role does not have access to this screen.");
        }
        return true;
    }
}
