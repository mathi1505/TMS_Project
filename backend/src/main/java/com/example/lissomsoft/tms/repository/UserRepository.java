package com.example.lissomsoft.tms.repository;

import com.example.lissomsoft.tms.entity.User;
import com.example.lissomsoft.tms.entity.UserId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, UserId> {

    Optional<User> findByUserNameIgnoreCase(String userName);

    Optional<User> findByUserIdAndUserNo(String userId, Integer userNo);

    List<User> findByUserId(String userId);

    @Query("select coalesce(max(u.userNo), 0) from User u where u.userId = :userId")
    Integer findMaxNoForUserId(String userId);
}
