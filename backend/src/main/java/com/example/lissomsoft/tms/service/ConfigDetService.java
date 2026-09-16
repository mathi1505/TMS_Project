package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.repository.ConfigDetRepository;
import com.example.lissomsoft.tms.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ConfigDetService {

    private final ConfigDetRepository repository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<ConfigDet> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ConfigDet> getByConfigMaster(String configMaster) {
        return repository.findByConfigMaster(configMaster.trim().toUpperCase());
    }

    @Transactional(readOnly = true)
    public ConfigDet getByKey(String configMaster, Integer configId) {
        return repository.findByConfigMasterAndConfigId(configMaster.trim().toUpperCase(), configId)
                .orElseThrow(() -> ApiException.notFound(
                        "Record " + configMaster + "-" + pad(configId) + " not found."));
    }

    @Transactional(readOnly = true)
    public int nextId(String configMaster) {
        return repository.findMaxIdForMaster(configMaster.trim().toUpperCase()) + 1;
    }

    public ConfigDet create(ConfigDet record) {

        String configMaster = record.getConfigMaster()
                .trim()
                .toUpperCase();

        int configId = nextId(configMaster);

        record.setConfigMaster(configMaster);
        record.setConfigId(configId);

        // Master Name
        if (record.getConfigMasterName() != null) {
            record.setConfigMasterName(
                    record.getConfigMasterName().trim()
            );
        }

        record.setDelFlag("A");
        record.setEntryBy("admin");
        record.setEntryDate(LocalDate.now());

        return repository.save(record);
    }

    public ConfigDet update(
            String configMaster,
            Integer configId,
            ConfigDet record) {

        ConfigDet existing = getByKey(configMaster, configId);
        Map<String, Object> before = activityLogService.snapshot(existing);

        existing.setConfigName(record.getConfigName());

        if (record.getConfigMasterName() != null) {
            existing.setConfigMasterName(
                    record.getConfigMasterName().trim()
            );
        }

        existing.setDelFlag(
                record.getDelFlag() == null
                        ? existing.getDelFlag()
                        : record.getDelFlag()
        );

        ConfigDet saved = repository.save(existing);
        activityLogService.appendModifyDiff("Configuration Master", "Config_det", before, saved);
        return saved;
    }

    private String pad(int n) {
        return String.valueOf(n);
    }
}
