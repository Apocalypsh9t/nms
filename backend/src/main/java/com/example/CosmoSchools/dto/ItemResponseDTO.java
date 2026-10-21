package com.example.CosmoSchools.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemResponseDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private Integer cantidadDisponible;
    private String ubicacionAlmacen;
    private Boolean activo;
}