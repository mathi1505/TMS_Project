package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.entity.TrxnDet;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.TrxnDetService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/trxn-det")
@RequiredArgsConstructor
@RequiresScreen("TRXD")
public class TrxnDetController {

    private final TrxnDetService service;

    @GetMapping
    public List<TrxnDet> getAll() {
        return service.getAll();
    }

    @GetMapping("/lookup")
    public TrxnDet getByKeyParams(@RequestParam String trxnId,
                                   @RequestParam Integer masterNumber,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                                   @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate valueDate,
                                   @RequestParam(required = false, defaultValue = "") String referenceNo) {
        return service.getByKey(trxnId, masterNumber, tranDate, valueDate, referenceNo);
    }

    @PutMapping("/lookup")
    @PreAuthorize("hasRole('ADMIN')")
    @NoActivityAudit
    public TrxnDet updateByKeyParams(@RequestParam String trxnId,
                                       @RequestParam Integer masterNumber,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate valueDate,
                                       @RequestParam(required = false, defaultValue = "") String referenceNo,
                                       @RequestBody TrxnDet record) {
        return service.update(trxnId, masterNumber, tranDate, valueDate, referenceNo, record);
    }

    @GetMapping("/{trxnId}/{masterNumber}/{tranDate}/{valueDate}/{referenceNo}")
    public TrxnDet getById(@PathVariable String trxnId,
                            @PathVariable Integer masterNumber,
                            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate valueDate,
                            @PathVariable String referenceNo) {
        return service.getByKey(trxnId, masterNumber, tranDate, valueDate, referenceNo);
    }

    @GetMapping("/by-master/{trxnId}/{masterNumber}")
    public List<TrxnDet> getByMasterKey(@PathVariable String trxnId, @PathVariable Integer masterNumber) {
        return service.getByMasterKey(trxnId, masterNumber);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public TrxnDet create(@RequestBody TrxnDet record) {
        return service.create(record);
    }

    @PutMapping("/{trxnId}/{masterNumber}/{tranDate}/{valueDate}/{referenceNo}")
    @PreAuthorize("hasRole('ADMIN')")
    @NoActivityAudit
    public TrxnDet update(@PathVariable String trxnId,
                           @PathVariable Integer masterNumber,
                           @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate tranDate,
                           @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate valueDate,
                           @PathVariable String referenceNo,
                           @RequestBody TrxnDet record) {
        return service.update(trxnId, masterNumber, tranDate, valueDate, referenceNo, record);
    }
}
