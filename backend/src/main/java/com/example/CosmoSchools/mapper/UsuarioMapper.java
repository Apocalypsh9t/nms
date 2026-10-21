package com.example.CosmoSchools.mapper;

import com.example.CosmoSchools.dto.UsuarioRequestDTO;
import com.example.CosmoSchools.dto.UsuarioResponseDTO;
import com.example.CosmoSchools.model.Usuario;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    // DTO -> Entidad (para el registro)
    Usuario toEntity(UsuarioRequestDTO dto);

    // Entidad -> DTO (para la respuesta, sin password)
    UsuarioResponseDTO toResponseDTO(Usuario entidad);
}