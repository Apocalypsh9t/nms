package com.example.CosmoSchools.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SolicitudRequestDTO {

    @NotBlank
    private String ubicacionUso;

    @Future
    private LocalDateTime horaLimite;

    // @Valid hace que también se validen las líneas (item obligatorio, cantidad positiva)
    @NotEmpty
    @Valid
    private List<DetalleSolicitudRequestDTO> detalles;
}