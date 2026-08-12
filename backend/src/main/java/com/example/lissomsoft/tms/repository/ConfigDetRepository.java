package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.entity.ConfigDetId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConfigDetRepository extends JpaRepository<ConfigDet, ConfigDetId> {

    List<ConfigDet> findByConfigMaster(String configMaster);

    Optional<ConfigDet> findByConfigMasterAndConfigId(String configMaster, Integer configId);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(c.configId), 0) from ConfigDet c where c.configMaster = :configMaster")
    Integer findMaxIdForMaster(String configMaster);
}
