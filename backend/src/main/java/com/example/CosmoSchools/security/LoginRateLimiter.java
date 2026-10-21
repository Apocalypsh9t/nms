package com.example.CosmoSchools.security;

import com.example.CosmoSchools.exception.DemasiadosIntentosException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Freno simple contra fuerza bruta en el login: bloquea un email por un rato después
 * de varios intentos fallidos seguidos. Vive en memoria (alcanza para una sola instancia
 * del backend); si algún día se corre en varias instancias a la vez, esto tendría que
 * moverse a algo compartido como Redis.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_INTENTOS = 5;
    private static final Duration VENTANA_BLOQUEO = Duration.ofMinutes(15);

    private final ConcurrentHashMap<String, Intentos> porEmail = new ConcurrentHashMap<>();

    public void verificarNoBloqueado(String email) {
        Intentos intentos = porEmail.get(normalizar(email));
        if (intentos == null) return;

        if (intentos.fallos >= MAX_INTENTOS && Instant.now().isBefore(intentos.bloqueadoHasta)) {
            long minutosRestantes = Math.max(1, Duration.between(Instant.now(), intentos.bloqueadoHasta).toMinutes());
            throw new DemasiadosIntentosException(
                    "Demasiados intentos fallidos. Intenta de nuevo en " + minutosRestantes + " minuto(s).");
        }
    }

    public void registrarFallo(String email) {
        String clave = normalizar(email);
        porEmail.compute(clave, (k, actual) -> {
            Intentos intentos = (actual == null) ? new Intentos() : actual;
            intentos.fallos++;
            if (intentos.fallos >= MAX_INTENTOS) {
                intentos.bloqueadoHasta = Instant.now().plus(VENTANA_BLOQUEO);
            }
            return intentos;
        });
    }

    public void registrarExito(String email) {
        porEmail.remove(normalizar(email));
    }

    private String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private static class Intentos {
        int fallos = 0;
        Instant bloqueadoHasta = Instant.EPOCH;
    }
}
