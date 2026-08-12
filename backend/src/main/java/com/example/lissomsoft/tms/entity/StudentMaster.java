package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "student_master")
@IdClass(StudentMasterId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentMaster {

    @Id
    @Column(name = "Student_id", length = 5, nullable = false)
    private String studentId;

    @Id
    @Column(name = "Student_no", nullable = false)
    private Integer studentNumber;

    @Column(name = "Student_Name", length = 50, nullable = false)
    private String studentName;
    

    @Column(name = "Student_Std_mode", length = 3, nullable = false)
    private String studyMode;

    @Column(name = "Student_Assign_Staff", length = 15, nullable = false)
    private String assignedStaff;

    @Column(name = "Student_batch")
    private Integer batch;

    @Column(name = "Student_native", length = 50, nullable = false)
    private String nativePlace;

    @Column(name = "Joining_date")
    private LocalDate joiningDate;

    @Column(name = "Mobile_no")
    private Long mobileNo;

    @Column(name = "Emergency_no")
    private Long emergencyContactNo;

    @Column(name = "Relationship", length = 30)
    private String relationship;

    @Column(name = "Email_ID", length = 50)
    private String emailId;

    @Column(name = "Qualification", length = 30)
    private String qualification;

    @Column(name = "College_name", length = 50)
    private String collegeName;

    @Column(name = "Passout_year")
    private Integer passoutYear;

    @Column(name = "Experience", length = 30)
    private String experience;

    @Column(name = "Reference_by", length = 30)
    private String referenceBy;

    @Column(name = "Paid", length = 1)
    private String paidStatus;

    @Column(name = "Total_fee")
    private Integer totalAgreedFee;

    @Column(name = "Duration_Freq", length = 1)
    private String durationFrequency;

    @Column(name = "Total_Duration")
    private Integer totalDuration;

    @Column(name = "Std_status", length = 30)
    private String stdStatus;

    @Column(name = "entry_by", length = 25)
    private String entryBy;

    @Column(name = "entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flg", length = 1)
    private String delFlag = "A";


}
