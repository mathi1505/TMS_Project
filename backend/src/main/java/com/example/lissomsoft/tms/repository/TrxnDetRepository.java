package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.TrxnDet;
import com.example.lissomsoft.tms.entity.TrxnDetId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrxnDetRepository extends JpaRepository<TrxnDet, TrxnDetId> {

    List<TrxnDet> findByTrxnIdAndMasterNumber(String trxnId, Integer masterNumber);
}
