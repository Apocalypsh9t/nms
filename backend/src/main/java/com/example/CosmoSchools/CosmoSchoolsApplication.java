package com.example.CosmoSchools;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling // necesario para el chequeo periódico de solicitudes atrasadas
public class CosmoSchoolsApplication {

	public static void main(String[] args) {
		// Los servidores en la nube suelen estar en UTC; sin esto, las horas límite y los
		// avisos de atraso quedarían corridos 5 horas. Se puede cambiar con APP_TIMEZONE.
		String zona = System.getenv().getOrDefault("APP_TIMEZONE", "America/Bogota");
		TimeZone.setDefault(TimeZone.getTimeZone(zona));
		SpringApplication.run(CosmoSchoolsApplication.class, args);
	}

}
