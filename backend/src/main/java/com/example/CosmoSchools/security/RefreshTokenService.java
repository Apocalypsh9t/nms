package com.example.CosmoSchools.security;

import com.example.CosmoSchools.exception.TokenInvalidoException;
import com.example.CosmoSchools.model.RefreshToken;
import com.example.CosmoSchools.model.Usuario;
import com.example.CosmoSchools.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

/**
 * El access token (JWT) dura poco a propósito, para que si alguien lo roba no sirva por
 * mucho tiempo. El refresh token dura más y vive en la base (solo su hash) para poder
 * revocarlo si hace falta; cada vez que se usa se "rota": se invalida y se entrega uno
 * nuevo, así que un refresh token robado y reusado más tarde que el legítimo ya no sirve.
 */
@Component
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final Duration duracion;
    private final SecureRandom random = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                                @Value("${jwt.refresh-expiration-ms:604800000}") long duracionMs) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.duracion = Duration.ofMillis(duracionMs);
    }

    @Transactional
    public String crear(Usuario usuario) {
        String tokenPlano = generarTokenAleatorio();
        RefreshToken entidad = new RefreshToken();
        entidad.setTokenHash(hash(tokenPlano));
        entidad.setUsuario(usuario);
        entidad.setExpiraEn(Instant.now().plus(duracion));
        entidad.setRevocado(false);
        refreshTokenRepository.save(entidad);
        return tokenPlano;
    }

    // Valida el token recibido, lo revoca (rotación) y entrega uno nuevo junto con el usuario dueño.
    @Transactional
    public ResultadoRotacion validarYRotar(String tokenPlano) {
        RefreshToken existente = refreshTokenRepository.findByTokenHash(hash(tokenPlano))
                .orElseThrow(() -> new TokenInvalidoException("Sesión inválida, vuelve a iniciar sesión"));

        if (existente.isRevocado() || existente.getExpiraEn().isBefore(Instant.now())) {
            throw new TokenInvalidoException("Sesión expirada, vuelve a iniciar sesión");
        }

        existente.setRevocado(true);
        refreshTokenRepository.save(existente);

        String nuevoToken = crear(existente.getUsuario());
        return new ResultadoRotacion(existente.getUsuario(), nuevoToken);
    }

    @Transactional
    public void revocar(String tokenPlano) {
        refreshTokenRepository.findByTokenHash(hash(tokenPlano))
                .ifPresent(rt -> {
                    rt.setRevocado(true);
                    refreshTokenRepository.save(rt);
                });
    }

    private String generarTokenAleatorio() {
        byte[] bytes = new byte[48];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String tokenPlano) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(tokenPlano.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    public record ResultadoRotacion(Usuario usuario, String nuevoRefreshToken) {}
}
