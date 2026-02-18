# TFM – Home Meal Planning System

## a) Descripción general del proyecto

Este proyecto desarrolla un sistema para ayudar a hogares/familias a organizar las comidas diarias reduciendo la carga mental y el tiempo dedicado a decidir qué cocinar y qué comprar.

El sistema:

- Usa el inventario real del hogar.
- Sugiere recetas que pueden cocinarse inmediatamente.
- Si no es posible, genera la lista mínima de compra para desbloquear una receta.
- Permite aceptar sugerencias y consumir inventario.
- Prioriza el uso de ingredientes disponibles.

El sistema está diseñado bajo principios de **Clean Architecture**, con una API backend y una Web Demo funcional.

---

## b) Stack tecnológico utilizado

### Backend
- **Lenguaje**: TypeScript
- **Framework HTTP**: Fastify
- **Arquitectura**: Clean Architecture (DDD-light)
- **Base de datos**: PostgreSQL
- **ORM**: Prisma
- **Validación runtime**: Zod
- **Testing**: Vitest

### Frontend (Web Demo)
- React
- Vite
- TypeScript
- Tailwind CSS

### Monorepo
- pnpm workspaces
- packages/contracts compartido entre backend y frontend

---

## c) Instalación y ejecución

### Requisitos
- Node.js (LTS)
- pnpm
- PostgreSQL
- Docker (opcional para la base de datos)

---

### 1. Instalar dependencias

Desde la raíz:

```bash
pnpm install
```
### 2. Configurar base de datos

Configurar **DATABASE_URL** en **.env** dentro de **apps/api**.

Ejecutar migraciones:

```bash
pnpm -C apps/api prisma migrate dev
```

Seed:

```bash
pnpm -C apps/api prisma db seed
```

### 3. Ejecutar backend

```bash
pnpm -C apps/api dev
```

Servidor disponible en:

```cpp
http://127.0.0.1:3000
```

### 4. Ejecutar Web Demo

```bash
pnpm -C apps/web dev
```

Disponible en:

```arduino
http://localhost:5173
```

---

## d) Estructura del proyecto

```bash
apps/
├── api/        # Backend API (Clean Architecture)
├── web/        # Web Demo (React + Tailwind)
├── mobile/     # App móvil (futuro)
└── admin/      # Panel administración (futuro)

packages/
└── contracts/  # Contratos compartidos (Zod + TS)
```

---

## e) Funcionalidades principales actuales

### Inventario

- Añadir ingredientes
- Cantidades y fechas de caducidad
- Persistencia en PostgreSQL

### Cooking Plan (flujo principal)

Endpoint: **POST /plan/today**

Devuelve:

- SUGGESTION
  - Recetas posibles con inventario actual
  - suggestionId persistido
- NEEDS_SHOPPING
  - Receta objetivo
  - Lista mínima de compra

### Accept Suggestion

- Consume inventario
- Actualiza estado

### Shopping List

- Desde recetas explícitas
- Desde plan automático

---

## f) Estado actual del sistema

✔ Arquitectura limpia implementada
✔ Persistencia real con PostgreSQL
✔ Validación estricta con contracts
✔ Web demo funcional y responsive (Tailwind)
✔ Flujo end-to-end operativo

---

## Documentación adicional

- [Architecture overview](docs/architecture.md)
- [HTTP API examples](docs/http-examples.md)
- [Architecture Decision Record](docs/adr.md)
