package com.example.CosmoSchools.mapper;

import com.example.CosmoSchools.dto.DetalleSolicitudResponseDTO;
import com.example.CosmoSchools.model.DetalleSolicitud;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface DetalleSolicitudMapper {

    @Mapping(target = "itemId", source = "item.id")
    @Mapping(target = "nombreItem", source = "item.nombre")
    DetalleSolicitudResponseDTO toResponseDTO(DetalleSolicitud entidad);

    List<DetalleSolicitudResponseDTO> toResponseDTOList(List<DetalleSolicitud> entidades);
}