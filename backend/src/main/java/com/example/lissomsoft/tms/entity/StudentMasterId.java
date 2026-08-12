package com.example.lissomsoft.tms.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentMasterId implements Serializable {
    private String studentId;
    private Integer studentNumber;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentMasterId that)) return false;
        return Objects.equals(studentId, that.studentId) && Objects.equals(studentNumber, that.studentNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(studentId, studentNumber);
    }
}
