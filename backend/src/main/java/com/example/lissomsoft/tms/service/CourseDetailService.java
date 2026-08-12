package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.CourseDetail;
import com.example.lissomsoft.tms.repository.CourseDetailRepository;
import com.example.lissomsoft.tms.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseDetailService {

    private final CourseDetailRepository repository;

    @Transactional(readOnly = true)
    public List<CourseDetail> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<CourseDetail> getByCourseId(String courseId) {
        return repository.findByCourseIdIgnoreCase(courseId.trim());
    }

    @Transactional(readOnly = true)
    public CourseDetail getByKey(String courseId, Integer courseDetId) {
        return repository.findByCourseIdIgnoreCaseAndCourseDetId(courseId.trim(), courseDetId)
                .orElseThrow(() -> ApiException.notFound("Record not found."));
    }

    @Transactional(readOnly = true)
    public int nextDetId(String courseId) {
        return repository.findMaxDetIdForCourse(courseId.trim()) + 1;
    }

    public CourseDetail create(CourseDetail record) {
        String courseId = record.getCourseId().trim().toUpperCase();
        if (repository.findByCourseIdIgnoreCaseAndCourseDetId(courseId, record.getCourseDetId()).isPresent()) {
            throw ApiException.conflict(
                "Course ID \"" + courseId + "\" + Detail ID \"" + record.getCourseDetId() + "\" already exists.");
        }
        record.setCourseId(courseId);
        record.setDelFlag(record.getDelFlag() == null ? "A" : record.getDelFlag());
        record.setEntryBy("admin");
        record.setEntryDate(LocalDate.now());
        return repository.save(record);
    }

    public CourseDetail update(String courseId, Integer courseDetId, CourseDetail record) {
        CourseDetail existing = getByKey(courseId, courseDetId);
        existing.setTechnology(record.getTechnology());
        existing.setTopic(record.getTopic());
        existing.setDurationWeeks(record.getDurationWeeks());
        existing.setHours(record.getHours());
        existing.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
        return repository.save(existing);
    }
}
