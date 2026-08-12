package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "course_master")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseMaster {

    @Id
    @Column(name = "ID", length = 2, nullable = false)
    private String id;

    @NotBlank
    @Column(name = "Tech", length = 25, nullable = false)
    private String technology;

    @NotBlank
    @Column(name = "topic", length = 50, nullable = false)
    private String topic;

    @Column(name = "duration_week")
    private Integer durationWeeks;

    @Column(name = "hours")
    private Integer hours;

    @Column(name = "entry_by", length = 25)
    private String entryBy;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flg", length = 1)
    private String delFlag = "A";
}
