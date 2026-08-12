package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "course_det")
@IdClass(CourseDetailId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseDetail {

    @Id
    @Column(name = "Course_ID", length = 2, nullable = false)
    private String courseId;

    @Id
    @Column(name = "Course_DET_ID", nullable = false)
    private Integer courseDetId;

    @Column(name = "Tech", length = 25, nullable = false)
    private String technology;

    @Column(name = "topic", length = 100, nullable = false)
    private String topic;

    @Column(name = "duration_week", precision = 5, scale = 2)
    private java.math.BigDecimal durationWeeks;

    @Column(name = "hours")
    private Integer hours;

    @Column(name = "entry_by", length = 25)
    private String entryBy;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flg", length = 1)
    private String delFlag = "A";
}
