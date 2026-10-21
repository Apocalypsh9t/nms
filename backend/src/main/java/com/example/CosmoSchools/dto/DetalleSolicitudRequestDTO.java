package com.example.CosmoSchools.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class DetalleSolicitudRequestDTO {

    @NotNull
    private Long itemId;

    @NotNull
    @Positive
    private Integer cantidadSolicitada;
}