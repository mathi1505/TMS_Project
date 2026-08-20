package com.example.lissomsoft.tms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardCountItem {
    private String code;
    private String label;
    private long count;
}
