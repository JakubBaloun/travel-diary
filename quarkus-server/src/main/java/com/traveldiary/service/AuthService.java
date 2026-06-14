package com.traveldiary.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.traveldiary.exception.UnauthorizedException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@ApplicationScoped
public class AuthService {

    private final SecretKey signingKey;
    private final String readerPassword;
    private final String adminPassword;

    @Inject
    public AuthService(
            @ConfigProperty(name = "app.jwt.secret") String jwtSecret,
            @ConfigProperty(name = "app.auth.reader-password") String readerPassword,
            @ConfigProperty(name = "app.auth.admin-password") String adminPassword
    ) {
        var hash = sha256(jwtSecret);
        this.signingKey = Keys.hmacShaKeyFor(hash.getBytes(StandardCharsets.UTF_8));
        this.readerPassword = readerPassword;
        this.adminPassword = adminPassword;
    }

    public String loginReader(String password) {
        return signFor(password, readerPassword, "reader");
    }

    public String loginAdmin(String password) {
        return signFor(password, adminPassword, "admin");
    }

    private String signFor(String provided, String expected, String scope) {
        if (!timingSafeEqual(provided, expected)) {
            throw new UnauthorizedException("Invalid password");
        }

        return Jwts.builder()
                .claim("scope", scope)
                .expiration(Date.from(Instant.now().plus(30, ChronoUnit.DAYS)))
                .signWith(signingKey)
                .compact();
    }

    private boolean timingSafeEqual(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
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
