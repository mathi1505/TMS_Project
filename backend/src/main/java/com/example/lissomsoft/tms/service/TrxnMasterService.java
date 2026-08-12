package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.repository.TrxnMasterRepository;
import com.example.lissomsoft.tms.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrxnMasterService {

    private final TrxnMasterRepository repository;

    @Transactional(readOnly = true)
    public List<TrxnMaster> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<TrxnMaster> getByTrxnId(String trxnId) {
        return repository.findByTrxnId(trxnId);
    }

    @Transactional(readOnly = true)
    public TrxnMaster getByKey(String trxnId, Integer trxnNumber) {
        return repository.findByTrxnIdAndTrxnNumber(trxnId, trxnNumber)
                .orElseThrow(() -> ApiException.notFound(
                        "Record " + trxnId + "-" + pad(trxnNumber) + " not found."));
    }

    @Transactional(readOnly = true)
    public int nextNumber(String trxnId) {
        return repository.findMaxNumberForTrxnId(trxnId) + 1;
    }

    public TrxnMaster create(TrxnMaster record) {
        int trxnNumber = nextNumber(record.getTrxnId());
        record.setTrxnNumber(trxnNumber);
        record.setDelFlag("A");
        record.setEntryBy("admin");
        record.setEntryDate(LocalDate.now());
        return repository.save(record);
    }

    public TrxnMaster update(String trxnId, Integer trxnNumber, TrxnMaster record) {
        TrxnMaster existing = getByKey(trxnId, trxnNumber);
        existing.setTrxnName(record.getTrxnName());
        existing.setTrxnDescription(record.getTrxnDescription());
        existing.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
        return repository.save(existing);
    }

    private String pad(int n) {
        return String.valueOf(n);
    }
}
