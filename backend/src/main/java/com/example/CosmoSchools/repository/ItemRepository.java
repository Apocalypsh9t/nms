package com.example.CosmoSchools.repository;

import com.example.CosmoSchools.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByCantidadDisponibleGreaterThanAndActivoTrue(Integer cantidad);

    // Resta stock en una sola sentencia atómica: si dos solicitudes compiten por lo último que queda,
    // solo una lo consigue (devuelve 0 filas afectadas cuando no alcanza).
    @Modifying
    @Query("update Item i set i.cantidadDisponible = i.cantidadDisponible - :cantidad " +
           "where i.id = :id and i.cantidadDisponible >= :cantidad")
    int descontarStock(@Param("id") Long id, @Param("cantidad") int cantidad);

    @Modifying
    @Query("update Item i set i.cantidadDisponible = i.cantidadDisponible + :cantidad where i.id = :id")
    int devolverStock(@Param("id") Long id, @Param("cantidad") int cantidad);

    // Lee el stock directo de la base de datos (sin pasar por la entidad ya cargada en memoria)
    @Query("select i.cantidadDisponible from Item i where i.id = :id")
    Integer obtenerStock(@Param("id") Long id);
}
