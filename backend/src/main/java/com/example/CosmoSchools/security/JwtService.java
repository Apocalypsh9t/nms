package com.example.CosmoSchools.security;

import com.example.CosmoSchools.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Genera y valida los tokens JWT que reemplazan el "adminId"/"solicitanteId" que antes
 * mandaba el frontend por parámetro. El token lleva el id del usuario y su rol firmados,
 * así que el backend ya no necesita confiar en lo que diga el cliente.
 */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${jwt.secret}") String secret, @Value("${jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generarToken(Usuario usuario) {
        Date ahora = new Date();
        Date expira = new Date(ahora.getTime() + expirationMs);
        return Jwts.builder()
                .subject(usuario.getId().toString())
                .claim("rol", usuario.getRol().name())
                .issuedAt(ahora)
                .expiration(expira)
                .signWith(key)
                .compact();
    }

    // Lanza JwtException si el token es inválido, expiró o fue manipulado
    public Datos validarYExtraer(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return new Datos(Long.valueOf(claims.getSubject()), claims.get("rol", String.class));
    }

    public record Datos(Long usuarioId, String rol) {}
}
