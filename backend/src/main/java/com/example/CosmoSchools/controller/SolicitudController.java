package com.example.CosmoSchools.controller;

import com.example.CosmoSchools.dto.SolicitudRequestDTO;
import com.example.CosmoSchools.dto.SolicitudResponseDTO;
import com.example.CosmoSchools.model.EstadoSolicitud;
import com.example.CosmoSchools.service.SolicitudService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/solicitudes")
public class SolicitudController {

    private final SolicitudService solicitudService;

    public SolicitudController(SolicitudService solicitudService) {
        this.solicitudService = solicitudService;
    }

    // El solicitante ya no se manda por parámetro: sale del token JWT del usuario logueado.
    @PostMapping
    public ResponseEntity<SolicitudResponseDTO> crear(@Valid @RequestBody SolicitudRequestDTO dto,
                                                        @AuthenticationPrincipal Long solicitanteId) {
        SolicitudResponseDTO creada = solicitudService.crear(dto, solicitanteId);
        return ResponseEntity.status(HttpStatus.CREATED).body(creada);
    }

    // Editar una solicitud propia que sigue pendiente
    @PutMapping("/{id}")
    public ResponseEntity<SolicitudResponseDTO> actualizar(@PathVariable Long id,
                                                             @Valid @RequestBody SolicitudRequestDTO dto,
                                                             @AuthenticationPrincipal Long solicitanteId) {
        return ResponseEntity.ok(solicitudService.actualizar(id, dto, solicitanteId));
    }

    // Cancelar una solicitud propia que sigue pendiente
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<SolicitudResponseDTO> cancelar(@PathVariable Long id,
                                                           @AuthenticationPrincipal Long solicitanteId) {
        return ResponseEntity.ok(solicitudService.cancelar(id, solicitanteId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<SolicitudResponseDTO>> obtenerTodas() {
        return ResponseEntity.ok(solicitudService.obtenerTodas());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/pendientes")
    public ResponseEntity<List<SolicitudResponseDTO>> obtenerPendientes() {
        return ResponseEntity.ok(solicitudService.obtenerPendientes());
    }

    // El historial de "mías": siempre el propio usuario autenticado, nunca uno ajeno
    @GetMapping("/mias")
    public ResponseEntity<List<SolicitudResponseDTO>> obtenerMiHistorial(@AuthenticationPrincipal Long usuarioId) {
        return ResponseEntity.ok(solicitudService.obtenerHistorialDe(usuarioId));
    }

    // El admin que aprueba/rechaza/registra la devolución sale del token, no de un parámetro.
    // El motivo es obligatorio solo al rechazar.
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/estado")
    public ResponseEntity<SolicitudResponseDTO> cambiarEstado(@PathVariable Long id,
                                                               @RequestParam EstadoSolicitud nuevoEstado,
                                                               @AuthenticationPrincipal Long adminId,
                                                               @RequestParam(required = false) String motivo) {
        return ResponseEntity.ok(solicitudService.cambiarEstado(id, nuevoEstado, adminId, motivo));
    }
}
