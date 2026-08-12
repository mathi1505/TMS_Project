package com.example.lissomsoft.tms.service;

import com.example.lissomsoft.tms.dto.LoginRequest;
import com.example.lissomsoft.tms.dto.LoginResponse;
import com.example.lissomsoft.tms.entity.User;
import com.example.lissomsoft.tms.exception.ApiException;
import com.example.lissomsoft.tms.repository.UserRepository;
import com.example.lissomsoft.tms.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid username or password."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid username or password.");
        }

        String token = jwtService.generateToken(user.getUsername(), user.getRole());
        return new LoginResponse(token, user.getUsername(), user.getFullName(), user.getRole());
    }
}
