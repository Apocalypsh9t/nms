package com.example.CosmoSchools.mapper;

import com.example.CosmoSchools.dto.SolicitudResponseDTO;
import com.example.CosmoSchools.model.Solicitud;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = DetalleSolicitudMapper.class)
public interface SolicitudMapper {

    @Mapping(target = "solicitanteId", source = "solicitante.id")
    @Mapping(target = "nombreSolicitante", source = "solicitante.nombre")
    @Mapping(target = "nombreRevisadoPor", source = "revisadoPor.nombre")
    SolicitudResponseDTO toResponseDTO(Solicitud entidad);

    List<SolicitudResponseDTO> toResponseDTOList(List<Solicitud> entidades);
}