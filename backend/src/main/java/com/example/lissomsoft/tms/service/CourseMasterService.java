package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.CourseMaster;
import com.example.lissomsoft.tms.repository.CourseMasterRepository;
import com.example.lissomsoft.tms.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseMasterService {

    private final CourseMasterRepository repository;

    @Transactional(readOnly = true)
    public List<CourseMaster> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public CourseMaster getById(String id) {
        return repository.findById(normalize(id))
                .orElseThrow(() -> ApiException.notFound("Course ID \"" + id + "\" not found."));
    }

    @Transactional(readOnly = true)
    public boolean exists(String id) {
        return repository.existsById(normalize(id));
    }

    public CourseMaster create(CourseMaster record) {
        String id = normalize(record.getId());
        if (repository.existsById(id)) {
            throw ApiException.conflict("Course ID \"" + id + "\" already exists. Primary key must be unique.");
        }
        record.setId(id);
        record.setDelFlag(record.getDelFlag() == null ? "A" : record.getDelFlag());
        record.setEntryBy("admin");
        record.setEntryDate(LocalDate.now());
        return repository.save(record);
    }

    public CourseMaster update(String id, CourseMaster record) {
        CourseMaster existing = getById(id);
        existing.setTechnology(record.getTechnology());
        existing.setTopic(record.getTopic());
        existing.setDurationWeeks(record.getDurationWeeks());
        existing.setHours(record.getHours());
        existing.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
        return repository.save(existing);
    }

    private String normalize(String id) {
        return id == null ? null : id.trim().toUpperCase();
    }
}
