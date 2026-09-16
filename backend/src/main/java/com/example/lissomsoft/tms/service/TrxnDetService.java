package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.entity.TrxnDet;
import com.example.lissomsoft.tms.entity.TrxnDetId;
import com.example.lissomsoft.tms.repository.TrxnDetRepository;
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
public class TrxnDetService {

    private final TrxnDetRepository repository;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public List<TrxnDet> getAll() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public TrxnDet getByKey(String trxnId, Integer masterNumber, LocalDate tranDate, LocalDate valueDate, String referenceNo) {
        TrxnDetId id = new TrxnDetId(trxnId, masterNumber, tranDate, valueDate, referenceNo);
        return repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Transaction entry not found."));
    }

    @Transactional(readOnly = true)
    public List<TrxnDet> getByMasterKey(String trxnId, Integer masterNumber) {
        return repository.findByTrxnIdAndMasterNumber(trxnId, masterNumber);
    }

    public TrxnDet create(TrxnDet record) {
        LocalDate today = LocalDate.now();
        record.setTranDate(today);
        record.setDrCrFlag("EX".equals(record.getTrxnId()) ? "D" : "C");
        record.setDelFlag("A");
        record.setEntryBy("admin");
        record.setEntryDate(today);
        return repository.save(record);
    }

    public TrxnDet update(String trxnId, Integer masterNumber, LocalDate tranDate, LocalDate valueDate, String referenceNo, TrxnDet record) {
        TrxnDet existing = getByKey(trxnId, masterNumber, tranDate, valueDate, referenceNo);
        Map<String, Object> before = activityLogService.snapshot(existing);

        LocalDate newValueDate = record.getValueDate() != null ? record.getValueDate() : existing.getValueDate();
        String newReferenceNo = record.getReferenceNo() == null ? "" : record.getReferenceNo();

        boolean keyChanged = !newValueDate.equals(existing.getValueDate())
                || !newReferenceNo.equals(existing.getReferenceNo());

        if (!keyChanged) {
            existing.setDescription(record.getDescription());
            existing.setAmount(record.getAmount());
            existing.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
            TrxnDet saved = repository.save(existing);
            activityLogService.appendModifyDiff("Daily Transaction Entry", "trxn_det", before, saved);
            return saved;
        }

        TrxnDet replacement = new TrxnDet();
        replacement.setTrxnId(existing.getTrxnId());
        replacement.setMasterNumber(existing.getMasterNumber());
        replacement.setTranDate(existing.getTranDate());
        replacement.setValueDate(newValueDate);
        replacement.setReferenceNo(newReferenceNo);
        replacement.setDrCrFlag(existing.getDrCrFlag());
        replacement.setDescription(record.getDescription());
        replacement.setAmount(record.getAmount());
        replacement.setDelFlag(record.getDelFlag() == null ? existing.getDelFlag() : record.getDelFlag());
        replacement.setEntryBy(existing.getEntryBy());
        replacement.setEntryDate(existing.getEntryDate());

        repository.delete(existing);
        repository.flush();
        TrxnDet saved = repository.save(replacement);
        activityLogService.appendModifyDiff("Daily Transaction Entry", "trxn_det", before, saved);
        return saved;
    }
}
