package com.example.CosmoSchools.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificacionResponseDTO {
    private Long id;
    private String tipo;
    private String mensaje;
    private Long solicitudId;
    private LocalDateTime fechaCreacion;
    private boolean leida;
}
