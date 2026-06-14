package com.traveldiary.auth;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.ext.Provider;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.traveldiary.exception.UnauthorizedException;

import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@JwtAuth
@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthFilter implements ContainerRequestFilter {

    private final SecretKey signingKey;

    @Context
    ResourceInfo resourceInfo;

    @Inject
    public JwtAuthFilter(@ConfigProperty(name = "app.jwt.secret") String jwtSecret) {
        var hash = sha256(jwtSecret);
        this.signingKey = Keys.hmacShaKeyFor(hash.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void filter(ContainerRequestContext requestContext) {
        var header = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);

        if (header == null || !header.startsWith("Bearer ")) {
            throw new UnauthorizedException("Missing bearer token");
        }

        var token = header.substring(7).trim();

        try {
            var claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            var scope = claims.get("scope", String.class);

            if (!"reader".equals(scope) && !"admin".equals(scope)) {
                throw new UnauthorizedException("Invalid token scope");
            }
        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid or expired token");
        }
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
