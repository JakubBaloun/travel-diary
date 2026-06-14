package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;

import org.junit.jupiter.api.Test;

import com.traveldiary.exception.UnauthorizedException;
import com.traveldiary.service.AuthService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
class AuthServiceTest {

    @Inject
    AuthService authService;

    @Test
    void loginReader_validPassword_returnsToken() {
        var token = authService.loginReader("test-reader-pass");
        assertThat(token).isNotBlank();
    }

    @Test
    void loginReader_invalidPassword_throws() {
        assertThrows(UnauthorizedException.class, () ->
                authService.loginReader("wrong-password"));
    }

    @Test
    void loginAdmin_validPassword_returnsToken() {
        var token = authService.loginAdmin("test-admin-pass");
        assertThat(token).isNotBlank();
    }

    @Test
    void loginAdmin_invalidPassword_throws() {
        assertThrows(UnauthorizedException.class, () ->
                authService.loginAdmin("wrong-password"));
    }
}
