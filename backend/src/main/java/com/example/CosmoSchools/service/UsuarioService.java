package com.example.CosmoSchools.service;

import com.example.CosmoSchools.dto.ActualizarPerfilRequestDTO;
import com.example.CosmoSchools.dto.LoginResponseDTO;
import com.example.CosmoSchools.dto.UsuarioRequestDTO;
import com.example.CosmoSchools.dto.UsuarioResponseDTO;
import com.example.CosmoSchools.exception.EmailDuplicadoException;
import com.example.CosmoSchools.exception.RecursoNoEncontradoException;
import com.example.CosmoSchools.mapper.UsuarioMapper;
import com.example.CosmoSchools.model.RolUsuario;
import com.example.CosmoSchools.model.Usuario;
import com.example.CosmoSchools.repository.UsuarioRepository;
import com.example.CosmoSchools.security.JwtService;
import com.example.CosmoSchools.security.LoginRateLimiter;
import com.example.CosmoSchools.security.RefreshTokenService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final JwtService jwtService;
    private final LoginRateLimiter loginRateLimiter;
    private final RefreshTokenService refreshTokenService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioService(UsuarioRepository usuarioRepository, UsuarioMapper usuarioMapper,
                           JwtService jwtService, LoginRateLimiter loginRateLimiter,
                           RefreshTokenService refreshTokenService) {
        this.usuarioRepository = usuarioRepository;
        this.usuarioMapper = usuarioMapper;
        this.jwtService = jwtService;
        this.loginRateLimiter = loginRateLimiter;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public UsuarioResponseDTO registrar(UsuarioRequestDTO dto) {
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new EmailDuplicadoException("Ya existe una cuenta con ese email");
        }

        // El registro público solo crea cuentas de profesor. Una cuenta ADMIN se da de alta
        // aparte (por otro admin o directamente en la base), nunca por esta vía abierta.
        dto.setRol(RolUsuario.PROFESOR);

        Usuario usuario = usuarioMapper.toEntity(dto);
        usuario.setPassword(passwordEncoder.encode(dto.getPassword())); // nunca se guarda en texto plano
        Usuario guardado = usuarioRepository.save(usuario);
        return usuarioMapper.toResponseDTO(guardado);
    }

    public LoginResponseDTO login(String email, String passwordPlano) {
        loginRateLimiter.verificarNoBloqueado(email);

        Usuario usuario = usuarioRepository.findByEmail(email).orElse(null);
        if (usuario == null || !passwordEncoder.matches(passwordPlano, usuario.getPassword())) {
            loginRateLimiter.registrarFallo(email);
            throw new RecursoNoEncontradoException("Credenciales inválidas");
        }

        loginRateLimiter.registrarExito(email);
        String token = jwtService.generarToken(usuario);
        String refreshToken = refreshTokenService.crear(usuario);
        return new LoginResponseDTO(token, refreshToken, usuarioMapper.toResponseDTO(usuario));
    }

    // El frontend llama esto solo, sin que el usuario haga nada, cuando el access token
    // (de vida corta) está por vencer o ya venció, para conseguir uno nuevo sin pedirle
    // la contraseña de nuevo. El refresh token usado se invalida y se entrega uno nuevo.
    public LoginResponseDTO refrescarToken(String refreshTokenPlano) {
        RefreshTokenService.ResultadoRotacion resultado = refreshTokenService.validarYRotar(refreshTokenPlano);
        String nuevoAccessToken = jwtService.generarToken(resultado.usuario());
        return new LoginResponseDTO(nuevoAccessToken, resultado.nuevoRefreshToken(),
                usuarioMapper.toResponseDTO(resultado.usuario()));
    }

    public void logout(String refreshTokenPlano) {
        refreshTokenService.revocar(refreshTokenPlano);
    }

    @Transactional
    public UsuarioResponseDTO actualizarPerfil(Long usuarioId, ActualizarPerfilRequestDTO dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        usuarioRepository.findByEmail(dto.getEmail()).ifPresent(otro -> {
            if (!otro.getId().equals(usuarioId)) {
                throw new EmailDuplicadoException("Ya existe una cuenta con ese email");
            }
        });

        usuario.setNombre(dto.getNombre().trim());
        usuario.setEmail(dto.getEmail().trim());
        return usuarioMapper.toResponseDTO(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarPassword(Long usuarioId, String passwordActual, String passwordNueva) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            throw new IllegalStateException("La contraseña actual no es correcta");
        }

        usuario.setPassword(passwordEncoder.encode(passwordNueva));
        usuarioRepository.save(usuario);
    }
}
