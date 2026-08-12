package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Top line (display-only) of the Daily Activity report screen:
 * Student Number, Student Name, Student Type, Joining Date, Trainer Name, Mobile Number.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDailyActivityHeader {

    private String studentId;
    private Integer studentNumber;
    private String studentName;
    private String studentType;
    private LocalDate joiningDate;
    private String trainerName;
    private Long mobileNo;
}
