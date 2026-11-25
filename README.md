# Rumbo

Web de reservas de alojamientos turísticos en Colombia (cabañas, glamping, hoteles boutique, fincas, apartamentos y hostales). Proyecto del Desafío Profesional de Digital House, construido por sprints.

> Estado: **Sprint 1** terminado (estructura del sitio, alta, listado, detalle y borrado de productos). La documentación completa llega en el Sprint 4.

## Cómo correrlo

Requisitos: Java 21, Node 20 o superior, Docker.

```bash
docker compose up -d                 # MySQL 8.4 + Mailpit
cd backend && ./mvnw spring-boot:run # API en http://localhost:8080 (carga datos de ejemplo la primera vez)
cd frontend && npm install && npm run dev   # sitio en http://localhost:5173
```

- Documentación de la API: http://localhost:8080/swagger-ui/index.html
- Panel de administración: http://localhost:5173/administracion
- Variables de entorno de ejemplo: `.env.example`, `backend/.env.example`, `frontend/.env.example`

## Pruebas

```bash
cd backend && ./mvnw test
cd frontend && npm test
```

## Documentos

- Bitácora: [`docs/bitacora/`](docs/bitacora/)
- Plan de QA y evidencias: [`docs/qa/`](docs/qa/)
- Marca: [`docs/brand/brand.md`](docs/brand/brand.md) · Sistema visual: [`DESIGN.md`](DESIGN.md)

Autor: Camilo Castañeda
