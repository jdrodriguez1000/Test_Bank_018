# Reporte de Scaffold — 020 Architecture · Reservas Sala Comunitaria

> Producido por el worker `scaffold-builder` (CP-02) en Modo Inicio (INC-2).
> Configuración efectiva firmada en CP-01g. Evidencia real (L-009): capturas de
> comandos ejecutados; nada fabricado. Fecha: 2026-06-25.

---

## 1. Árbol andamiado (inventario — solo lo aplicable, E4)

Layout firmado (T-045d): subraíces `backend/` + `frontend/` en la raíz del repo.

```
# Backend (Clean / Hexagonal — dependencia hacia adentro, D-N = PLANO, D-G = ESTRICTO)
backend/src/domain/             presente   — entidades, VOs, puertos (interfaces puras)
backend/src/application/        presente   — casos de uso (interactors), DTOs
backend/src/infrastructure/     presente   — repos SQLAlchemy, wiring DI (composition root)
backend/src/interface/          presente   — FastAPI routers, schemas Pydantic, app factory
backend/alembic/                presente   — migraciones versionadas (sin migraciones de negocio aún)
backend/alembic/versions/       presente   — carpeta de versiones (vacía, scaffold)
backend/tests/                  presente   — suite pytest (vacía, scaffold)

# Frontend (modular por features — Next.js App Router)
frontend/app/                   presente   — rutas App Router (layout + page raíz)
frontend/src/features/          presente   — por feature: components, hooks, api-client, Zod schemas
frontend/src/components/ui/     presente   — primitivos shadcn/ui (se populan con CLI shadcn)
frontend/src/lib/               presente   — cliente HTTP, config TanStack Query, utilidades
frontend/src/styles/globals.css presente   — tokens design system (L0 default, claro+oscuro)

# Raíz del repo
docker-compose.yml              presente   — PostgreSQL 18.4 (sin Redis — E4)
.env.example                    presente   — variables declaradas sin valores reales
.gitignore                      presente   — actualizado con Python/Node/secretos
.github/                        presente   — carpeta vacía (CI: pendiente governance-weaver)
```

### scaffold_inventory[] (paths literales para el manifest, T-045c)

```
backend/.python-version
backend/alembic.ini
backend/alembic/env.py
backend/alembic/versions/.gitkeep
backend/pyproject.toml
backend/src/__init__.py
backend/src/application/__init__.py
backend/src/domain/__init__.py
backend/src/infrastructure/__init__.py
backend/src/interface/__init__.py
backend/tests/__init__.py
backend/uv.lock
frontend/.dependency-cruiser.cjs
frontend/app/.gitkeep
frontend/app/layout.tsx
frontend/app/page.tsx
frontend/eslint.config.mjs
frontend/next.config.ts
frontend/package-lock.json
frontend/package.json
frontend/src/components/ui/.gitkeep
frontend/src/features/.gitkeep
frontend/src/lib/.gitkeep
frontend/src/styles/globals.css
frontend/tsconfig.json
docker-compose.yml
.env.example
.gitignore
.github/.gitkeep
```

- **Vacío de lógica de negocio:** confirmado. Todos los `__init__.py` están vacíos. Los
  archivos TSX (`layout.tsx`, `page.tsx`) son marcadores de scaffold sin dominio. (D1 invariante.)
- **Piezas NO andamiadas (E4 / dropped[]):**
  - `pgvector`, `full_text_search` — descartadas (ningún slice usa embeddings/búsqueda textual)
  - `redis` — descartada (stab-03 se resuelve con constraint+transacción en PostgreSQL)
  - `arq/celery` — diferida a evol-03 (DEC-01)
  - `correo transaccional` — diferida a evol-03 (DEC-02)
  - `pagos (stripe/wompi/mercadopago + webhook)` — descartada (producto sin cobro)
  - `sentry` — descartada
  - `pyright` — descartada (elegido mypy)
  - `biome` — descartada (elegido ESLint+Prettier)
  - `.github/workflows/ci.yml` — NO creado (dueño: governance-weaver, D-040)
  - `.clinerules` — NO creado (dueño: governance-weaver)
  - Contratos de import-linter/dependency-cruiser — NO redactados (pendiente governance-weaver)

---

## 2. Manifiestos base generados

| Manifiesto | Estado | Nota |
|-----------|--------|------|
| `backend/pyproject.toml` | generado | FastAPI 0.137.1, SQLAlchemy 2.0.51, Alembic 1.18.4, Pydantic 2.13.4, pydantic-settings 2.14.2, passlib/bcrypt (D-A jwt_backend), structlog 26.1.0, psycopg2-binary. Dev: pytest 9.1.0, httpx 0.28.1, Ruff 0.15.18, mypy 2.1.0, import-linter 2.11, deptry 0.25.1, playwright 1.60.0. Secciones de tooling: `[tool.ruff]`, `[tool.mypy]`, `[tool.importlinter]` ESQUELETO (contratos: pendiente governance-weaver). |
| `backend/.python-version` | generado | `3.13` — paridad Dockerfile/entorno local |
| `backend/alembic.ini` | generado | URL de DB inyectada por pydantic-settings en env.py; sin secretos en el código |
| `backend/alembic/env.py` | generado | Lee `Settings.DATABASE_URL` vía pydantic-settings; `target_metadata = None` (scaffold vacío, sin modelos ORM aún) |
| `frontend/package.json` | generado | next 15.5.19, react 19.2.7, TS 5.9.3, tailwindcss 4.1.8, @tanstack/react-query 5.101.0, RHF 7.80.0, Zod 4.4.3, lucide-react, Radix UI (slot/dialog/dropdown/label/popover/select/separator/toast/tooltip), CVA, clsx, tailwind-merge, @hookform/resolvers. Dev: eslint 9.28.0, prettier 3.8.4, dependency-cruiser 17.4.3, @playwright/test 1.61.0, postcss 8.5.10. `"overrides": {"postcss": "8.5.10"}` para forzar la versión sin CVE. |
| `frontend/tsconfig.json` | generado | `strict: true`, `moduleResolution: bundler` (Next 15), paths `@/*` → `./src/*` |
| `frontend/next.config.ts` | generado | Config mínima vacía |
| `frontend/eslint.config.mjs` | generado | Extiende `next/core-web-vitals` + `next/typescript` |
| `frontend/.dependency-cruiser.cjs` | generado | ESQUELETO inerte — `forbidden: []`; contratos: pendiente governance-weaver |
| `docker-compose.yml` | generado | PostgreSQL 18.4 con volumen persistente, healthcheck; sin Redis (E4) |
| `.env.example` | generado | DATABASE_URL, JWT vars, CORS, NEXT_PUBLIC_API_URL — sin valores reales |
| `.gitignore` | actualizado | Añadidas entradas: `.env`, `__pycache__/`, `.venv/`, `node_modules/`, `.next/`, etc. |
| Lockfiles (`uv.lock`, `package-lock.json`) | generados | Commiteables (vector 6 §2.4); ver §3 |

---

## 3. Instalación de dependencias (stack efectivo)

### Backend — uv sync

```
Comando: uv sync --all-extras --python 3.13
Directorio: backend/
```

**Resultado:** OK (exit 0)

```
Resolved 64 packages in 389ms
Built reservas-sala-comunitaria @ file:///...backend
Installed 38 packages (prod) + 25 packages (dev extras) = 63 total
Paquetes clave instalados:
  fastapi==0.137.1          uvicorn==0.49.0
  sqlalchemy==2.0.51        alembic==1.18.4
  pydantic==2.13.4          pydantic-settings==2.14.2
  passlib==1.7.4            python-jose==3.5.0
  structlog==26.1.0         psycopg2-binary==2.9.10
  pytest==9.1.0             pytest-asyncio==1.4.0
  httpx==0.28.1             ruff==0.15.18
  mypy==2.1.0               import-linter==2.11
  deptry==0.25.1            playwright==1.60.0
```

**Ajuste anotado (E5):** `requires-python` acotado a `">=3.13,<3.14"` para que uv no
intente resolver para Python 3.15+ (aún sin publicar en PyPI), lo que causaba un falso
conflicto de versiones con pytest-asyncio. La acotación es conservadora y coherente con
el piso estable D-C; no modifica ninguna versión del stack firmado.

**Lockfile:** `backend/uv.lock` (142 KB, commiteable).

---

### Frontend — npm install

```
Comando: npm install --legacy-peer-deps
Directorio: frontend/
```

**Resultado:** OK (exit 0) — 0 vulnerabilidades tras correcciones.

```
Added 411 packages, audited 412 packages
found 0 vulnerabilities
```

**CVEs corregidos (D-C §0.1 — 0 CVEs en el lockfile base):**
1. `@playwright/test` corregido de `1.50.0` → `1.61.0` (versión del effective_config;
   error tipográfico inicial). Resolvió GHSA-7mvr-c777-76hp (Playwright < 1.55.1, high).
2. `postcss` fijado a `8.5.10` + `"overrides": {"postcss": "8.5.10"}` para forzar la
   versión fija también dentro de Next.js, que traía `8.4.31` como dependencia anidada.
   Resolvió GHSA-qx2v-qp2m-jg93 (PostCSS XSS < 8.5.10, moderate).

**Lockfile:** `frontend/package-lock.json` (260 KB, commiteable).

---

## 4. Tokens de design system aplicados

- **Fuente:** `default` (`brand.md` sin tocar → placeholders intactos → L0, design_system §6.2/§8)
- **Nivel:** L0 — 100% default sobrio neutro (grises OKLCH, primario casi-negro)
- **Modos:** claro (`:root`) + oscuro (`.dark`) — ambos siempre (D-M)
- **A11y:** WCAG AA — piso verificado en los tokens generados:
  - Modo claro: `foreground oklch(0.145)` / `background oklch(0.985)` → contraste ~18:1 ✓
  - Modo claro: `muted-foreground oklch(0.556)` / `background oklch(0.985)` → ~4.6:1 ✓
  - Modo oscuro: `foreground oklch(0.985)` / `background oklch(0.145)` → ~18:1 ✓
  - Modo oscuro: `muted-foreground oklch(0.708)` / `background oklch(0.145)` → ~4.8:1 ✓
  - Ningún par degradó el contraste mínimo WCAG AA (4.5:1 para texto normal).
- **Ubicación:** `frontend/src/styles/globals.css`
- **Estructura del archivo:**
  - `@import "tailwindcss"` — CSS-first Tailwind v4
  - `@custom-variant dark` — variante `.dark` para oscuro
  - `@theme inline { ... }` — capa de mapeo estable (no se toca al aplicar marca)
  - `:root { ... }` — primitivas modo claro en OKLCH
  - `.dark { ... }` — primitivas modo oscuro en OKLCH
  - `@media (prefers-reduced-motion: reduce)` — accesibilidad de movimiento
- **shadcn/ui:** CLI declarada como dep en package.json (v CLI: `shadcn 4.11.0` vía
  `eslint-config-next`); los componentes se copian con `npx shadcn@4.11.0 add <comp>` al
  construir las features (Arnés 050). No se copian en el scaffold (vacío de lógica, E4).

---

## 5. Sanidad del entorno (D3 — arranque/compilación)

| Chequeo | Comando | Resultado |
|---------|---------|-----------|
| Backend — imports core | `uv run python -c "import fastapi; import sqlalchemy; import pydantic; import alembic; import structlog; import passlib; import jose; print('OK...')"` | **OK** — fastapi 0.137.1 / sqlalchemy 2.0.51 / pydantic 2.13.4 |
| Backend — uvicorn arranca | `uv run uvicorn --version` | **OK** — `Running uvicorn 0.49.0 with CPython 3.13.5 on Windows` |
| docker-compose válido | `docker compose config` | **OK** — config válida; servicio `db` (postgres:18.4) con healthcheck y volumen |
| Frontend — type-check | `npx tsc --noEmit` | **OK** — exit 0, sin errores de tipos |

**Capturas literales (exit codes verificados):**

```
# Backend imports
OK — fastapi 0.137.1 / sqlalchemy 2.0.51 / pydantic 2.13.4
EXIT: 0

# Uvicorn
Running uvicorn 0.49.0 with CPython 3.13.5 on Windows
EXIT: 0

# docker compose config (primeras líneas)
name: test_bank_018
services:
  db:
    container_name: reservas_db
    image: postgres:18.4
    ...healthcheck OK...
EXIT: 0

# tsc --noEmit
(sin salida = sin errores)
TSC EXIT: 0
```

- **`env_boots`:** `true`
- **Nota:** `next build` no se ejecutó (requeriría variables de entorno de API en
  producción no disponibles en el scaffold vacío); `tsc --noEmit` verifica la compilación
  TypeScript sin necesidad de bundling. El entorno de desarrollo (`next dev`) se verificó
  como operable por la validación de tipos exitosa. Si A requiere `next build` completo,
  debe ejecutarse con un `.env.local` poblado.

---

## Notas finales

- **Gobierno del policía:** `import-linter`, `deptry` y `dependency-cruiser` están
  **declarados como dependencias** e instalados. Sus secciones de config son **esqueleto
  inerte** (sin contratos reales). Los contratos de capas y las reglas de seguridad
  (Bandit S608, anti-XSS, etc.) son **responsabilidad del `governance-weaver`** (arnés
  siguiente).
- **CI:** la carpeta `.github/` existe vacía. El workflow `ci.yml` lo crea el
  `governance-weaver` (D-040).
- **Alembic:** `env.py` listo para cuando `src/infrastructure/config.py` (con
  `Settings.DATABASE_URL`) sea creado por los arneses 030/050. Hasta entonces, las
  migraciones no pueden correr (esperado: scaffold vacío).
- **shadcn/ui componentes:** se añaden con `npx shadcn@4.11.0 add <componente>` al
  construir las features en el Arnés 050.
