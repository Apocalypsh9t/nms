package com.example.CosmoSchools.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(length = 250)
    private String descripcion;

    @Column(nullable = false)
    private Integer cantidadDisponible;

    @Column(length = 100)
    private String ubicacionAlmacen;

    // Si el item ya fue usado en alguna solicitud (aunque esté rechazada o cancelada), no se
    // puede borrar de verdad por la relación en la base de datos: en ese caso se da de baja
    // (se oculta del inventario activo) en vez de eliminarlo, para no romper ese historial.
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 1")
    private Boolean activo = true;
}