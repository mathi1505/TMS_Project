package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.service.TrxnMasterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trxn-master")
@RequiredArgsConstructor
public class TrxnMasterController {

    private final TrxnMasterService service;

    @GetMapping
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
    public TrxnMaster update(@PathVariable String trxnId, @PathVariable Integer trxnNumber,
                              @RequestBody TrxnMaster record) {
        return service.update(trxnId, trxnNumber, record);
    }
}
