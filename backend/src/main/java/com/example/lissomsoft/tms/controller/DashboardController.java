package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.dto.DashboardSummaryResponse;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@RequiresScreen("DASH")
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return service.summary();
    }
}
