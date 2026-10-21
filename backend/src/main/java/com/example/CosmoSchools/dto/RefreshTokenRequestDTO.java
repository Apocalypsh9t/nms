package com.example.CosmoSchools.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequestDTO {

    @NotBlank(message = "El refreshToken es obligatorio")
    private String refreshToken;
}
