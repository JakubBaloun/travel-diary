package com.traveldiary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank
    @Size(max = 200)
    private String password;

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
