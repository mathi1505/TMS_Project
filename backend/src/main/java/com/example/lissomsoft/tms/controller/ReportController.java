package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.dto.ExportFileResponse;
import com.example.lissomsoft.tms.dto.ReportDailyActivityListRow;
import com.example.lissomsoft.tms.dto.ReportDailyActivityResponse;
import com.example.lissomsoft.tms.dto.ReportStudentActivitySummary;
import com.example.lissomsoft.tms.dto.ReportStudentSummary;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class ReportController {

    // Each endpoint below is annotated for the specific report screen it
    // backs (RPTS = Student Information Report, RPTA = Student Activity
    // Dashboard Report, RPTD = Student Daily Activity Report), matching the
    // Angular routes/screen codes in app.routes.ts.

    private final ReportService service;

    @GetMapping("/students")
    @RequiresScreen("RPTS")
    public List<ReportStudentSummary> searchStudents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) Integer studentNumber) {
        return service.searchStudents(name, studentType, studentNumber);
    }

    // RPTD backs the admin/staff "Student Daily Activity Report" screen; MYAC
    // is added because student-my-activity-list/-form.component.ts also call
    // this same endpoint (with the logged-in student's own id/number) to show
    // the top-line header and activity rows on their own "My Daily Activity"
    // screen — either grants entry, matching the StudentDetController pattern.
    @GetMapping("/students/{studentId}/{studentNumber}/daily-activity")
    @RequiresScreen({"RPTD", "MYAC"})
    public ReportDailyActivityResponse dailyActivity(
            @PathVariable String studentId,
            @PathVariable Integer studentNumber,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return service.dailyActivity(studentId, studentNumber, month, year);
    }

    @GetMapping("/students/export")
    @RequiresScreen("RPTS")
    public ExportFileResponse exportStudents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) Integer studentNumber,
            @RequestParam String format) {
        return service.exportStudents(name, studentType, studentNumber, format);
    }

    @GetMapping("/students/{studentId}/{studentNumber}/daily-activity/export")
    @RequiresScreen("RPTD")
    public ExportFileResponse exportDailyActivity(
            @PathVariable String studentId,
            @PathVariable Integer studentNumber,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam String format) {
        return service.exportDailyActivity(studentId, studentNumber, month, year, format);
    }


    @GetMapping("/activities")
    @RequiresScreen("RPTA")
    public List<ReportStudentActivitySummary> searchActivities(
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) String tranParticular,
            @RequestParam(required = false) Integer studentNumber,
            @RequestParam(required = false, defaultValue = "true") boolean currentDayOnly) {
        return service.searchActivities(studentType, tranParticular, studentNumber, currentDayOnly);
    }


    @GetMapping("/activities/daily-activity")
    @RequiresScreen("RPTD")
    public List<ReportDailyActivityListRow> dailyActivityList(
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) String tranParticular,
            @RequestParam(required = false) Integer studentNumber,
            @RequestParam(required = false, defaultValue = "false") boolean currentDayOnly) {
        return service.searchActivityRows(studentType, tranParticular, studentNumber, currentDayOnly);
    }

    @GetMapping("/activities/export")
    @RequiresScreen({"RPTA", "RPTD"})
    public ExportFileResponse exportActivities(
            @RequestParam(required = false) String studentType,
            @RequestParam(required = false) String tranParticular,
            @RequestParam(required = false) Integer studentNumber,
            @RequestParam String format) {
        return service.exportActivities(studentType, tranParticular, studentNumber, format);
    }
}
