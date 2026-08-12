package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.entity.CourseMaster;
import com.example.lissomsoft.tms.service.CourseMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-master")
@RequiredArgsConstructor
public class CourseMasterController {

    private final CourseMasterService service;

    @GetMapping
    public List<CourseMaster> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public CourseMaster getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public CourseMaster create(@RequestBody CourseMaster record) {
        return service.create(record);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseMaster update(@PathVariable String id, @RequestBody CourseMaster record) {
        return service.update(id, record);
    }
}
