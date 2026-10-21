package com.example.CosmoSchools.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A quién le aparece esta notificación (el profesor dueño de la solicitud, o un admin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fk_usuario", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoNotificacion tipo;

    @Column(nullable = false, length = 300)
    private String mensaje;

    // Para poder llevar al usuario directo a la solicitud desde la notificación
    private Long solicitudId;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean leida = false;
}
