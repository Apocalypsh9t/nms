package com.example.CosmoSchools.service;

import com.example.CosmoSchools.dto.*;
import com.example.CosmoSchools.exception.RecursoNoEncontradoException;
import com.example.CosmoSchools.mapper.SolicitudMapper;
import com.example.CosmoSchools.model.*;
import com.example.CosmoSchools.repository.ItemRepository;
import com.example.CosmoSchools.repository.SolicitudRepository;
import com.example.CosmoSchools.repository.UsuarioRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Ciclo de vida de una solicitud:
 *
 *   PENDIENTE --aprobar--> APROBADA --devolver--> DEVUELTA
 *       |--rechazar (con motivo)--> RECHAZADA
 *       |--cancelar (el solicitante)--> CANCELADA
 *
 * El stock se aparta del inventario al crear la solicitud y vuelve al inventario cuando
 * se rechaza, se cancela o se devuelve el material. Así dos solicitudes nunca se disputan
 * la misma unidad.
 */
@Service
public class SolicitudService {

    private static final int LARGO_MAXIMO_MOTIVO = 250;

    private final SolicitudRepository solicitudRepository;
    private final ItemRepository itemRepository;
    private final UsuarioRepository usuarioRepository;
    private final SolicitudMapper solicitudMapper;
    private final NotificacionService notificacionService;

    public SolicitudService(SolicitudRepository solicitudRepository, ItemRepository itemRepository,
                             UsuarioRepository usuarioRepository, SolicitudMapper solicitudMapper,
                             NotificacionService notificacionService) {
        this.solicitudRepository = solicitudRepository;
        this.itemRepository = itemRepository;
        this.usuarioRepository = usuarioRepository;
        this.solicitudMapper = solicitudMapper;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public SolicitudResponseDTO crear(SolicitudRequestDTO dto, Long solicitanteId) {
        Usuario solicitante = buscarUsuario(solicitanteId);

        Solicitud solicitud = new Solicitud();
        solicitud.setFechaHoraSolicitud(LocalDateTime.now());
        solicitud.setEstado(EstadoSolicitud.PENDIENTE);
        solicitud.setSolicitante(solicitante);
        solicitud.setDetalles(new ArrayList<>());
        aplicarDatosYApartarStock(solicitud, dto);

        Solicitud guardada = solicitudRepository.save(solicitud);
        notificacionService.crearParaVarios(
                usuarioRepository.findByRol(RolUsuario.ADMIN),
                TipoNotificacion.SOLICITUD_CREADA,
                solicitante.getNombre() + " pidió material para " + guardada.getUbicacionUso(),
                guardada.getId());

        return solicitudMapper.toResponseDTO(guardada);
    }

    // El solicitante puede editar su solicitud mientras siga pendiente
    @Transactional
    public SolicitudResponseDTO actualizar(Long solicitudId, SolicitudRequestDTO dto, Long solicitanteId) {
        Solicitud solicitud = buscarSolicitud(solicitudId);
        validarPropietario(solicitud, solicitanteId);
        validarEstado(solicitud, EstadoSolicitud.PENDIENTE, "editar");

        // Se libera lo apartado antes y se aparta de nuevo con los datos nuevos.
        // Si el nuevo pedido no tiene stock, la excepción deshace toda la transacción.
        liberarStockSiEstabaApartado(solicitud);
        solicitud.getDetalles().clear();
        aplicarDatosYApartarStock(solicitud, dto);

        return solicitudMapper.toResponseDTO(solicitudRepository.save(solicitud));
    }

    @Transactional
    public SolicitudResponseDTO cancelar(Long solicitudId, Long solicitanteId) {
        Solicitud solicitud = buscarSolicitud(solicitudId);
        validarPropietario(solicitud, solicitanteId);
        validarEstado(solicitud, EstadoSolicitud.PENDIENTE, "cancelar");

        liberarStockSiEstabaApartado(solicitud);
        solicitud.setEstado(EstadoSolicitud.CANCELADA);

        return solicitudMapper.toResponseDTO(solicitudRepository.save(solicitud));
    }

    public List<SolicitudResponseDTO> obtenerTodas() {
        return solicitudMapper.toResponseDTOList(solicitudRepository.findAll());
    }

    public List<SolicitudResponseDTO> obtenerPendientes() {
        return solicitudMapper.toResponseDTOList(solicitudRepository.findByEstado(EstadoSolicitud.PENDIENTE));
    }

    public List<SolicitudResponseDTO> obtenerHistorialDe(Long usuarioId) {
        Usuario usuario = buscarUsuario(usuarioId);
        return solicitudMapper.toResponseDTOList(solicitudRepository.findBySolicitante(usuario));
    }

    // Acciones del administrador: aprobar, rechazar (con motivo) o registrar la devolución
    @Transactional
    public SolicitudResponseDTO cambiarEstado(Long solicitudId, EstadoSolicitud nuevoEstado,
                                              Long adminId, String motivo) {
        Solicitud solicitud = buscarSolicitud(solicitudId);
        Usuario admin = buscarUsuario(adminId);

        if (admin.getRol() != RolUsuario.ADMIN) {
            throw new IllegalStateException("Solo un administrador puede gestionar solicitudes");
        }

        switch (nuevoEstado) {
            case APROBADA -> aprobar(solicitud, admin);
            case RECHAZADA -> rechazar(solicitud, admin, motivo);
            case DEVUELTA -> registrarDevolucion(solicitud);
            default -> throw new IllegalStateException(
                    "Un administrador solo puede aprobar, rechazar o marcar como devuelta una solicitud");
        }

        return solicitudMapper.toResponseDTO(solicitudRepository.save(solicitud));
    }

    private void aprobar(Solicitud solicitud, Usuario admin) {
        validarEstado(solicitud, EstadoSolicitud.PENDIENTE, "aprobar");

        // Solicitudes creadas antes de que existiera la reserva: el stock se aparta recién ahora
        if (!Boolean.TRUE.equals(solicitud.getStockReservado())) {
            apartarStock(solicitud.getDetalles());
            solicitud.setStockReservado(true);
        }

        solicitud.setEstado(EstadoSolicitud.APROBADA);
        solicitud.setRevisadoPor(admin);

        notificacionService.crear(solicitud.getSolicitante(), TipoNotificacion.SOLICITUD_APROBADA,
                "Tu solicitud para " + solicitud.getUbicacionUso() + " fue aprobada", solicitud.getId());
    }

    private void rechazar(Solicitud solicitud, Usuario admin, String motivo) {
        validarEstado(solicitud, EstadoSolicitud.PENDIENTE, "rechazar");

        if (motivo == null || motivo.isBlank()) {
            throw new IllegalStateException("Indica el motivo del rechazo");
        }
        String motivoLimpio = motivo.trim();
        if (motivoLimpio.length() > LARGO_MAXIMO_MOTIVO) {
            throw new IllegalStateException("El motivo no puede superar los " + LARGO_MAXIMO_MOTIVO + " caracteres");
        }

        liberarStockSiEstabaApartado(solicitud);
        solicitud.setEstado(EstadoSolicitud.RECHAZADA);
        solicitud.setMotivoRechazo(motivoLimpio);
        solicitud.setRevisadoPor(admin);

        notificacionService.crear(solicitud.getSolicitante(), TipoNotificacion.SOLICITUD_RECHAZADA,
                "Tu solicitud para " + solicitud.getUbicacionUso() + " fue rechazada: " + motivoLimpio, solicitud.getId());
    }

    private void registrarDevolucion(Solicitud solicitud) {
        validarEstado(solicitud, EstadoSolicitud.APROBADA, "marcar como devuelta");

        // Una solicitud aprobada siempre tiene el stock descontado (también las anteriores a la reserva)
        liberarStock(solicitud.getDetalles());
        solicitud.setStockReservado(false);
        solicitud.setEstado(EstadoSolicitud.DEVUELTA);
        solicitud.setFechaHoraDevolucion(LocalDateTime.now());

        notificacionService.crear(solicitud.getSolicitante(), TipoNotificacion.SOLICITUD_DEVUELTA,
                "Se registró la devolución del material de " + solicitud.getUbicacionUso(), solicitud.getId());
    }

    // Corre solo, cada pocos minutos: revisa solicitudes aprobadas cuya hora límite ya pasó
    // y todavía no se marcaron como devueltas, y avisa una sola vez (no en cada corrida).
    @Scheduled(fixedRate = 5 * 60 * 1000)
    @Transactional
    public void notificarAtrasos() {
        List<Solicitud> atrasadas = solicitudRepository
                .findByEstadoAndHoraLimiteBeforeAndNotificadoAtrasoFalse(EstadoSolicitud.APROBADA, LocalDateTime.now());

        for (Solicitud solicitud : atrasadas) {
            notificacionService.crear(solicitud.getSolicitante(), TipoNotificacion.SOLICITUD_ATRASADA,
                    "El material de " + solicitud.getUbicacionUso() + " pasó su hora límite sin devolverse",
                    solicitud.getId());
            notificacionService.crearParaVarios(usuarioRepository.findByRol(RolUsuario.ADMIN),
                    TipoNotificacion.SOLICITUD_ATRASADA,
                    "Atraso: " + solicitud.getSolicitante().getNombre() + " no ha devuelto el material de "
                            + solicitud.getUbicacionUso(),
                    solicitud.getId());
            solicitud.setNotificadoAtraso(true);
            solicitudRepository.save(solicitud);
        }
    }

    // ---------- Stock ----------

    // Copia los datos del pedido a la solicitud, arma sus líneas y aparta el stock de cada item
    private void aplicarDatosYApartarStock(Solicitud solicitud, SolicitudRequestDTO dto) {
        solicitud.setUbicacionUso(dto.getUbicacionUso());
        solicitud.setHoraLimite(dto.getHoraLimite());

        for (DetalleSolicitudRequestDTO detalleDto : dto.getDetalles()) {
            Item item = itemRepository.findById(detalleDto.getItemId())
                    .orElseThrow(() -> new RecursoNoEncontradoException(
                            "Item no encontrado con id " + detalleDto.getItemId()));

            DetalleSolicitud detalle = new DetalleSolicitud();
            detalle.setSolicitud(solicitud);
            detalle.setItem(item);
            detalle.setCantidadSolicitada(detalleDto.getCantidadSolicitada());
            solicitud.getDetalles().add(detalle);
        }

        apartarStock(solicitud.getDetalles());
        solicitud.setStockReservado(true);
    }

    private void apartarStock(List<DetalleSolicitud> detalles) {
        for (DetalleSolicitud detalle : detalles) {
            Item item = detalle.getItem();
            int cantidad = detalle.getCantidadSolicitada();

            if (itemRepository.descontarStock(item.getId(), cantidad) == 0) {
                Integer disponibles = itemRepository.obtenerStock(item.getId());
                throw new IllegalStateException("Stock insuficiente para el item: " + item.getNombre()
                        + " (disponibles: " + (disponibles == null ? 0 : disponibles) + ")");
            }
        }
    }

    private void liberarStock(List<DetalleSolicitud> detalles) {
        for (DetalleSolicitud detalle : detalles) {
            itemRepository.devolverStock(detalle.getItem().getId(), detalle.getCantidadSolicitada());
        }
    }

    private void liberarStockSiEstabaApartado(Solicitud solicitud) {
        if (Boolean.TRUE.equals(solicitud.getStockReservado())) {
            liberarStock(solicitud.getDetalles());
            solicitud.setStockReservado(false);
        }
    }

    // ---------- Búsquedas y validaciones ----------

    private Solicitud buscarSolicitud(Long id) {
        return solicitudRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud no encontrada"));
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }

    private void validarEstado(Solicitud solicitud, EstadoSolicitud esperado, String accion) {
        if (solicitud.getEstado() != esperado) {
            throw new IllegalStateException(
                    "No se puede " + accion + " una solicitud " + solicitud.getEstado().name().toLowerCase());
        }
    }

    private void validarPropietario(Solicitud solicitud, Long solicitanteId) {
        if (solicitud.getSolicitante() == null || !solicitud.getSolicitante().getId().equals(solicitanteId)) {
            throw new IllegalStateException("Solo puedes modificar tus propias solicitudes");
        }
    }
}
