package com.example.CosmoSchools.controller;

import com.example.CosmoSchools.dto.ActualizarPerfilRequestDTO;
import com.example.CosmoSchools.dto.CambiarPasswordRequestDTO;
import com.example.CosmoSchools.dto.LoginResponseDTO;
import com.example.CosmoSchools.dto.MensajeDTO;
import com.example.CosmoSchools.dto.RefreshTokenRequestDTO;
import com.example.CosmoSchools.dto.UsuarioRequestDTO;
import com.example.CosmoSchools.dto.UsuarioResponseDTO;
import com.example.CosmoSchools.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponseDTO> registrar(@Valid @RequestBody UsuarioRequestDTO dto) {
        UsuarioResponseDTO creado = usuarioService.registrar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    // Devuelve el token JWT que el frontend debe mandar en el header
    // "Authorization: Bearer <token>" en el resto de los pedidos.
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestParam String email, @RequestParam String password) {
        LoginResponseDTO respuesta = usuarioService.login(email, password);
        return ResponseEntity.ok(respuesta);
    }

    // Público: el frontend lo llama solo (sin intervención del usuario) cuando el access
    // token vence, para conseguir uno nuevo sin pedir la contraseña otra vez.
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDTO> refrescar(@Valid @RequestBody RefreshTokenRequestDTO dto) {
        return ResponseEntity.ok(usuarioService.refrescarToken(dto.getRefreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<MensajeDTO> logout(@Valid @RequestBody RefreshTokenRequestDTO dto) {
        usuarioService.logout(dto.getRefreshToken());
        return ResponseEntity.ok(new MensajeDTO("Sesión cerrada"));
    }

    @PutMapping("/mi-perfil")
    public ResponseEntity<UsuarioResponseDTO> actualizarPerfil(@Valid @RequestBody ActualizarPerfilRequestDTO dto,
                                                                @AuthenticationPrincipal Long usuarioId) {
        return ResponseEntity.ok(usuarioService.actualizarPerfil(usuarioId, dto));
    }

    @PutMapping("/cambiar-password")
    public ResponseEntity<MensajeDTO> cambiarPassword(@Valid @RequestBody CambiarPasswordRequestDTO dto,
                                                       @AuthenticationPrincipal Long usuarioId) {
        usuarioService.cambiarPassword(usuarioId, dto.getPasswordActual(), dto.getPasswordNueva());
        return ResponseEntity.ok(new MensajeDTO("Contraseña actualizada"));
    }
}