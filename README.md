# TFM – Asistente de planificación de comidas y gestión de inventario

## a) Descripción general del proyecto
Este proyecto desarrolla un sistema para ayudar a hogares/familias a organizar las comidas diarias reduciendo la carga mental y el tiempo dedicado a decidir qué cocinar y qué comprar. El sistema prioriza el uso de alimentos disponibles y próximos a caducar, y genera sugerencias de comidas y listas de compra.

## b) Stack tecnológico utilizado
- **Lenguaje**: TypeScript
- **Arquitectura**: Clean Architecture (dominio + casos de uso + infraestructura + interfaces)
- **Testing**: Vitest
- **Monorepo**: pnpm workspaces (estructura preparada para Turborepo)
- **Apps previstas**:
  - Backend API (apps/api)
  - App móvil usuario (apps/mobile)
  - Panel admin (apps/admin)

> Nota: en esta fase inicial se ha implementado el dominio y sus tests.

## c) Instalación y ejecución
### Requisitos
- Node.js (LTS recomendado)
- pnpm

### Instalación
En la raíz del repositorio:
```bash
pnpm install
```

### Ejecutar tests (dominio)
```bash
pnpm -C apps/api test
```
## d) Estructura del proyecto
/apps
  /api        # backend (dominio, tests)
  /mobile     # app usuario (pendiente)
  /admin      # panel admin (pendiente)
/packages
  /contracts  # contratos compartidos (en preparación)

Dentro de **apps/api/src**:

- domain/: entidades y value objects (lógica de negocio)
- application/: casos de uso (orquestación)
- infrastructure/: persistencia/servicios externos (futuro)
- interfaces/: controladores/adaptadores (futuro)

## e) Funcionalidades principales (MVP)

- Modelo de dominio del inventario:
    - Quantity (Value Object) con regla de no-negatividad
    - InventoryItem y Inventory como agregado raíz
    - Consumo de ingredientes y eliminación al llegar a cero
    - Detección de productos próximos a caducar
- Tests unitarios del dominio:
    - Quantity
    - Inventory