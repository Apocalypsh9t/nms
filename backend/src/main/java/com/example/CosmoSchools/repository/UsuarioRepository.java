package com.example.CosmoSchools.repository;

import com.example.CosmoSchools.model.RolUsuario;
import com.example.CosmoSchools.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByRol(RolUsuario rol);
}