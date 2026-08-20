package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private long totalStudents;
    private List<DashboardCountItem> studentMasterCounts;

    private long totalActivityStudents;
    private List<DashboardCountItem> studentActivityCounts;
}
