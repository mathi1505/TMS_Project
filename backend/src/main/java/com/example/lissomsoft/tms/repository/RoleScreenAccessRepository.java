package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.RoleScreenAccess;
import com.example.lissomsoft.tms.entity.RoleScreenAccessId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface RoleScreenAccessRepository extends JpaRepository<RoleScreenAccess, RoleScreenAccessId> {

    List<RoleScreenAccess> findByRole(String role);

    @Transactional
    void deleteByRole(String role);
}
