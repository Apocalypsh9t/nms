package com.example.CosmoSchools.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CambiarPasswordRequestDTO {

    @NotBlank(message = "Debes indicar tu contraseña actual")
    private String passwordActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 4, message = "La nueva contraseña debe tener al menos 4 caracteres")
    private String passwordNueva;
}
