package com.example.lissomsoft.tms.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrxnDetId implements Serializable {
    private String trxnId;
    private Integer masterNumber;
    private LocalDate tranDate;
    private LocalDate valueDate;
    private String referenceNo;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TrxnDetId that)) return false;
        return Objects.equals(trxnId, that.trxnId) && Objects.equals(masterNumber, that.masterNumber)
                && Objects.equals(tranDate, that.tranDate) && Objects.equals(valueDate, that.valueDate)
                && Objects.equals(referenceNo, that.referenceNo);
    }

    @Override
    public int hashCode() {
        return Objects.hash(trxnId, masterNumber, tranDate, valueDate, referenceNo);
    }
}
