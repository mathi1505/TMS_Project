package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.entity.StudentDet;
import com.example.lissomsoft.tms.service.StudentDetService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/student-det")
@RequiredArgsConstructor
public class StudentDetController {

    private final StudentDetService service;

    @GetMapping
    public List<StudentDet> getAll() {
        return service.getAll();
    }

    @GetMapping("/student/{studentId}")
    public List<StudentDet> getByStudentId(@PathVariable String studentId,
                                            @RequestParam(required = false) Integer studentNumber) {
        return service.getByStudentId(studentId, studentNumber);
    }

    @GetMapping("/key")
    public StudentDet getByKey(@RequestParam String studentId,
                                @RequestParam(required = false) Integer studentNumber,
                                @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                                @RequestParam String tranId,
                                @RequestParam Integer tranNumber,
                                @RequestParam(required = false, defaultValue = "1") Integer entrySeq) {
        return service.getByKey(studentId, studentNumber, tranDate, tranId, tranNumber, entrySeq);
    }

    @GetMapping("/next-tran-number")
    public int nextTranNumber(@RequestParam String studentId,
                               @RequestParam(required = false) Integer studentNumber,
                               @RequestParam String tranId) {
        return service.nextTranNumber(studentId, studentNumber, tranId);
    }


    @GetMapping("/next-entry-seq")
    public int nextEntrySeq(@RequestParam String studentId,
                             @RequestParam(required = false) Integer studentNumber,
                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                             @RequestParam String tranId,
                             @RequestParam Integer tranNumber) {
        return service.nextEntrySeq(studentId, studentNumber, tranDate, tranId, tranNumber);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentDet create(@RequestBody StudentDet record) {

        System.out.println("Controller Hit");
        System.out.println(record);

        return service.create(record);
    }

    @PutMapping
    public StudentDet update(@RequestParam String studentId,
                              @RequestParam(required = false) Integer studentNumber,
                              @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                              @RequestParam String tranId,
                              @RequestParam Integer tranNumber,
                              @RequestParam(required = false, defaultValue = "1") Integer entrySeq,
                              @RequestBody StudentDet record) {
        return service.update(studentId, studentNumber, tranDate, tranId, tranNumber, entrySeq, record);
    }
}
