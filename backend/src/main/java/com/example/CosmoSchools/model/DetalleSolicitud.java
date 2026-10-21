package com.example.CosmoSchools.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "detalle_solicitudes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleSolicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Dueño de la FK hacia Solicitud
    @ManyToOne
    @JoinColumn(name = "fk_solicitud")
    @ToString.Exclude
    private Solicitud solicitud;

    // Dueño de la FK hacia Item
    @ManyToOne
    @JoinColumn(name = "fk_item")
    private Item item;

    @Column(nullable = false)
    private Integer cantidadSolicitada;
}