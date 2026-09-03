package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "student_det")
@IdClass(StudentDetId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentDet {

    @Id
    @Column(name = "Student_id", length = 5, nullable = false)
    private String studentId;

    @Id
    @Column(name = "Student_num", nullable = false)
    private Integer studentNumber;

    @Column(name = "student_name", length = 50)
    private String studentName;

    @Column(name = "tran_name", length = 50)
    private String tranName;

    @Column(name = "technology", length = 25)
    private String technology;

    @Id
    @Column(name = "Tran_date", nullable = false)
    private LocalDate tranDate;

    @Column(name = "Value_date")
    private LocalDate backValueDate;

    @Column(name = "Atten_in_time")
    private LocalTime attendInTime;

    @Column(name = "Atten_out_time")
    private LocalTime attendOutTime;

    @Id
    @Column(name = "Tran_id", length = 2, nullable = false)
    private String tranId;

    @Id
    @Column(name = "Tran_num", nullable = false)
    private Integer tranNumber;

    @Id
    @Column(name = "Entry_seq", nullable = false)
    private Integer entrySeq;

    @Column(name = "Tran_particular", length = 30)
    private String tranParticular;

    @Column(name = "Course_id", length = 2)
    private String courseId;

    @Column(name = "Course_num")
    private Integer courseDetId;

    @Column(name = "Naration", length = 50)
    private String narration;

    @Column(name = "Remarks", length = 50)
    private String remarks;

    @Column(name = "entry_by", length = 25)
    private String entryBy;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flag", length = 1)
    private String delFlag = "A";
}
