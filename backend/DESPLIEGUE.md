# Despliegue de CosmoSchools

Hay dos piezas:

| Pieza | Tecnología | Resultado del build |
|---|---|---|
| Backend (este repo) | Spring Boot 4.1, Java 26, Maven | `target/CosmoSchools-0.0.1-SNAPSHOT.jar` |
| Frontend (`cosmo-frontend`) | React 19 + Vite | carpeta `dist/` con archivos estáticos |

Base de datos: **MySQL 8**.

## Requisitos del servidor

- Java 26 (JRE o JDK)
- MySQL 8 (local o administrado)
- Nginx (o similar) como proxy inverso + HTTPS, y para servir el frontend
- RAM orientativa: ~512 MB para la JVM; 1–2 GB en total con MySQL

Puertos: solo **80/443** públicos. El **8085** (app) y el **3306** (MySQL) deben quedar internos.

## 1. Base de datos

```sql
CREATE DATABASE cosmo_schools CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cosmo_app'@'localhost' IDENTIFIED BY '<contraseña segura>';
GRANT ALL PRIVILEGES ON cosmo_schools.* TO 'cosmo_app'@'localhost';
```

No hay scripts SQL: las tablas las crea Hibernate al arrancar (`ddl-auto=update`).

## 2. Backend

```bash
./mvnw clean package
java -jar target/CosmoSchools-0.0.1-SNAPSHOT.jar
```

Toda la configuración va por **variables de entorno**: ver [.env.example](.env.example).
Las imprescindibles son `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`
y, en el primer arranque, `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Ejemplo de servicio systemd (`/etc/systemd/system/cosmoschools.service`):

```ini
[Unit]
Description=CosmoSchools backend
After=network.target mysql.service

[Service]
User=cosmo
WorkingDirectory=/opt/cosmoschools
EnvironmentFile=/opt/cosmoschools/.env
ExecStart=/usr/bin/java -Xmx512m -jar /opt/cosmoschools/CosmoSchools.jar
Restart=always

[Install]
WantedBy=multi-user.target
```

**Health check:** `GET /actuator/health` → `{"status":"UP"}` (público, sin login).

**Logs:** salida estándar (con systemd: `journalctl -u cosmoschools -f`).

### Primer administrador

El registro público solo crea cuentas de profesor. Si al arrancar no existe ningún ADMIN y están
definidas `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mín. 8 caracteres), la app lo crea sola y lo registra en el log.
Si ya existe un admin, esas variables se ignoran.

## 3. Frontend

```bash
# en cosmo-frontend/
VITE_API_URL=https://api.ejemplo.com/api npm run build
```

`VITE_API_URL` se fija **al compilar**: si cambia la URL del backend, hay que volver a compilar.

Es una SPA con React Router, así que el servidor web necesita fallback a `index.html`
(si no, recargar una ruta como `/solicitudes` da 404).

## 4. Nginx de ejemplo

```nginx
# Frontend
server {
    server_name cosmo.ejemplo.com;
    root /var/www/cosmo-frontend/dist;
    location / {
        try_files $uri /index.html;
    }
}

# Backend
server {
    server_name api.ejemplo.com;
    location / {
        proxy_pass http://127.0.0.1:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

HTTPS: por ejemplo con Let's Encrypt (`certbot --nginx`).

## Limitaciones conocidas

- **Una sola instancia.** El límite de intentos de login se guarda en memoria (se reinicia al
  reiniciar la app) y la tarea de avisos de atraso corre cada 5 minutos en cada instancia.
  No correr varias copias detrás de un balanceador sin adaptar esto.
- **Zona horaria:** la app usa `America/Bogota` por defecto (variable `APP_TIMEZONE`).
- **Esquema:** `ddl-auto=update` crea y amplía tablas, pero no hace migraciones destructivas.
  Más adelante conviene pasar a Flyway.
- **Backups:** la app no hace respaldos; programar `mysqldump` (o los backups del proveedor).
- No hay tests automatizados todavía.
