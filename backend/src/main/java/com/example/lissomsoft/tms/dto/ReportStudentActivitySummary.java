package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportStudentActivitySummary {

    private String studentId;
    private Integer studentNumber;
    private String studentName;

    private String studentType;

    private String trainerName;
    private Long mobileNo;

    private LocalDate tranDate;
    private String technology;


    private String tranId;
    private Integer tranNumber;
    private Integer entrySeq;


    private String tranParticular;

    private String narration;
}
