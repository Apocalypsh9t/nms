package com.example.CosmoSchools.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Sin este handler, un campo inválido en un @Valid @RequestBody caía en la página de
    // error genérica de Spring Boot, que en desarrollo incluye el stack trace completo en
    // la respuesta JSON: una fuga de información además de un formato distinto al resto de
    // los errores de la app. Se toma el primer mensaje de validación como el más relevante.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> manejarValidacion(MethodArgumentNotValidException ex) {
        String mensaje = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getDefaultMessage())
                .orElse("Datos inválidos");
        ErrorDTO error = new ErrorDTO("400", mensaje, LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorDTO> manejarNoEncontrado(RecursoNoEncontradoException ex) {
        ErrorDTO error = new ErrorDTO("404", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // Se dispara, por ejemplo, al intentar borrar un item que ya está referenciado
    // por una solicitud (restricción de llave foránea en la base de datos).
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorDTO> manejarIntegridadDatos(DataIntegrityViolationException ex) {
        ErrorDTO error = new ErrorDTO("409",
                "No se puede completar la operación: el registro está siendo usado en otra parte del sistema (por ejemplo, una solicitud).",
                LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(TokenInvalidoException.class)
    public ResponseEntity<ErrorDTO> manejarTokenInvalido(TokenInvalidoException ex) {
        ErrorDTO error = new ErrorDTO("401", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(DemasiadosIntentosException.class)
    public ResponseEntity<ErrorDTO> manejarDemasiadosIntentos(DemasiadosIntentosException ex) {
        ErrorDTO error = new ErrorDTO("429", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }

    @ExceptionHandler(EmailDuplicadoException.class)
    public ResponseEntity<ErrorDTO> manejarEmailDuplicado(EmailDuplicadoException ex) {
        ErrorDTO error = new ErrorDTO("409", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorDTO> manejarEstadoInvalido(IllegalStateException ex) {
        ErrorDTO error = new ErrorDTO("400", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
}