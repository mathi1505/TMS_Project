package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.entity.StudentMaster;
import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.StudentMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student-master")
@RequiredArgsConstructor
@RequiresScreen("STDM")
public class StudentMasterController {

    private final StudentMasterService service;

    @GetMapping
    public List<StudentMaster> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public StudentMaster getById(@PathVariable String id) {
        return service.getById(id);
    }

    // Class-level requires STDM (Student Master, admin/staff), but
    // student-my-activity-list/-form.component.ts also call this with the
    // logged-in student's own id/number to show their study mode, so MYAC
    // is added here to grant that self-lookup.
    @GetMapping("/{id}/{studentNumber}")
    @RequiresScreen({"STDM", "MYAC"})
    public StudentMaster getByIdAndNumber(@PathVariable String id, @PathVariable Integer studentNumber) {
        return service.getByIdAndNumber(id, studentNumber);
    }

    @GetMapping("/search")
    public List<StudentMaster> search(@RequestParam String name) {
        return service.searchByName(name);
    }

    @GetMapping("/preview-next-id")
    public String previewNextId(@RequestParam String type) {
        return service.previewNextId(type);
    }

    @GetMapping("/preview-next-number")
    public int previewNextNumber(@RequestParam String type) {
        return service.previewNextNumber(type);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentMaster create(
            @RequestParam String typeCode,
            @RequestBody StudentMaster record) {

        return service.create(record, typeCode);
    }

    @PutMapping("/{id}")
    @NoActivityAudit
    public StudentMaster update(@PathVariable String id, @RequestBody StudentMaster record) {
        return service.update(id, record);
    }

    @PutMapping("/{id}/{studentNumber}")
    @NoActivityAudit
    public StudentMaster update(@PathVariable String id, @PathVariable Integer studentNumber,
                                 @RequestBody StudentMaster record) {
        return service.update(id, studentNumber, record);
    }
}
