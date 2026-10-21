package com.example.CosmoSchools.repository;

import com.example.CosmoSchools.model.EstadoSolicitud;
import com.example.CosmoSchools.model.Solicitud;
import com.example.CosmoSchools.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SolicitudRepository extends JpaRepository<Solicitud, Long> {

    List<Solicitud> findByEstado(EstadoSolicitud estado);

    List<Solicitud> findBySolicitante(Usuario solicitante);

    // Para el chequeo periódico de atrasos: aprobadas, con la hora límite ya pasada,
    // que todavía no generaron su notificación de atraso.
    List<Solicitud> findByEstadoAndHoraLimiteBeforeAndNotificadoAtrasoFalse(EstadoSolicitud estado, LocalDateTime ahora);
}