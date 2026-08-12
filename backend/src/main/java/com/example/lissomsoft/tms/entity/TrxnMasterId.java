package com.example.lissomsoft.tms.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrxnMasterId implements Serializable {
    private String trxnId;
    private Integer trxnNumber;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TrxnMasterId that)) return false;
        return Objects.equals(trxnId, that.trxnId) && Objects.equals(trxnNumber, that.trxnNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(trxnId, trxnNumber);
    }
}
