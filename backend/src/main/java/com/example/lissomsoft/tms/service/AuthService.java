package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.ChangePasswordRequest;
import com.example.lissomsoft.tms.dto.LoginRequest;
import com.example.lissomsoft.tms.dto.LoginResponse;
import com.example.lissomsoft.tms.entity.User;
import com.example.lissomsoft.tms.exception.ApiException;
import com.example.lissomsoft.tms.repository.UserRepository;
import com.example.lissomsoft.tms.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ActivityLogService activityLogService;

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByUserNameIgnoreCase(request.username().trim())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            // Username unknown: nothing to key the activity_log row to, so it's
            // only recorded when we at least have a matching user_id/user_no.
            if (user != null) {
                activityLogService.recordLogin(user.getUserId(), user.getUserNo(), user.getUserName(), ActivityLogService.STATUS_FAILED);
            }
            throw ApiException.unauthorized("Invalid username or password.");
        }

        if (!"A".equalsIgnoreCase(user.getDelFlg())) {
            activityLogService.recordLogin(user.getUserId(), user.getUserNo(), user.getUserName(), ActivityLogService.STATUS_LOCKED);
            throw ApiException.unauthorized("This account has been deactivated.");
        }

        String sessionId = activityLogService.recordLogin(user.getUserId(), user.getUserNo(), user.getUserName(), ActivityLogService.STATUS_SUCCESS);

        String token = jwtService.generateToken(user.getUserId(), user.getUserNo(), user.getUserName(), user.getRole());
        return new LoginResponse(token, user.getUserId(), user.getUserNo(), user.getUserName(), user.getRole(), sessionId);
    }

    /**
     * Stamps Logout_date_time on the session's activity_log row.
     */
    public void logout(String sessionId) {
        if (sessionId != null && !sessionId.isBlank()) {
            activityLogService.recordLogout(sessionId);
        }
    }

    /**
     * Lets an already-logged-in user set a new password. Only the existing
     * password_hash column is touched — the current value is simply
     * overwritten with the new one, nothing else is tracked.
     */
    public void changePassword(String userId, Integer userNo, ChangePasswordRequest request) {
        User user = userRepository.findByUserIdAndUserNo(userId, userNo)
                .orElseThrow(() -> ApiException.unauthorized("Login required or session expired."));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            // Deliberately a 400, not 401: an incorrect *current* password here is a
            // form-validation error, not an expired/invalid session, so it shouldn't
            // trip the app's "401 -> force logout" handling.
            throw ApiException.badRequest("Current password is incorrect.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("New password must be different from the current password.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }
}
