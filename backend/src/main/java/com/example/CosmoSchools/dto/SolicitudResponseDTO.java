package com.example.CosmoSchools.dto;

import com.example.CosmoSchools.model.EstadoSolicitud;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitudResponseDTO {

    private Long id;
    private LocalDateTime fechaHoraSolicitud;
    private String ubicacionUso;
    private LocalDateTime horaLimite;
    private EstadoSolicitud estado;
    private String motivoRechazo;
    private LocalDateTime fechaHoraDevolucion;
    private Boolean stockReservado;
    private Long solicitanteId;
    private String nombreSolicitante;
    private String nombreRevisadoPor;
    private List<DetalleSolicitudResponseDTO> detalles;
}