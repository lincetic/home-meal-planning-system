# TFM – Home Meal Planning System

## a) Descripción general del proyecto

Este proyecto desarrolla un sistema para ayudar a hogares/familias a organizar las comidas diarias reduciendo la carga mental y el tiempo dedicado a decidir qué cocinar y qué comprar.

El sistema:

- Usa el inventario real del hogar.
- Sugiere recetas que pueden cocinarse inmediatamente.
- Si no es posible, genera la lista mínima de compra para desbloquear una receta.
- Permite aceptar sugerencias y consumir inventario.
- Prioriza el uso de ingredientes disponibles.
- Incluye autenticación con sesión basada en access token + refresh token.
- Presenta una Web Demo con interfaz mobile-first separada en dos pantallas principales: **Plan** e **Inventory**.

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
- **Autenticación**:
  - JWT access token
  - Refresh token en cookie httpOnly

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
pnpm -C apps/api seed:ingredients
pnpm -C apps/api seed:recipes
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
├── web/        # Web Demo (React + Tailwind, mobile-first)
├── mobile/     # App móvil (futuro)
└── admin/      # Panel administración (futuro)

packages/
└── contracts/  # Contratos compartidos (Zod + TS)
```

## e) Funcionalidades principales actuales

### Autenticación y sesión

- Registro de usuario
- Login con email y contraseña
- Endpoint /auth/me
- Access token JWT de corta duración
- Refresh token en cookie httpOnly
- Logout completo
- Renovación automática de sesión desde frontend cuando expira el access token

### Inventario

- Añadir ingredientes
- Cantidades y fechas de caducidad
- Persistencia en PostgreSQL
- Consulta protegida por autenticación y autorización

### Cooking Plan (flujo principal)

Endpoint: **POST /plan/today**

Devuelve:

- `SUGGESTION`
  - Recetas posibles con inventario actual
  - `suggestionId` persistido
  - Puede incluir `acceptedRecipeId` cuando la sugerencia ya fue aceptada
- `NEEDS_SHOPPING`
  - Receta objetivo
  - Lista mínima de compra

### Accept Suggestion

- Permite aceptar una receta completa (`FULL`) o media receta (`HALF`)
- Consume del inventario las cantidades proporcionales
- Mantiene `FULL` como valor por defecto para clientes existentes
- Actualiza estado a aceptada
- Persiste la receta y la porción aceptadas
- Mantiene comportamiento idempotente sin consumir dos veces

### Shopping List

- Desde recetas explícitas
- Desde plan automático

### Web Demo mobile-first

La Web Demo ya no presenta todo en una sola vista principal.
Ahora se organiza como una experiencia tipo app móvil con dos pestañas:
- **Plan**
  - muestra la receta sugerida o aceptada del día
  - permite aceptar una receta
  - permite elegir entre receta completa y media receta
  - muestra alternativas o lista mínima de compra
- **Inventory**
  - permite buscar ingredientes
  - añadir ingredientes al inventario
  - visualizar existencias y caducidad

---

## f) Estado actual del sistema

```
✔ Arquitectura limpia implementada
✔ Persistencia real con PostgreSQL
✔ Validación estricta con contracts
✔ Web demo funcional y responsive
✔ UI mobile-first con tabs Plan / Inventory
✔ Flujo end-to-end operativo
✔ Autenticación y autorización implementadas
✔ Refresh token con cookie httpOnly
```

---

## g) Flujo de sesión actual

1. El usuario hace login o register.
2. El backend devuelve un access token.
3. El backend guarda un refresh token en cookie httpOnly.
4. El frontend usa el access token para endpoints protegidos.
5. Si el access token expira:
  - el frontend llama a /auth/refresh
  - el backend valida la cookie refresh
  - devuelve un nuevo access token
  - la petición original se reintenta automáticamente
6. Si el refresh también falla:
  - el frontend cierra sesión localmente
  - el usuario vuelve a la pantalla de login
7. En logout:
  - se elimina la cookie refresh
  - se limpia el access token del frontend

---

## Despliegue / Deployment

### Live Demo

Frontend  
https://home-meal-planning-system-web.vercel.app

Backend API  
https://home-meal-planning-system.onrender.com

### Demo user

email: demo@tfm.local  
password: Password123!

**IMPORTANTE**: Si el backend está inactivo, la primera solicitud puede tardar unos segundos porque Render pone en suspensión el servicio cuando la aplicaicon no se ha usado durante un tiempo.

---

## Documentación adicional

- [Architecture overview](docs/architecture.md)
- [HTTP API examples](docs/http-examples.md)
- [Architecture Decision Record](docs/adr.md)
- [C4 model](docs/c4.md)
