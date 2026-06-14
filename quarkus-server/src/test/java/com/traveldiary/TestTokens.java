package com.traveldiary;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

public final class TestTokens {

    private static final String SECRET = "test-jwt-secret-that-is-long-enough-for-hmac-sha256";

    private static SecretKey signingKey() {
        var hash = sha256(SECRET);
        return Keys.hmacShaKeyFor(hash.getBytes(StandardCharsets.UTF_8));
    }

    public static String readerToken() {
        return token("reader");
    }

    public static String adminToken() {
        return token("admin");
    }

    private static String token(String scope) {
        return Jwts.builder()
                .claim("scope", scope)
                .expiration(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .signWith(signingKey())
                .compact();
    }

    private static String sha256(String input) {
        try {
            var digest = MessageDigest.getInstance("SHA-256");
            var hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            var hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
