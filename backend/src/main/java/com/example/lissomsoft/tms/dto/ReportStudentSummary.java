package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Row shown on the Report Online Display master search screen.
 * (Student Name / Type / Number search -> Joining Date, Trainer, Mobile, Email, Status)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportStudentSummary {

    private String studentId;
    private Integer studentNumber;

    private String studentName;

    /** Derived from the Student ID prefix, e.g. "TR", "IN" - matches Config Master (STUD) codes. */
    private String studentType;

    private LocalDate joiningDate;
    private String trainerName;
    private Long mobileNo;
    private String emailId;

    /** Business status of the student (In Progress / Left / Transferred to HO). */
    private String status;
}
