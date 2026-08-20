package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDailyActivityRow {

    private String tranId;
    private Integer tranNumber;

    private LocalDate tranDate;
    private LocalDate valueDate;
    private LocalTime timeIn;
    private LocalTime timeOut;
    private String technology;
    private String topicCovered;
    private String tranParticular;

    // "View details" extras
    private String courseId;
    private Integer courseDetId;
    private String narration;
    private String remarks;
}
