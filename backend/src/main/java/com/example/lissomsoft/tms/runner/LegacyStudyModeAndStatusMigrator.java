package com.example.lissomsoft.tms.runner;

import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Order(102)
public class LegacyStudyModeAndStatusMigrator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyStudyModeAndStatusMigrator.class);

    private static final Set<String> VALID_STUDY_MODES = Set.of("On", "Off", "HYB");
    private static final Map<String, String> LEGACY_STUDY_MODE_LABELS = Map.of(
            "ONLINE", "On",
            "OFFLINE", "Off",
            "HYBRID", "HYB"
    );

    private static final Set<String> VALID_STD_STATUSES = Set.of("In Progress", "Left", "Transferred to HO");
    private static final String DEFAULT_STD_STATUS = "In Progress";

    private final StudentMasterRepository studentMasterRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<StudentMaster> all = studentMasterRepository.findAll();
        int fixed = 0;

        for (StudentMaster record : all) {
            boolean changed = false;

            String mode = record.getStudyMode();
            if (mode != null && !VALID_STUDY_MODES.contains(mode.trim())) {
                String mapped = LEGACY_STUDY_MODE_LABELS.get(mode.trim().toUpperCase());
                if (mapped != null) {
                    log.info("Normalized legacy Study Mode '{}' -> '{}' for student '{}'.",
                            mode, mapped, record.getStudentId());
                    record.setStudyMode(mapped);
                    changed = true;
                }
            }

            String status = record.getStdStatus();
            if (status == null || status.isBlank() || !VALID_STD_STATUSES.contains(status.trim())) {
                log.info("Normalized legacy Student Status '{}' -> '{}' for student '{}'.",
                        status, DEFAULT_STD_STATUS, record.getStudentId());
                record.setStdStatus(DEFAULT_STD_STATUS);
                changed = true;
            }

            if (changed) fixed++;
        }

        if (fixed > 0) {
            studentMasterRepository.saveAll(all);
            log.info("Legacy Study Mode / Student Status cleanup complete: {} record(s) normalized.", fixed);
        }
    }
}
