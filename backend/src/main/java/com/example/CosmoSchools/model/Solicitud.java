package com.example.CosmoSchools.model;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "solicitudes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Solicitud {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fechaHoraSolicitud;

    @Column(nullable = false, length = 150)
    private String ubicacionUso;

    @Column(nullable = false)
    private LocalDateTime horaLimite;

    // columnDefinition evita que MySQL cree la columna como ENUM nativo, que no admite estados nuevos sin migrar
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20)")
    private EstadoSolicitud estado;

    // Explicación que escribe el admin al rechazar
    @Column(length = 250)
    private String motivoRechazo;

    // Momento en que se registró la devolución del material
    private LocalDateTime fechaHoraDevolucion;

    // true mientras esta solicitud tiene stock apartado del inventario.
    // Es null en las solicitudes creadas antes de que existiera la reserva de stock.
    private Boolean stockReservado;

    // Evita mandar la notificación de atraso más de una vez por solicitud (el chequeo
    // periódico corre cada pocos minutos, así que sin esto se repetiría cada vez).
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private boolean notificadoAtraso = false;

    // Dueño de la relación: aquí vive la FK hacia el profesor que solicita
    @ManyToOne
    @JoinColumn(name = "fk_solicitante")
    private Usuario solicitante;

    // Segunda relación hacia Usuario: el admin que aprobó/rechazó (puede ser null mientras está pendiente)
    @ManyToOne
    @JoinColumn(name = "fk_revisado_por")
    private Usuario revisadoPor;

    // Lado inverso: la FK real vive en DetalleSolicitud
    // orphanRemoval: al editar una solicitud, las líneas que se quitan se borran de la base de datos
    @OneToMany(mappedBy = "solicitud", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<DetalleSolicitud> detalles;
}