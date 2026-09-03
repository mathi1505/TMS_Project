package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDailyActivityListRow {

    private String studentId;
    private Integer studentNumber;
    private String studentName;


    private String studentType;

    private String trainerName;
    private Long mobileNo;

    private LocalDate tranDate;
    private String technology;
    private String tranParticular;
    private String narration;

    private LocalTime timeIn;
    private LocalTime timeOut;
    private String remarks;

    private String tranId;
    private Integer tranNumber;
}
