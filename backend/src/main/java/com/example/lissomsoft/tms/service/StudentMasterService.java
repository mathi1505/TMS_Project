package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import com.example.lissomsoft.tms.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentMasterService {

    private final StudentMasterRepository repository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<StudentMaster> getAll() {
        List<StudentMaster> all = repository.findAll();
        all.forEach(this::normalizeLegacyFields);
        return all;
    }

    @Transactional(readOnly = true)
    public StudentMaster getById(String id) {

        List<StudentMaster> matches = repository.findByStudentId(id.trim().toUpperCase());
        StudentMaster found = matches.stream().min(java.util.Comparator.comparing(StudentMaster::getStudentNumber)).orElseThrow(() -> ApiException.notFound("Student ID \"" + id + "\" not found."));
        normalizeLegacyFields(found);
        return found;
    }

    @Transactional(readOnly = true)
    public StudentMaster getByIdAndNumber(String id, Integer studentNumber) {
        StudentMaster found = repository.findByStudentIdAndStudentNumber(id.trim().toUpperCase(), studentNumber).orElseThrow(() -> ApiException.notFound("Student ID \"" + id + "\" / No. " + studentNumber + " not found."));
        normalizeLegacyFields(found);
        return found;
    }

    @Transactional(readOnly = true)
    public List<StudentMaster> searchByName(String name) {
        List<StudentMaster> found = repository.findByStudentNameContainingIgnoreCase(name.trim());
        found.forEach(this::normalizeLegacyFields);
        return found;
    }

    private void normalizeLegacyFields(StudentMaster record) {
        applyStudyModeFallback(record);
    }


    static final java.util.Set<String> VALID_STUDY_MODES = java.util.Set.of("On", "Off", "HYB");

    private static final java.util.Map<String, String> LEGACY_STUDY_MODE_LABELS = java.util.Map.of("ONLINE", "On", "OFFLINE", "Off", "HYBRID", "HYB");

    private void applyStudyModeFallback(StudentMaster record) {
        String mode = record.getStudyMode();
        if (mode == null || mode.isBlank()) return;
        String trimmed = mode.trim();
        if (VALID_STUDY_MODES.contains(trimmed)) return;
        String mapped = LEGACY_STUDY_MODE_LABELS.get(trimmed.toUpperCase());
        if (mapped != null) {
            record.setStudyMode(mapped);
        }
    }

    static final java.util.Set<String> VALID_STD_STATUSES = java.util.Set.of("In Progress", "Left", "Transferred to HO");

    private void validateStudyMode(String mode) {
        if (mode == null || !VALID_STUDY_MODES.contains(mode.trim())) {
            throw ApiException.badRequest("Study Mode must be one of: On, Off, HYB.");
        }
    }

    private void validateStdStatus(String status) {
        if (status == null || !VALID_STD_STATUSES.contains(status.trim())) {
            throw ApiException.badRequest("Student Status must be one of: In Progress, Left, Transferred to HO.");
        }
    }

    @Transactional(readOnly = true)
    public String previewNextId(String type) {
        return idPrefixFor(type);
    }

    @Transactional(readOnly = true)
    public int previewNextNumber(String type) {
        return nextCounterFor(type);
    }

    private String idPrefixFor(String type) {
        String code = (type == null ? "" : type.trim().toUpperCase());
        return "LS" + code;
    }

    private int nextCounterFor(String type) {
        String prefix = idPrefixFor(type);
        return repository.findMaxNumberForIdPrefix(prefix) + 1;
    }

    public StudentMaster create(StudentMaster record, String typeCode) {
        String prefix = "LS" + typeCode.trim().toUpperCase();
        int next = repository.findMaxNumberForIdPrefix(prefix) + 1;
        record.setStudentId(prefix);
        record.setStudentNumber(next);
        record.setDelFlag("A");
        record.setEntryBy("admin");
        record.setEntryDate(LocalDate.now());
        validateStudyMode(record.getStudyMode());
        if (record.getStdStatus() == null || record.getStdStatus().isBlank()) {
            record.setStdStatus("In Progress");
        }
        validateStdStatus(record.getStdStatus());
        return repository.save(record);
    }

    public StudentMaster update(String studentId, StudentMaster record) {
        StudentMaster existing = getById(studentId);
        return applyUpdate(existing, record);
    }

    public StudentMaster update(String studentId, Integer studentNumber, StudentMaster record) {
        StudentMaster existing = getByIdAndNumber(studentId, studentNumber);
        return applyUpdate(existing, record);
    }

    private StudentMaster applyUpdate(StudentMaster existing, StudentMaster record) {

        Map<String, Object> before = activityLogService.snapshot(existing);

        existing.setStudentName(record.getStudentName());
        if (record.getStudyMode() != null && !record.getStudyMode().isBlank()) {
            validateStudyMode(record.getStudyMode());
            existing.setStudyMode(record.getStudyMode());
        }
        existing.setAssignedStaff(record.getAssignedStaff());
        existing.setBatch(record.getBatch());
        existing.setNativePlace(record.getNativePlace());
        existing.setJoiningDate(record.getJoiningDate());
        existing.setMobileNo(record.getMobileNo());
        existing.setEmergencyContactNo(record.getEmergencyContactNo());
        existing.setRelationship(record.getRelationship());
        existing.setEmailId(record.getEmailId());
        existing.setQualification(record.getQualification());
        existing.setCollegeName(record.getCollegeName());
        existing.setPassoutYear(record.getPassoutYear());
        existing.setExperience(record.getExperience());
        existing.setReferenceBy(record.getReferenceBy());
        existing.setPaidStatus(record.getPaidStatus());
        existing.setTotalAgreedFee(record.getTotalAgreedFee());
        existing.setDurationFrequency(record.getDurationFrequency());
        existing.setTotalDuration(record.getTotalDuration());
        if (record.getStdStatus() != null && !record.getStdStatus().isBlank()) {
            validateStdStatus(record.getStdStatus());
            existing.setStdStatus(record.getStdStatus());
        }
        existing.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
        StudentMaster saved = repository.save(existing);
        activityLogService.appendModifyDiff("Student Master", "student_master", before, saved);
        return saved;
    }
}
