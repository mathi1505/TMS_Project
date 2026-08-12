package com.example.lissomsoft.tms.security;

import com.example.lissomsoft.tms.util.AesGcmCipher;
import com.example.lissomsoft.tms.util.BufferedResponseWrapper;
import com.example.lissomsoft.tms.util.DecryptedRequestWrapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.util.StreamUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class EncryptionFilter extends OncePerRequestFilter {

    private static final String ENCRYPTED_CONTENT_TYPE = "text/plain;charset=UTF-8";

    private final AesGcmCipher cipher;

    public EncryptionFilter(AesGcmCipher cipher) {
        this.cipher = cipher;
    }

    private boolean isExempt(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.startsWith("/actuator/") || uri.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (isExempt(request)) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest requestToUse = request;

        byte[] rawBody = StreamUtils.copyToByteArray(request.getInputStream());
        if (rawBody.length > 0) {
            String encryptedText = new String(rawBody, StandardCharsets.UTF_8).trim();
            byte[] plaintext;
            try {
                plaintext = cipher.decryptFromBase64(encryptedText);
            } catch (IllegalArgumentException e) {
                writeUnencryptedError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "Malformed or tampered encrypted request body.");
                return;
            }
            requestToUse = new DecryptedRequestWrapper(request, plaintext);
        }

        BufferedResponseWrapper bufferedResponse = new BufferedResponseWrapper(response);
        chain.doFilter(requestToUse, bufferedResponse);

        byte[] plaintextResponseBody = bufferedResponse.getBufferedBody();
        if (plaintextResponseBody.length == 0) {

            return;
        }

        String encryptedBody = cipher.encryptToBase64(plaintextResponseBody);
        byte[] encryptedBytes = encryptedBody.getBytes(StandardCharsets.UTF_8);

        response.setContentType(ENCRYPTED_CONTENT_TYPE);
        response.setContentLength(encryptedBytes.length);
        response.getOutputStream().write(encryptedBytes);
        response.getOutputStream().flush();
    }

    private void writeUnencryptedError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\",\"status\":" + status + "}");
    }
}
