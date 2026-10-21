package com.example.CosmoSchools.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI cosmoSchoolsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Cosmo Schools - Inventario API")
                        .description("API para gestión de inventario y solicitudes de materiales")
                        .version("v1.0"));
    }
}