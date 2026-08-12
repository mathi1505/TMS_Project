package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.CourseDetail;
import com.example.lissomsoft.tms.entity.CourseDetailId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseDetailRepository extends JpaRepository<CourseDetail, CourseDetailId> {

    List<CourseDetail> findByCourseIdIgnoreCase(String courseId);

    Optional<CourseDetail> findByCourseIdIgnoreCaseAndCourseDetId(String courseId, Integer courseDetId);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(c.courseDetId), 0) from CourseDetail c where upper(c.courseId) = upper(:courseId)")
    Integer findMaxDetIdForCourse(String courseId);
}
