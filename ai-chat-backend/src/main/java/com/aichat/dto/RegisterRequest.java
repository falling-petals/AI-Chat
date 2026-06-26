package com.aichat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;
    @NotBlank
    @Size(min = 6)
    private String password;
}
