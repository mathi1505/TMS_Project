package com.example.lissomsoft.tms.security;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
    private final Base64.Decoder b64d = Base64.getUrlDecoder();

    private final byte[] secretKey;
    private final long expirationMinutes;

    private static final String HEADER_JSON = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes:480}") long expirationMinutes) {
        this.secretKey = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(String username, Role role) {
        try {
            Map<String, Object> claims = new LinkedHashMap<>();
            claims.put("sub", username);
            claims.put("role", role.name());
            claims.put("iat", Instant.now().getEpochSecond());
            claims.put("exp", Instant.now().plusSeconds(expirationMinutes * 60).getEpochSecond());

            String headerPart = b64.encodeToString(HEADER_JSON.getBytes(StandardCharsets.UTF_8));
            String payloadPart = b64.encodeToString(mapper.writeValueAsBytes(claims));
            String signingInput = headerPart + "." + payloadPart;
            String signature = b64.encodeToString(hmac(signingInput));
            return signingInput + "." + signature;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate auth token", e);
        }
    }

    public java.util.Optional<ParsedToken> validate(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return java.util.Optional.empty();

            String signingInput = parts[0] + "." + parts[1];
            byte[] expectedSig = hmac(signingInput);
            byte[] actualSig = b64d.decode(parts[2]);
            if (!MessageDigest.isEqual(expectedSig, actualSig)) {
                return java.util.Optional.empty();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> claims = mapper.readValue(b64d.decode(parts[1]), Map.class);
            long exp = ((Number) claims.get("exp")).longValue();
            if (Instant.now().getEpochSecond() > exp) {
                return java.util.Optional.empty();
            }

            String username = (String) claims.get("sub");
            Role role = Role.valueOf((String) claims.get("role"));
            return java.util.Optional.of(new ParsedToken(username, role));
        } catch (Exception e) {
            return java.util.Optional.empty();
        }
    }

    private byte[] hmac(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    public record ParsedToken(String username, Role role) {
    }
}
