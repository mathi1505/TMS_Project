package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.entity.StudentMasterId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentMasterRepository extends JpaRepository<StudentMaster, StudentMasterId> {

    List<StudentMaster> findByStudentNameContainingIgnoreCase(String name);

    List<StudentMaster> findByStudentId(String studentId);

    Optional<StudentMaster> findByStudentIdAndStudentNumber(String studentId, Integer studentNumber);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(s.studentNumber), 0) from StudentMaster s "
        + "where s.studentId = :prefix or s.studentId like concat(:prefix, '-%')")
    Integer findMaxNumberForIdPrefix(String prefix);
}
