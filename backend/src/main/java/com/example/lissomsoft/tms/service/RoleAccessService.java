package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.RoleOption;
import com.example.lissomsoft.tms.dto.ScreenCatalog;
import com.example.lissomsoft.tms.dto.ScreenDefinition;
import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.entity.RoleScreenAccess;
import com.example.lissomsoft.tms.exception.ApiException;
import com.example.lissomsoft.tms.repository.ConfigDetRepository;
import com.example.lissomsoft.tms.repository.RoleScreenAccessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleAccessService {

    private static final String ADMIN = "ADMIN";

    private final RoleScreenAccessRepository repository;
    private final ConfigDetRepository configDetRepository;


    @Transactional(readOnly = true)
    public List<ScreenDefinition> getScreens() {
        return ScreenCatalog.SCREENS;
    }


    @Transactional(readOnly = true)
    public List<RoleOption> getRoles() {
        Map<String, String> byCode = new LinkedHashMap<>();

        byCode.put(ADMIN, "Administrator");

        List<ConfigDet> rows = configDetRepository.findByConfigMaster("ROLE");
        for (ConfigDet row : rows) {
            if (!"A".equals(row.getDelFlag())) continue;
            String[] parsed = splitCodeLabel(row.getConfigName());
            String code = parsed[0];
            String label = parsed[1];
            if (code.isBlank()) continue;
            byCode.putIfAbsent(code, label);
        }

        return byCode.entrySet().stream()
            .map(e -> new RoleOption(e.getKey(), e.getValue()))
            .toList();
    }


    @Transactional(readOnly = true)
    public List<String> getAccessForRole(String role) {
        String r = normalize(role);
        if (ADMIN.equals(r)) {
            return ScreenCatalog.ALL_CODES.stream()
                .filter(code -> !"MYAC".equals(code))
                .toList();
        }
        return repository.findByRole(r).stream()
            .map(RoleScreenAccess::getScreenCode)
            .sorted()
            .toList();
    }

    public List<String> saveAccessForRole(String role, List<String> screenCodes) {
        String r = normalize(role);
        if (r.isBlank()) {
            throw ApiException.badRequest("Role is required.");
        }
        if (ADMIN.equals(r)) {
            throw ApiException.badRequest("Administrator always has full access and cannot be changed.");
        }

        List<String> valid = (screenCodes == null ? List.<String>of() : screenCodes).stream()
            .filter(java.util.Objects::nonNull)
            .map(c -> c.trim().toUpperCase())
            .distinct()
            .filter(ScreenCatalog.CODES::contains)
            .toList();

        repository.deleteByRole(r);
        repository.flush();

        LocalDate today = LocalDate.now();
        List<RoleScreenAccess> rows = valid.stream()
            .map(code -> new RoleScreenAccess(r, code, "admin", today))
            .toList();
        repository.saveAll(rows);

        return valid;
    }

    private String normalize(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }


    private String[] splitCodeLabel(String configName) {
        String name = configName == null ? "" : configName.trim();
        int dashIdx = -1;
        for (int i = 0; i < name.length(); i++) {
            char ch = name.charAt(i);
            if (ch == '-' || ch == '\u2013' || ch == '\u2014') {
                dashIdx = i;
                break;
            }
        }
        if (dashIdx > 0) {
            String code = name.substring(0, dashIdx).trim().toUpperCase();
            String label = name.substring(dashIdx + 1).trim();
            if (!code.isBlank()) {
                return new String[]{code, label.isBlank() ? code : label};
            }
        }
        String bareCode = name.toUpperCase().replaceAll("[^A-Z0-9]", "");
        return new String[]{bareCode, name};
    }
}
