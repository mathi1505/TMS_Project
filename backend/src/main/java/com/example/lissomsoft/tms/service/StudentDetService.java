package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.repository.StudentDetRepository;
import com.example.lissomsoft.tms.repository.StudentMasterRepository;
import com.example.lissomsoft.tms.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentDetService {

    private final StudentDetRepository repository;
    private final StudentMasterRepository studentMasterRepository;

    @Transactional(readOnly = true)
    public List<StudentDet> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<StudentDet> getByStudentId(String studentId) {
        return repository.findByStudentIdIgnoreCase(studentId.trim());
    }

    @Transactional(readOnly = true)
    public List<StudentDet> getByStudentId(String studentId, Integer studentNumber) {
        if (studentNumber == null) {
            return getByStudentId(studentId);
        }
        return repository.findByStudentIdIgnoreCaseAndStudentNumber(studentId.trim(), studentNumber);
    }

    @Transactional(readOnly = true)
    public StudentDet getByKey(String studentId, LocalDate tranDate, String tranId, Integer tranNumber) {
        return repository.findByStudentIdAndTranDateAndTranIdAndTranNumber(studentId, tranDate, tranId, tranNumber)
                .orElseThrow(() -> ApiException.notFound("Daily activity record not found."));
    }

    @Transactional(readOnly = true)
    public StudentDet getByKey(String studentId, Integer studentNumber, LocalDate tranDate, String tranId,
                                Integer tranNumber) {
        if (studentNumber == null) {
            return getByKey(studentId, tranDate, tranId, tranNumber);
        }
        return repository.findByStudentIdAndStudentNumberAndTranDateAndTranIdAndTranNumber(
                        studentId, studentNumber, tranDate, tranId, tranNumber)
                .orElseThrow(() -> ApiException.notFound("Daily activity record not found."));
    }

    @Transactional(readOnly = true)
    public int nextTranNumber(String studentId, String tranId) {
        return repository.findMaxTranNumber(studentId, tranId) + 1;
    }

    @Transactional(readOnly = true)
    public int nextTranNumber(String studentId, Integer studentNumber, String tranId) {
        if (studentNumber == null) {
            return nextTranNumber(studentId, tranId);
        }
        return repository.findMaxTranNumber(studentId, studentNumber, tranId) + 1;
    }

    public StudentDet create(StudentDet record) {

        // Do NOT generate tranNumber.
        // Use the tranNumber selected from Transaction Master.

        record.setEntryDate(LocalDate.now());

        if (record.getDelFlag() == null) {
            record.setDelFlag("A");
        }

        return repository.save(record);
    }
    

    public StudentDet update(String studentId, LocalDate tranDate, String tranId, Integer tranNumber,
                              StudentDet record) {
        StudentDet existing = getByKey(studentId, tranDate, tranId, tranNumber);
        return applyUpdate(existing, record);
    }

    public StudentDet update(String studentId, Integer studentNumber, LocalDate tranDate, String tranId,
                              Integer tranNumber, StudentDet record) {
        StudentDet existing = getByKey(studentId, studentNumber, tranDate, tranId, tranNumber);
        return applyUpdate(existing, record);
    }

    private StudentDet applyUpdate(StudentDet existing, StudentDet record) {
        existing.setStudentName(record.getStudentName());
        existing.setTranName(record.getTranName());
        existing.setAttendInTime(record.getAttendInTime());
        existing.setAttendOutTime(record.getAttendOutTime());
        existing.setTranParticular(record.getTranParticular());
        existing.setBackValueDate(record.getBackValueDate() == null ? existing.getBackValueDate() : record.getBackValueDate());
        existing.setCourseId(record.getCourseId());
        existing.setCourseDetId(record.getCourseDetId());
        existing.setTechnology(record.getTechnology());
        existing.setNarration(record.getNarration());
        existing.setRemarks(record.getRemarks());
        existing.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
        return repository.save(existing);
    }

    private Integer lookupStudentNumber(String studentId) {
        if (studentId == null) return null;

        return studentMasterRepository.findByStudentId(studentId.trim().toUpperCase()).stream()
                .map(StudentMaster::getStudentNumber)
                .min(Integer::compareTo)
                .orElse(null);
    }
}

