package com.example.CosmoSchools.controller;

import com.example.CosmoSchools.dto.MensajeDTO;
import com.example.CosmoSchools.dto.NotificacionResponseDTO;
import com.example.CosmoSchools.service.NotificacionService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping("/mias")
    public List<NotificacionResponseDTO> listarMias(@AuthenticationPrincipal Long usuarioId) {
        return notificacionService.listarMias(usuarioId);
    }

    @GetMapping("/no-leidas/contador")
    public Map<String, Long> contarNoLeidas(@AuthenticationPrincipal Long usuarioId) {
        return Map.of("noLeidas", notificacionService.contarNoLeidas(usuarioId));
    }

    @PutMapping("/{id}/leida")
    public MensajeDTO marcarLeida(@PathVariable Long id, @AuthenticationPrincipal Long usuarioId) {
        notificacionService.marcarLeida(id, usuarioId);
        return new MensajeDTO("Notificación marcada como leída");
    }

    @PutMapping("/leer-todas")
    public MensajeDTO marcarTodasLeidas(@AuthenticationPrincipal Long usuarioId) {
        notificacionService.marcarTodasLeidas(usuarioId);
        return new MensajeDTO("Todas las notificaciones marcadas como leídas");
    }
}
