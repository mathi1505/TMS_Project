package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "trxn_det")
@IdClass(TrxnDetId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrxnDet {

    @Id
    @Column(name = "Trxn_id", length = 2, nullable = false)
    private String trxnId;

    @Id
    @Column(name = "Trxn_num", nullable = false)
    private Integer masterNumber;

    @Id
    @Column(name = "Tran_date", nullable = false)
    private LocalDate tranDate;

    @Id
    @Column(name = "Value_date", nullable = false)
    private LocalDate valueDate;

    @Id
    @Column(name = "Trxn_ref", length = 15, nullable = false)
    private String referenceNo;

    @Column(name = "Student_Name", length = 50)
    private String studentName;

    @Column(name = "Descrip", length = 50)
    private String description;

    @Column(name = "DC_Flag", length = 1, nullable = false)
    private String drCrFlag;

    @Column(name = "Amt", precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "Entry_by", length = 25)
    private String entryBy;

    @Column(name = "Entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flag", length = 1)
    private String delFlag = "A";
}
