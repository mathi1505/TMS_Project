package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.entity.StudentDetId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudentDetRepository extends JpaRepository<StudentDet, StudentDetId> {

    List<StudentDet> findByStudentIdIgnoreCase(String studentId);

    List<StudentDet> findByStudentIdIgnoreCaseAndStudentNumber(String studentId, Integer studentNumber);

    Optional<StudentDet> findByStudentIdAndTranDateAndTranIdAndTranNumberAndEntrySeq(
            String studentId, LocalDate tranDate, String tranId, Integer tranNumber, Integer entrySeq);

    Optional<StudentDet> findByStudentIdAndStudentNumberAndTranDateAndTranIdAndTranNumberAndEntrySeq(
            String studentId, Integer studentNumber, LocalDate tranDate, String tranId, Integer tranNumber,
            Integer entrySeq);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(s.tranNumber), 0) from StudentDet s where s.studentId = :studentId and s.tranId = :tranId")
    Integer findMaxTranNumber(String studentId, String tranId);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(s.tranNumber), 0) from StudentDet s where s.studentId = :studentId "
            + "and s.studentNumber = :studentNumber and s.tranId = :tranId")
    Integer findMaxTranNumber(String studentId, Integer studentNumber, String tranId);


    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(s.entrySeq), 0) from StudentDet s where s.studentId = :studentId "
            + "and s.studentNumber = :studentNumber and s.tranDate = :tranDate "
            + "and s.tranId = :tranId and s.tranNumber = :tranNumber")
    Integer findMaxEntrySeq(String studentId, Integer studentNumber, LocalDate tranDate, String tranId,
                             Integer tranNumber);
}
