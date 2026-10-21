package com.example.CosmoSchools.config;

import com.example.CosmoSchools.model.RolUsuario;
import com.example.CosmoSchools.model.Usuario;
import com.example.CosmoSchools.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// El registro público solo crea profesores, así que en un servidor recién montado nadie
// podría administrar nada. Al arrancar, si NO existe ningún ADMIN y se definieron
// ADMIN_EMAIL y ADMIN_PASSWORD, se crea ese primer admin. Si ya hay uno, no hace nada,
// así que se puede dejar configurado sin riesgo de duplicar ni pisar contraseñas.
@Configuration
public class AdminInicialConfig {

    private static final Logger log = LoggerFactory.getLogger(AdminInicialConfig.class);
    private static final int MIN_LARGO_PASSWORD = 8;

    @Bean
    public CommandLineRunner crearAdminInicial(UsuarioRepository usuarioRepository,
                                               @Value("${admin.inicial.email:}") String email,
                                               @Value("${admin.inicial.password:}") String password,
                                               @Value("${admin.inicial.nombre:Administrador}") String nombre) {
        return args -> {
            if (!usuarioRepository.findByRol(RolUsuario.ADMIN).isEmpty()) {
                return;
            }
            if (email.isBlank() || password.isBlank()) {
                log.warn("No existe ningún usuario ADMIN. Define ADMIN_EMAIL y ADMIN_PASSWORD "
                        + "y reinicia la aplicación para crear el primero.");
                return;
            }
            if (password.length() < MIN_LARGO_PASSWORD) {
                log.error("ADMIN_PASSWORD debe tener al menos {} caracteres; no se creó el admin inicial.",
                        MIN_LARGO_PASSWORD);
                return;
            }

            // Si el email ya existe como profesor, se asciende a ADMIN en vez de fallar por duplicado.
            Usuario admin = usuarioRepository.findByEmail(email).orElseGet(Usuario::new);
            admin.setEmail(email);
            if (admin.getNombre() == null) {
                admin.setNombre(nombre);
            }
            admin.setPassword(new BCryptPasswordEncoder().encode(password));
            admin.setRol(RolUsuario.ADMIN);
            usuarioRepository.save(admin);
            log.info("Usuario ADMIN inicial creado: {}", email);
        };
    }
}
