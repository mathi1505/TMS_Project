package com.example.lissomsoft.tms.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class  CourseDetailId implements Serializable {
    private String courseId;
    private Integer courseDetId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof CourseDetailId that)) return false;
        return Objects.equals(courseId, that.courseId) && Objects.equals(courseDetId, that.courseDetId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(courseId, courseDetId);
    }
}
