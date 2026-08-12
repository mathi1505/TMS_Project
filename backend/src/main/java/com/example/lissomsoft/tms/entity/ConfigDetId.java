package com.example.lissomsoft.tms.entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Objects;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfigDetId implements Serializable {
    private String configMaster;
    private Integer configId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ConfigDetId that)) return false;
        return Objects.equals(configMaster, that.configMaster) && Objects.equals(configId, that.configId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(configMaster, configId);
    }
}
