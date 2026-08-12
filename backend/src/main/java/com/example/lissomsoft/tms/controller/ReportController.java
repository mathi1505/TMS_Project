package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.dto.ExportFileResponse;
import com.example.lissomsoft.tms.dto.ReportDailyActivityResponse;
import com.example.lissomsoft.tms.dto.ReportStudentSummary;
import com.example.lissomsoft.tms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService service;

    @GetMapping("/students")
    public List<ReportStudentSummary> searchStudents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) Integer studentNumber) {
        return service.searchStudents(name, studentType, studentNumber);
    }

    @GetMapping("/students/{studentId}/{studentNumber}/daily-activity")
    public ReportDailyActivityResponse dailyActivity(
            @PathVariable String studentId,
            @PathVariable Integer studentNumber,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return service.dailyActivity(studentId, studentNumber, month, year);
    }

    @GetMapping("/students/export")
    public ExportFileResponse exportStudents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) Integer studentNumber,
            @RequestParam String format) {
        return service.exportStudents(name, studentType, studentNumber, format);
    }

    @GetMapping("/students/{studentId}/{studentNumber}/daily-activity/export")
    public ExportFileResponse exportDailyActivity(
            @PathVariable String studentId,
            @PathVariable Integer studentNumber,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam String format) {
        return service.exportDailyActivity(studentId, studentNumber, month, year, format);
    }
}
