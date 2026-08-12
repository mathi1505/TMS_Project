package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportDailyActivityResponse {

    private ReportDailyActivityHeader header;
    private List<ReportDailyActivityRow> activities;
}
