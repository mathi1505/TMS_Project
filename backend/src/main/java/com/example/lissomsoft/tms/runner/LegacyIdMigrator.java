package com.example.lissomsoft.tms.runner;
import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.repository.StudentDetRepository;
import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import jakarta.annotation.Nonnull;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Order(100)
public class LegacyIdMigrator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyIdMigrator.class);

    private static final Pattern ID_PATTERN = Pattern.compile("^([A-Za-z]+)-0*(\\d+)$");

    private final StudentMasterRepository studentMasterRepository;
    private final StudentDetRepository studentDetRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<StudentMaster> all = studentMasterRepository.findAll();
        int fixed = 0;

        for (StudentMaster record : all) {
            String oldId = record.getStudentId();
            Matcher m = ID_PATTERN.matcher(oldId == null ? "" : oldId.trim());
            if (!m.matches()) {
                continue;
            }

            String prefix = m.group(1).toUpperCase();
            int number = Integer.parseInt(m.group(2));
            String newId = prefix + "-" + number;

            if (newId.equals(oldId)) {
                continue;
            }

            List<StudentDet> details = studentDetRepository.findByStudentIdIgnoreCase(oldId);
            for (StudentDet det : details) {
                det.setStudentId(newId);
            }
            studentDetRepository.saveAll(details);



            studentMasterRepository.delete(record);
            StudentMaster corrected = getStudentMaster(record, newId, number);
            studentMasterRepository.save(corrected);

            log.info("Normalized legacy Student ID '{}' -> '{}' ({} detail row(s) updated).",
                    oldId, newId, details.size());
            fixed++;
        }

        if (fixed > 0) {
            log.info("Legacy Student ID cleanup complete: {} record(s) normalized.", fixed);
        }
    }

    @Nonnull
    private static StudentMaster getStudentMaster(StudentMaster record, String newId, int number) {
        StudentMaster corrected = new StudentMaster();
        corrected.setStudentId(newId);
        corrected.setStudentNumber(number);
        corrected.setStudentName(record.getStudentName());
        corrected.setStudyMode(record.getStudyMode());
        corrected.setAssignedStaff(record.getAssignedStaff());
        corrected.setBatch(record.getBatch());
        corrected.setNativePlace(record.getNativePlace());
        corrected.setJoiningDate(record.getJoiningDate());
        corrected.setMobileNo(record.getMobileNo());
        corrected.setEmergencyContactNo(record.getEmergencyContactNo());
        corrected.setRelationship(record.getRelationship());
        corrected.setEmailId(record.getEmailId());
        corrected.setQualification(record.getQualification());
        corrected.setCollegeName(record.getCollegeName());
        corrected.setPassoutYear(record.getPassoutYear());
        corrected.setExperience(record.getExperience());
        corrected.setReferenceBy(record.getReferenceBy());
        corrected.setPaidStatus(record.getPaidStatus());
        corrected.setTotalAgreedFee(record.getTotalAgreedFee());
        corrected.setDurationFrequency(record.getDurationFrequency());
        corrected.setTotalDuration(record.getTotalDuration());
        corrected.setDelFlag(record.getDelFlag());
        corrected.setEntryBy(record.getEntryBy());
        corrected.setEntryDate(record.getEntryDate());
        corrected.setStdStatus(record.getStdStatus());
        return corrected;
    }
}
