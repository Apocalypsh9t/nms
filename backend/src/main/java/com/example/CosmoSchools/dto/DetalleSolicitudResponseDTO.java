package com.example.CosmoSchools.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleSolicitudResponseDTO {

    private Long itemId;
    private String nombreItem;
    private Integer cantidadSolicitada;
}