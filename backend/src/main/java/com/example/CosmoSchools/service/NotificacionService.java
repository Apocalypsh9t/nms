package com.example.CosmoSchools.service;

import com.example.CosmoSchools.dto.NotificacionResponseDTO;
import com.example.CosmoSchools.model.Notificacion;
import com.example.CosmoSchools.model.TipoNotificacion;
import com.example.CosmoSchools.model.Usuario;
import com.example.CosmoSchools.repository.NotificacionRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Notificaciones dentro de la app (sin correo): quedan guardadas en la base y el frontend
 * las consulta con polling; si el navegador dio permiso, además dispara una notificación
 * nativa del sistema operativo (ver Notificaciones.jsx en el frontend).
 */
@Service
public class NotificacionService {

    private static final int MAXIMO_A_MOSTRAR = 30;

    private final NotificacionRepository notificacionRepository;

    public NotificacionService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
    }

    @Transactional
    public void crear(Usuario destinatario, TipoNotificacion tipo, String mensaje, Long solicitudId) {
        Notificacion notificacion = new Notificacion();
        notificacion.setUsuario(destinatario);
        notificacion.setTipo(tipo);
        notificacion.setMensaje(mensaje);
        notificacion.setSolicitudId(solicitudId);
        notificacion.setFechaCreacion(LocalDateTime.now());
        notificacion.setLeida(false);
        notificacionRepository.save(notificacion);
    }

    @Transactional
    public void crearParaVarios(List<Usuario> destinatarios, TipoNotificacion tipo, String mensaje, Long solicitudId) {
        for (Usuario destinatario : destinatarios) {
            crear(destinatario, tipo, mensaje, solicitudId);
        }
    }

    public List<NotificacionResponseDTO> listarMias(Long usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByFechaCreacionDesc(usuarioId, PageRequest.of(0, MAXIMO_A_MOSTRAR))
                .stream()
                .map(n -> new NotificacionResponseDTO(
                        n.getId(), n.getTipo().name(), n.getMensaje(), n.getSolicitudId(), n.getFechaCreacion(), n.isLeida()))
                .toList();
    }

    public long contarNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public void marcarLeida(Long notificacionId, Long usuarioId) {
        notificacionRepository.findById(notificacionId).ifPresent(n -> {
            if (n.getUsuario().getId().equals(usuarioId)) {
                n.setLeida(true);
                notificacionRepository.save(n);
            }
        });
    }

    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {
        notificacionRepository.marcarTodasLeidas(usuarioId);
    }
}
