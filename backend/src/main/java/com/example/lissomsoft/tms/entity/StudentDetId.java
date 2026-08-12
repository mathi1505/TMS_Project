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
public class StudentDetId implements Serializable {
    private String studentId;
    private Integer studentNumber;
    private LocalDate tranDate;
    private String tranId;
    private Integer tranNumber;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentDetId that)) return false;
        return Objects.equals(studentId, that.studentId) && Objects.equals(studentNumber, that.studentNumber)
                && Objects.equals(tranDate, that.tranDate)
                && Objects.equals(tranId, that.tranId) && Objects.equals(tranNumber, that.tranNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, studentNumber, tranDate, tranId, tranNumber);
    }
}
