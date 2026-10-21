package com.example.CosmoSchools.model;

public enum EstadoSolicitud {
    PENDIENTE,   // esperando revisión; el stock ya está apartado
    APROBADA,    // el material está prestado
    RECHAZADA,   // un admin la rechazó (con motivo); el stock se libera
    DEVUELTA,    // el material fue devuelto; el stock vuelve al inventario
    CANCELADA    // el solicitante la canceló mientras estaba pendiente; el stock se libera
}
