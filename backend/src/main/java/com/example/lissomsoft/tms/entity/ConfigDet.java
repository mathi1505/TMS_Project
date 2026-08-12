package com.example.lissomsoft.tms.entity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "Config_det")
@IdClass(ConfigDetId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfigDet {

    @Id
    @Column(name = "Config_master", length = 4, nullable = false)
    private String configMaster;

    @Id
    @Column(name = "Config_id", nullable = false)
    private Integer configId;

    @Column(name = "Config_name", length = 25, nullable = false)
    private String configName;

    @Column(name = "Config_master_name", length = 50)
    private String configMasterName;

    @Column(name = "Entry_by", length = 25)
    private String entryBy;

    @Column(name = "Entry_date")
    private LocalDate entryDate;

    @Column(name = "Del_flag", length = 1, nullable = false)
    private String delFlag = "A";
}
