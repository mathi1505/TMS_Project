package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.entity.ConfigDet;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.ConfigDetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Backs "Configuration Master" (CFGM, admin/staff). MYAC is added because
// student-my-activity-form.component.ts also reads config-det rows (the
// TRAN/TRXN config groups) to populate its Tran Particular / Tran ID
// dropdowns on a student's own entry form - either grants read access,
// matching the StudentDetController pattern. Writes stay ADMIN-only via
// @PreAuthorize below, unaffected by this.
@RestController
@RequestMapping("/api/config-det")
@RequiredArgsConstructor
@RequiresScreen({"CFGM", "MYAC"})
public class ConfigDetController {

    private final ConfigDetService service;

    @GetMapping
    public List<ConfigDet> getAll() {
        return service.getAll();
    }

    @GetMapping("/by-master/{configMaster}")
    public List<ConfigDet> getByConfigMaster(@PathVariable String configMaster) {
        return service.getByConfigMaster(configMaster);
    }

    @GetMapping("/{configMaster}/{configId}")
    public ConfigDet getByKey(@PathVariable String configMaster, @PathVariable Integer configId) {
        return service.getByKey(configMaster, configId);
    }

    @GetMapping("/next-id/{configMaster}")
    public int nextId(@PathVariable String configMaster) {
        return service.nextId(configMaster);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ConfigDet create(@RequestBody ConfigDet record) {
        return service.create(record);
    }

    @PutMapping("/{configMaster}/{configId}")
    @PreAuthorize("hasRole('ADMIN')")
    @NoActivityAudit
    public ConfigDet update(@PathVariable String configMaster, @PathVariable Integer configId,
                             @RequestBody ConfigDet record) {
        return service.update(configMaster, configId, record);
    }
}
