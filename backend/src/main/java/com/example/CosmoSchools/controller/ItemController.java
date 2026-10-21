package com.example.CosmoSchools.controller;

import com.example.CosmoSchools.dto.ItemRequestDTO;
import com.example.CosmoSchools.dto.ItemResponseDTO;
import com.example.CosmoSchools.dto.MensajeDTO;
import com.example.CosmoSchools.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class ItemController {

    private final ItemService itemService;

    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ItemResponseDTO> crear(@Valid @RequestBody ItemRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemService.crear(dto));
    }

    @GetMapping
    public ResponseEntity<List<ItemResponseDTO>> obtenerTodos() {
        return ResponseEntity.ok(itemService.obtenerTodos());
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<ItemResponseDTO>> obtenerDisponibles() {
        return ResponseEntity.ok(itemService.obtenerDisponibles());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponseDTO> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.obtenerPorId(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<ItemResponseDTO> actualizar(@PathVariable Long id, @Valid @RequestBody ItemRequestDTO dto) {
        return ResponseEntity.ok(itemService.actualizar(id, dto));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<MensajeDTO> eliminar(@PathVariable Long id) {
        String mensaje = itemService.eliminar(id);
        return ResponseEntity.ok(new MensajeDTO(mensaje));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/reactivar")
    public ResponseEntity<ItemResponseDTO> reactivar(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.reactivar(id));
    }
}