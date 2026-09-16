package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.entity.CourseDetail;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.CourseDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-detail")
@RequiredArgsConstructor
@RequiresScreen("CRSD")
public class CourseDetailController {

    private final CourseDetailService service;


    @GetMapping
    @RequiresScreen({"CRSD", "MYAC"})
    public List<CourseDetail> getAll() {
        return service.getAll();
    }

    @GetMapping("/course/{courseId}")
    public List<CourseDetail> getByCourseId(@PathVariable String courseId) {
        return service.getByCourseId(courseId);
    }

    @GetMapping("/{courseId}/{courseDetId}")
    public CourseDetail getByKey(@PathVariable String courseId, @PathVariable Integer courseDetId) {
        return service.getByKey(courseId, courseDetId);
    }

    @GetMapping("/next-id/{courseId}")
    public int nextDetId(@PathVariable String courseId) {
        return service.nextDetId(courseId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CourseDetail create(@RequestBody CourseDetail record) {
        return service.create(record);
    }

    @PutMapping("/{courseId}/{courseDetId}")
    @PreAuthorize("hasRole('ADMIN')")
    @NoActivityAudit
    public CourseDetail update(@PathVariable String courseId, @PathVariable Integer courseDetId,
                                @RequestBody CourseDetail record) {
        return service.update(courseId, courseDetId, record);
    }
}
