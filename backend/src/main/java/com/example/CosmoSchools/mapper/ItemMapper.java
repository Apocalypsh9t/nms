package com.example.CosmoSchools.mapper;

import com.example.CosmoSchools.dto.ItemRequestDTO;
import com.example.CosmoSchools.dto.ItemResponseDTO;
import com.example.CosmoSchools.model.Item;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ItemMapper {

    Item toEntity(ItemRequestDTO dto);

    ItemResponseDTO toResponseDTO(Item entidad);

    List<ItemResponseDTO> toResponseDTOList(List<Item> entidades);

    // Para el método "actualizar" (Semana 13): sobrescribe solo los campos del DTO sobre la entidad existente
    @Mapping(target = "id", ignore = true)
    void actualizarEntidadDesdeDto(ItemRequestDTO dto, @MappingTarget Item entidad);
}