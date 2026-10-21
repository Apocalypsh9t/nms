package com.example.CosmoSchools.repository;

import com.example.CosmoSchools.model.DetalleSolicitud;
import com.example.CosmoSchools.model.Solicitud;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleSolicitudRepository extends JpaRepository<DetalleSolicitud, Long> {

    List<DetalleSolicitud> findBySolicitud(Solicitud solicitud);

    // Para mostrarle al admin qué solicitud(es) bloquean el borrado de un item (en vez de
    // solo decir "está en uso" sin más contexto), usado al dar de baja en ItemService.
    @org.springframework.data.jpa.repository.Query(
            "select distinct d.solicitud.id from DetalleSolicitud d where d.item.id = :itemId")
    List<Long> buscarIdsDeSolicitudesQueUsanItem(@org.springframework.data.repository.query.Param("itemId") Long itemId);
}