package com.example.lissomsoft.tms.controller;

import com.example.lissomsoft.tms.audit.NoActivityAudit;
import com.example.lissomsoft.tms.dto.UserResponse;
import com.example.lissomsoft.tms.dto.UserUpsertRequest;
import com.example.lissomsoft.tms.security.RequiresScreen;
import com.example.lissomsoft.tms.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/app-user")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequiresScreen("USRM")
public class UserController {

    private final UserService service;

    @GetMapping
    public List<UserResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{userId}/{userNo}")
    public UserResponse getByKey(@PathVariable String userId, @PathVariable Integer userNo) {
        return service.getByKey(userId, userNo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(@Valid @RequestBody UserUpsertRequest request) {
        return service.create(request);
    }

    @PutMapping("/{userId}/{userNo}")
    @NoActivityAudit
    public UserResponse update(@PathVariable String userId, @PathVariable Integer userNo,
                                @Valid @RequestBody UserUpsertRequest request) {
        return service.update(userId, userNo, request);
    }
}
