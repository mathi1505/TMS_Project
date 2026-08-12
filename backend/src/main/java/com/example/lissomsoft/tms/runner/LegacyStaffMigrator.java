package com.example.lissomsoft.tms.runner;

import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import com.example.lissomsoft.tms.repository.TrxnMasterRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Order(101)
public class LegacyStaffMigrator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyStaffMigrator.class);

    private static final Pattern VALID_STAFF_KEY = Pattern.compile("^(AS|TR|ME)-\\d+$");

    private final StudentMasterRepository studentMasterRepository;
    private final TrxnMasterRepository trxnMasterRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<StudentMaster> all = studentMasterRepository.findAll();

        List<StudentMaster> legacy = all.stream()
                .filter(s -> s.getAssignedStaff() != null
                        && !VALID_STAFF_KEY.matcher(s.getAssignedStaff().trim()).matches())
                .toList();

        if (legacy.isEmpty()) {
            return;
        }

        Optional<TrxnMaster> defaultTrainer = trxnMasterRepository.findByTrxnId("TR").stream()
                .filter(t -> "A".equals(t.getDelFlag()))
                .min((a, b) -> Integer.compare(a.getTrxnNumber(), b.getTrxnNumber()));

        if (defaultTrainer.isEmpty()) {
            log.warn("Found {} Student Master record(s) with a legacy Staff - Employee ID value, " +
                    "but no active Trainer (TR) entry exists in Transaction Master to migrate them to.",
                    legacy.size());
            return;
        }

        String newKey = "TR-" + defaultTrainer.get().getTrxnNumber();

        for (StudentMaster s : legacy) {
            log.info("Normalized legacy Staff - Employee ID '{}' -> '{}' for student '{}'.",
                    s.getAssignedStaff(), newKey, s.getStudentId());
            s.setAssignedStaff(newKey);
        }

        studentMasterRepository.saveAll(legacy);
        log.info("Legacy Staff - Employee ID cleanup complete: {} record(s) normalized.", legacy.size());
    }
}
