# Reporte de Scaffold — 020 Architecture (PLANTILLA)

> **C-7 del arnés 020.** Molde (plano de construcción, L-001). Lo produce el worker **`scaffold-builder`**
> en runtime (`020_architecture/deliverables/scaffold_report.md`, CP-02). Registra el **árbol andamiado**,
> los **manifiestos base**, la **instalación de dependencias** del stack efectivo y la **aplicación de
> tokens**, con la **prueba de que el entorno arranca/compila** (D3). El scaffold real vive en la **raíz**
> del proyecto (estado de operación), no aquí. Los `<...>` son marcadores.

## 1. Árbol andamiado (inventario — solo lo aplicable, E4)

```
# Backend (Clean / Hexagonal — dependencia hacia adentro)
src/domain/             <presente|n/a>
src/application/        <presente|n/a>
src/infrastructure/     <presente|n/a>
src/interface/          <presente|n/a>   (composition root / wiring DI)
# Frontend (modular por features — Next.js App Router)
app/                    <presente|n/a>
src/features/           <presente|n/a>
src/components/ui/       <presente|n/a>
src/lib/                <presente|n/a>
```

- **`scaffold_inventory[]` (para el manifest):** `<lista exacta de paths andamiados>`
- **Vacío de lógica de negocio:** `<confirmado | desviaciones>` (invariante D1).
- **Piezas NO andamiadas (E4):** `<dropped[] + lo no aplicable por el roadmap>`.

## 2. Manifiestos base generados

| Manifiesto | Estado | Nota |
|-----------|--------|------|
| `pyproject.toml` (+ `uv`) | <generado|n/a> | <deps backend, secciones de tooling> |
| `package.json` | <generado|n/a> | <deps frontend> |
| `tsconfig.json` | <generado|n/a> | <…> |
| `docker-compose.yml` | <generado|n/a> | <postgres + servicios> |
| Alembic (migraciones) | <generado|n/a> | <…> |
| Lockfiles (`uv.lock`, `package-lock`/`pnpm-lock`) | <generado|n/a> | commiteados (vector 6) |

## 3. Instalación de dependencias (stack efectivo)

- **Backend:** `<comando uv ... → resultado>` — `<OK | error>`
- **Frontend:** `<comando npm/pnpm ... → resultado>` — `<OK | error>`
- **Evidencia (capturas reales, L-009):** `<salida resumida; nunca fabricada>`

## 4. Tokens de design system aplicados

- **Fuente:** `<brand (900_documents/brand.md) | default>`
- **Modos:** claro + oscuro — `<aplicados>`
- **A11y:** WCAG AA — `<piso verificado | pendiente>`
- **Ubicación de los tokens:** `<path en el scaffold>`

## 5. Sanidad del entorno (D3 — arranque/compilación)

| Chequeo | Comando | Resultado |
|---------|---------|-----------|
| Backend arranca | `<uvicorn ... / import check>` | `<OK | FALLO>` |
| Frontend compila | `<next build / tsc --noEmit>` | `<OK | FALLO>` |
| `docker-compose` válido | `<docker compose config>` | `<OK | FALLO>` |

- **`env_boots`:** `<true | false>` (insumo de CP-02 y del manifest `verification.env_boots`).
- **Fallback E5 si algo no arranca:** `<nivel aplicado; UNRESOLVED si no se resolvió — NO fabricar un entorno verde>`.
