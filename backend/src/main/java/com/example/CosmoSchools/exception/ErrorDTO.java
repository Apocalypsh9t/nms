package com.example.CosmoSchools.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ErrorDTO {
    private String codigoEstado;
    private String mensaje;
    private LocalDateTime marcaDeTiempo;
}