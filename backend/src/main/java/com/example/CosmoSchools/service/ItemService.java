package com.example.CosmoSchools.service;

import com.example.CosmoSchools.dto.ItemRequestDTO;
import com.example.CosmoSchools.dto.ItemResponseDTO;
import com.example.CosmoSchools.exception.RecursoNoEncontradoException;
import com.example.CosmoSchools.mapper.ItemMapper;
import com.example.CosmoSchools.model.Item;
import com.example.CosmoSchools.repository.DetalleSolicitudRepository;
import com.example.CosmoSchools.repository.ItemRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final ItemMapper itemMapper;
    private final DetalleSolicitudRepository detalleSolicitudRepository;
    private final TransactionTemplate transactionTemplate;

    public ItemService(ItemRepository itemRepository, ItemMapper itemMapper,
                        DetalleSolicitudRepository detalleSolicitudRepository,
                        PlatformTransactionManager transactionManager) {
        this.itemRepository = itemRepository;
        this.itemMapper = itemMapper;
        this.detalleSolicitudRepository = detalleSolicitudRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    @Transactional
    public ItemResponseDTO crear(ItemRequestDTO dto) {
        Item item = itemMapper.toEntity(dto);
        return itemMapper.toResponseDTO(itemRepository.save(item));
    }

    public List<ItemResponseDTO> obtenerTodos() {
        return itemMapper.toResponseDTOList(itemRepository.findAll());
    }

    public List<ItemResponseDTO> obtenerDisponibles() {
        return itemMapper.toResponseDTOList(itemRepository.findByCantidadDisponibleGreaterThanAndActivoTrue(0));
    }

    public ItemResponseDTO obtenerPorId(Long id) {
        Item item = buscarPorId(id);
        return itemMapper.toResponseDTO(item);
    }

    @Transactional
    public ItemResponseDTO actualizar(Long id, ItemRequestDTO dto) {
        Item existente = buscarPorId(id);
        itemMapper.actualizarEntidadDesdeDto(dto, existente);
        return itemMapper.toResponseDTO(itemRepository.save(existente));
    }

    // Si el item nunca se usó en ninguna solicitud, se borra de verdad. Si ya está referenciado
    // (aunque esa solicitud esté rechazada, cancelada o devuelta), la base de datos rechaza el
    // borrado por la relación entre tablas; en ese caso se da de baja en vez de romper ese historial.
    public String eliminar(Long id) {
        buscarPorId(id); // valida que exista antes de intentar nada
        boolean borradoFisico = intentarBorrarFisico(id);
        if (borradoFisico) {
            return "Item eliminado del inventario";
        }
        darDeBaja(id);
        List<Long> idsSolicitudes = detalleSolicitudRepository.buscarIdsDeSolicitudesQueUsanItem(id);
        String detalle = idsSolicitudes.stream().map(i -> "#" + i).collect(Collectors.joining(", "));
        return "El item está usado en la(s) solicitud(es) " + detalle
                + ", así que se dio de baja en vez de eliminarse por completo";
    }

    private boolean intentarBorrarFisico(Long id) {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                Item existente = buscarPorId(id);
                itemRepository.delete(existente);
                itemRepository.flush();
            });
            return true;
        } catch (DataIntegrityViolationException ex) {
            return false;
        }
    }

    private void darDeBaja(Long id) {
        transactionTemplate.executeWithoutResult(status -> {
            Item existente = buscarPorId(id);
            existente.setActivo(false);
            itemRepository.save(existente);
        });
    }

    @Transactional
    public ItemResponseDTO reactivar(Long id) {
        Item existente = buscarPorId(id);
        existente.setActivo(true);
        return itemMapper.toResponseDTO(itemRepository.save(existente));
    }

    private Item buscarPorId(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Item no encontrado con id " + id));
    }
}