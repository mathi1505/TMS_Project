package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.TrxnMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trxn-master")
@RequiredArgsConstructor
@RequiresScreen("TRXM")
public class TrxnMasterController {

    private final TrxnMasterService service;

    // Class-level requires TRXM (Transaction Master, admin/staff), but
    // student-my-activity-form.component.ts also calls this to populate the
    // Tran ID / Tran No. dropdowns on a student's own entry form, so MYAC is
    // added here to grant that read access.
    @GetMapping
    @RequiresScreen({"TRXM", "MYAC"})
    public List<TrxnMaster> getAll() {
        return service.getAll();
    }

    @GetMapping("/by-id/{trxnId}")
    public List<TrxnMaster> getByTrxnId(@PathVariable String trxnId) {
        return service.getByTrxnId(trxnId);
    }

    @GetMapping("/{trxnId}/{trxnNumber}")
    public TrxnMaster getByKey(@PathVariable String trxnId, @PathVariable Integer trxnNumber) {
        return service.getByKey(trxnId, trxnNumber);
    }

    @GetMapping("/next-number/{trxnId}")
    public int nextNumber(@PathVariable String trxnId) {
        return service.nextNumber(trxnId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public TrxnMaster create(@RequestBody TrxnMaster record) {
        return service.create(record);
    }

    @PutMapping("/{trxnId}/{trxnNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    @NoActivityAudit
    public TrxnMaster update(@PathVariable String trxnId, @PathVariable Integer trxnNumber,
                              @RequestBody TrxnMaster record) {
        return service.update(trxnId, trxnNumber, record);
    }
}
