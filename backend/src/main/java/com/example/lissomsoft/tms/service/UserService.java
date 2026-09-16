package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.UserResponse;
import com.example.lissomsoft.tms.dto.UserUpsertRequest;
import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.entity.User;
import com.example.lissomsoft.tms.exception.ApiException;
import com.example.lissomsoft.tms.repository.ConfigDetRepository;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import com.example.lissomsoft.tms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository repository;
    private final StudentMasterRepository studentMasterRepository;
    private final ConfigDetRepository configDetRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogService activityLogService;

    private static final Pattern NON_ALNUM = Pattern.compile("[^A-Z0-9]");

    private static final Map<String, String> LEGACY_LABEL_TO_CODE = Map.of(
            "ADMINISTRATOR", "ADMIN",
            "STUDENTS", "STUDENT"
    );

    @Transactional(readOnly = true)
    public List<UserResponse> getAll() {
        return repository.findAll().stream().map(UserResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getByKey(String userId, Integer userNo) {
        return UserResponse.from(findEntity(userId, userNo));
    }

    private User findEntity(String userId, Integer userNo) {
        return repository.findByUserIdAndUserNo(userId.trim().toUpperCase(), userNo)
                .orElseThrow(() -> ApiException.notFound("User \"" + userId + "-" + userNo + "\" not found."));
    }


    private String resolveRoleCode(String configName) {
        String name = configName == null ? "" : configName.trim();
        int dashIdx = -1;
        for (int i = 0; i < name.length(); i++) {
            char c = name.charAt(i);
            if (c == '-' || c == '\u2013' || c == '\u2014') { dashIdx = i; break; }
        }
        if (dashIdx > 0) {
            String code = name.substring(0, dashIdx).trim().toUpperCase();
            if (!code.isBlank()) return code;
        }
        String bare = NON_ALNUM.matcher(name.toUpperCase()).replaceAll("");
        return LEGACY_LABEL_TO_CODE.getOrDefault(bare, bare);
    }


    @Transactional(readOnly = true)
    public java.util.Set<String> activeRoleCodes() {
        return configDetRepository.findByConfigMaster("ROLE").stream()
                .filter(c -> "A".equalsIgnoreCase(c.getDelFlag()))
                .map(ConfigDet::getConfigName)
                .map(this::resolveRoleCode)
                .filter(code -> !code.isBlank())
                .collect(Collectors.toSet());
    }

    public UserResponse create(UserUpsertRequest req) {
        if (req.password() == null || req.password().isBlank()) {
            throw ApiException.badRequest("Password is required.");
        }
        if (repository.findByUserNameIgnoreCase(req.userName().trim()).isPresent()) {
            throw ApiException.conflict("Username \"" + req.userName() + "\" is already taken.");
        }

        String roleCode = req.role() == null ? "" : req.role().trim().toUpperCase();
        if (roleCode.isBlank()) {
            throw ApiException.badRequest("Role is required.");
        }
        if (!activeRoleCodes().contains(roleCode)) {
            throw ApiException.badRequest(
                    "\"" + req.role() + "\" is not an active role under Configuration Master (ROLE). "
                            + "Add it there first, then try again.");
        }

        User user = new User();
        user.setRole(roleCode);

        if ("STUDENT".equals(roleCode)) {
            if (req.studentId() == null || req.studentId().isBlank() || req.studentNo() == null) {
                throw ApiException.badRequest("Student ID and Student No. are required for a Student user.");
            }
            String studentId = req.studentId().trim().toUpperCase();

            studentMasterRepository.findByStudentIdAndStudentNumber(studentId, req.studentNo())
                    .orElseThrow(() -> ApiException.badRequest(
                            "No Student Master record found for " + studentId + "-" + req.studentNo() + "."));

            if (repository.findByUserIdAndUserNo(studentId, req.studentNo()).isPresent()) {
                throw ApiException.conflict("A login already exists for this student.");
            }

            user.setUserId(studentId);
            user.setUserNo(req.studentNo());
        } else {

            String prefix = roleCode.length() >= 3 ? roleCode.substring(0, 3) : roleCode;
            int next = repository.findMaxNoForUserId(prefix) + 1;
            user.setUserId(prefix);
            user.setUserNo(next);
        }

        user.setUserName(req.userName().trim());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setCreatedBy("admin");
        user.setCreatedDate(LocalDate.now());
        user.setDelFlg("A");

        return UserResponse.from(repository.save(user));
    }

    public UserResponse update(String userId, Integer userNo, UserUpsertRequest req) {
        User existing = findEntity(userId, userNo);
        Map<String, Object> before = activityLogService.snapshot(existing);

        if (!existing.getUserName().equalsIgnoreCase(req.userName().trim())) {
            repository.findByUserNameIgnoreCase(req.userName().trim()).ifPresent(other -> {
                boolean sameRecord = other.getUserId().equals(existing.getUserId())
                        && other.getUserNo().equals(existing.getUserNo());
                if (!sameRecord) {
                    throw ApiException.conflict("Username \"" + req.userName() + "\" is already taken.");
                }
            });
        }

        existing.setUserName(req.userName().trim());

        if (req.password() != null && !req.password().isBlank()) {
            existing.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.delFlg() != null && !req.delFlg().isBlank()) {
            existing.setDelFlg(req.delFlg());
        }

        User saved = repository.save(existing);
        // passwordHash is always excluded from the diff by ActivityDiffUtil,
        // so a password change never writes even a hashed value to activity_log.
        activityLogService.appendModifyDiff("User Maintenance", "app_user", before, saved);
        return UserResponse.from(saved);
    }
}
