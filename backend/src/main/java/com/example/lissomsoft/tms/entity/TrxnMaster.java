package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "Trxn_master")
@IdClass(TrxnMasterId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrxnMaster {

    @Id
    @Column(name = "Trxn_master_id", length = 2, nullable = false)
    private String trxnId;

    @Id
    @Column(name = "Trxn_master_num", nullable = false)
    private Integer trxnNumber;

    @Column(name = "Trxn_master_name", length = 25)
    private String trxnName;

    @Column(name = "Trxn_description", length = 50)
    private String trxnDescription;

    @Column(name = "Entry_by", length = 25)
    private String entryBy;

    @Column(name = "Entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flg", length = 1)
    private String delFlag = "A";
}
