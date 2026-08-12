package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.TrxnMaster;
import com.example.lissomsoft.tms.entity.TrxnMasterId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrxnMasterRepository extends JpaRepository<TrxnMaster, TrxnMasterId> {

    List<TrxnMaster> findByTrxnId(String trxnId);

    Optional<TrxnMaster> findByTrxnIdAndTrxnNumber(String trxnId, Integer trxnNumber);

    @org.springframework.data.jpa.repository.Query(
        "select coalesce(max(t.trxnNumber), 0) from TrxnMaster t where t.trxnId = :trxnId")
    Integer findMaxNumberForTrxnId(String trxnId);
}
