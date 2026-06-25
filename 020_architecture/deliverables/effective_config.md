# Configuración Efectiva — 020 Architecture · Reservas Sala Comunitaria

> C-7 del arnés 020. Propuesta del worker `architecture-adapter` (CP-01) sobre la base adaptable (D-027):
> stack/estilo/identidad efectivos + decisiones abiertas para el gate de decisión (CP-01g). Basado en
> `roadmap-manifest.json` v1 (firmado 2026-06-25) + 11 slices BDD + los 3 bloques de referencia
> (`900_documents/architecture/`). `brand.md` está SIN TOCAR → identidad por defecto (L0).

## 1. Stack efectivo propuesto (base aplicable + adiciones − no aplicables)

| Pieza | Base (referencia) | Propuesta efectiva | Veredicto | Justificación |
|-------|-------------------|--------------------|-----------|---------------|
| Backend lenguaje/framework | python / fastapi | Python 3.13.x / FastAPI 0.137.1 | aplica | Backend con reglas de negocio reales (topes, ventana, ciclo de vida); piso estable D-C. |
| Backend ASGI | uvicorn | Uvicorn 0.49.0 | aplica | Servir FastAPI. |
| ORM / migraciones | sqlalchemy / alembic | SQLAlchemy 2.0.51 / Alembic 1.18.4 | aplica | Modelo relacional (Apartamento, Persona, Reserva); migraciones versionadas. |
| Validación / settings | pydantic / pydantic-settings | Pydantic 2.13.4 / pydantic-settings 2.14.2 | aplica | Schemas de API + config 12-factor. |
| Gestión entorno Python | uv | uv 0.11.21 | aplica | Reproducibilidad. |
| Frontend | next / typescript | Next.js 15.5.19 / TypeScript 5.9.3 | aplica | Calendario + flujo de reserva; piso estable D-C. |
| Estilos | tailwind | Tailwind CSS 4.x | aplica | Load-bearing del design system (OKLCH/CSS-first). |
| UI base | shadcn/ui · lucide-react | shadcn 4.11.0 · lucide-react 1.21.0 | aplica | Componentes accesibles + iconos. |
| Datos servidor | tanstack query | TanStack Query 5.101.0 | aplica | Fetch/caché del calendario y "mis reservas". |
| Formularios + validación | react-hook-form + zod | RHF 7.80.0 / Zod 4.4.3 | aplica | Form de reserva (motivo, "acepto las normas"), alta admin. |
| DB | postgres 18.4 | PostgreSQL 18.4 (sin extensiones) | aplica | Atomicidad de "sin doble reserva" (stab-03) vía constraint único + transacción; UUIDv7 nativo (D-H). |
| AuthN/Z | jwt backend | JWT propio del backend (passlib/bcrypt; rol vecino/admin) | aplica | Acceso solo por correo dado de alta por admin, sin auto-registro, con rol admin (final-01, evol-02). Encaja con el default D-A. |
| Testing back | pytest + httpx | pytest 9.1.0 · httpx 0.28.1 | aplica | Unit/integración. |
| E2E | playwright | Playwright (py 1.60.0 · @playwright/test 1.61.0) | aplica | Requerido por Arnés 060 sobre los BDD. |
| Lint/format Py | ruff | Ruff 0.15.18 | aplica | Lint+format; ancla Bandit S608 (vector SQLi). |
| Lint/format TS | eslint + prettier | ESLint 10.5.0 · Prettier 3.8.4 | aplica | (Biome descartado como alternativa, abajo.) |
| Type-check | mypy/pyright · tsc | mypy 2.1.0 · tsc | aplica | Tipado estático (pyright no elegido). |
| Policía | import-linter/deptry · dependency-cruiser | import-linter 2.11 · deptry 0.25.1 · dependency-cruiser 17.4.3 | aplica | Hace cumplir las capas (§2.2 estilo). |
| Contenedores / CI | docker-compose · github actions | Docker + docker-compose · GitHub Actions | aplica | Paridad dev/CI; jobs `policy`+`security`. |
| Observabilidad | structlog · sentry | structlog 26.1.0 | aplica | Logging estructurado. Sentry descartado (abajo). |
| Extensión DB | pgvector | — | **descartada (E4)** | Ningún slice usa embeddings/búsqueda semántica. |
| Búsqueda textual | full-text search | — | **descartada (E4)** | No hay búsqueda de texto libre en el roadmap. |
| Pagos | stripe/wompi/mercadopago + webhook | — | **descartada (E4)** | El producto no cobra nada; ningún slice menciona pago. No se andamia puerto de pagos. |
| Correo transaccional | ses/brevo/resend | — | **descartada (E4) — condicional** | No se usa en MVP; reaparece como puerto de notificación SOLO al construir `evol-03` (recordatorio). No andamiar ahora. |
| Cola/caché | redis | — | **descartada (E4)** | La concurrencia (stab-03) se resuelve con constraint+transacción en Postgres; no hace falta Redis para sesiones/caché en este alcance. |
| Background jobs | backgroundtasks → arq/celery | — | **descartada (E4) — condicional** | Solo necesario para `evol-03` (recordatorio) y, opcionalmente, la conciliación de COMPLETADA (ver DEC-01). No andamiar ahora. |
| Type-check alt | pyright | — | descartada | Se elige mypy. |
| Lint alt | biome | — | descartada | Se elige ESLint+Prettier. |
| Error tracking | sentry | — | descartada | Opcional; no requerido por el roadmap. |

- **`added[]`:** ninguna. La base de referencia cubre íntegramente el roadmap; no se detectó necesidad de una pieza fuera de la base (E4: no inflar).
- **`dropped[]`:** `pgvector`, `full_text_search`, `pagos (stripe/wompi/mercadopago + webhook)`, `correo_transaccional` (condicional evol-03), `redis`, `arq/celery` (condicional evol-03 / DEC-01), `pyright`, `biome`, `sentry`.
- **Versiones verificadas contra:** `stack_tec.md` §2/§12 (piso estable D-C, verificado contra PyPI/npm el **2026-06-24** por `caden-setup`). El adapter es `Read`-only y **no puede re-consultar PyPI/npm en vivo**; por eso adopta el piso ya verificado del bloque de referencia como fuente (no fabrica versiones). Si A requiere re-verificación en vivo, debe correrla fuera de este worker. Ninguna pieza queda `UNRESOLVED`: todas provienen del bloque dated-verified.

## 2. Estilo efectivo propuesto

| Eje | Valor propuesto | Escape (si aplica) |
|-----|-----------------|--------------------|
| Capas | clean_hexagonal_4 (domain/application/infrastructure/interface) | — |
| Mapeo ORM (D-G) | **strict** | relaxed NO aplica (checklist abajo) |
| Representación de dominio (D-F) | dataclasses puras | — |
| Clave primaria (D-H) | uuidv7 (nativo PG18) | — |
| Alcance de fila (D-I) | repository scoping (filtrar por apartamento/owner) | rls NO aplica (sin multi-tenant duro) |
| Topología (D-N) | **plano** (monolito en capas) | modular NO aplica (criterio abajo) |

### Checklist D-G (modo ORM, §5.1) — evidencia por casilla

| # | Casilla | Resultado | Evidencia (roadmap/BDD) |
|---|---------|-----------|--------------------------|
| 1 | Sin reglas de negocio no-CRUD | **NO cumple** | Topes (≤2 activas, ≤4/mes calendario por fecha de bloque, stab-02), ventana 30 días/mismo-día (stab-01), ventana de cancelación (stab-04) son políticas, no CRUD trivial. |
| 2 | Sin invariantes ni máquinas de estado | **NO cumple** | Invariante "a lo sumo 1 reserva activa por bloque+día" (stab-03); ciclo activa→cancelada/COMPLETADA (stab-04); pendiente→activa/rechazada (evol-02). |
| 3 | Sin workflows multi-paso ni orquestación | **NO cumple** | Baja/mudanza cancela reservas a futuro + libera franjas + conserva COMPLETADAS (final-01); cambio de apartamento cancela y no arrastra (final-01). |
| 4 | Un solo bounded context | cumple | Dominio cohesivo de reservas; sin dominios separables. |
| 5 | < 8 entidades de negocio | cumple | ~5-6: Apartamento, Persona, Reserva, Bloque (catálogo de 3), Recurso extra (evol-01), consentimiento de normas (atributo). |
| 6 | Sin integraciones externas con lógica | **NO cumple** | `evol-03` introduce notificación/recordatorio (puerto externo con reglas de disparo). |
| **Veredicto** | | **ESTRICTO** | 4 de 6 casillas fallan → estricto (default seguro D-G). |

### Criterio D-N (topología, §2.5) — evidencia

| Señal multi-dominio | Resultado | Evidencia |
|---------------------|-----------|-----------|
| ≥3 bounded contexts separables | NO | Todo gira en torno a Reserva/Apartamento; "administración" e "historial" son vistas/operaciones del mismo dominio, sin vocabulario propio independiente. |
| >~20 entidades repartidas | NO | ~5-6 entidades. |
| Propiedad/evolución por dominio | NO | Un solo producto, sin equipos por dominio. |
| **Veredicto** | **PLANO** | Ninguna señal fuerte → monolito en capas (default). Microservicios fuera de alcance. |

### Disposición front/back (T-045d)

- **Layout:** `subraíces backend/ + frontend/` en la raíz del repo.
  - `backend/src/{domain,application,infrastructure,interface}` (estilo §2.1) + `backend/alembic/`, `backend/tests/`.
  - `frontend/app/` (App Router) + `frontend/src/features/`, `frontend/src/components/ui/`, `frontend/src/lib/` (estilo §3).
  - `docker-compose.yml` + `.github/` en la raíz.
- **Por qué:** `src/` (Python) y `app/`+`src/features` (Next) colisionan en una sola raíz; dos subraíces evitan el choque, mantienen lockfiles y herramientas (uv vs npm) aisladas y dan al `scaffold-builder` una convención inequívoca.

## 3. Design system efectivo

| Campo | Valor | Nota |
|-------|-------|------|
| `source` | **default** | `brand.md` sin tocar (placeholders intactos) → L0 (design_system §6.2/§8). |
| `level` | **L0** | 100% default: tema sobrio neutro (grises OKLCH, primario casi-negro). |
| Modos | claro + oscuro | siempre ambos (D-M), vía `:root`/`.dark`. |
| Piso a11y | WCAG AA | invariante (design_system §4); foco visible + teclado heredados de Radix/shadcn. |

## 4. Decisiones abiertas a cerrar en el gate de decisión (CP-01g)

| # | Decisión | Opciones | Default adaptable | Recomendación del adapter |
|---|----------|----------|-------------------|---------------------------|
| D-A | AuthN/Z | jwt_backend · authjs · managed:`<provider>` | jwt_backend | **jwt_backend.** Acceso solo por correo dado de alta por admin, sin auto-registro (final-01), roles vecino/admin (evol-02, final-01). No se piden proveedores sociales ni "comprar"; el default encaja perfecto. |
| D-G | Modo ORM | estricto · orm_relaxed | estricto | **estricto.** 4/6 casillas de §5.1 fallan (reglas, invariantes, workflows, integración evol-03). Mapper ORM↔dominio justificado. |
| D-N | Topología | plano · modular | plano | **plano.** Ninguna señal multi-dominio (§2.5). Modular sería andamiar de más (E4). |
| D-C | Versión del stack | piso estable · filo opt-in | piso estable | **piso estable.** Ningún slice exige un major al filo; mantener Python 3.13 / Next 15.5.19 / TS 5.9.3. PG18 y Tailwind 4 se mantienen por load-bearing (UUIDv7 / OKLCH), no por filo. |
| ESC-1 | Escape de estilo: RLS (D-I) | aprobar / rechazar | rechazar | **rechazar.** "Mis reservas" y cancelación solo-dueño se cubren con scoping en repositorio; no hay multi-tenant duro ni datos ultra-sensibles que justifiquen RLS. |
| DEC-01 | Transición a COMPLETADA (stab-04) — mecanismo de "al pasar el bloque" | derivada en lectura (estado calculado) · job programado de conciliación | derivada en lectura | **derivada/lazy** al consultar + (opcional) reconciliación periódica más adelante. Evita andamiar un scheduler/ARQ ahora (E4). El humano confirma si quiere materializar el estado. |
| DEC-02 | Infra de notificación para `evol-03` (recordatorio) | BackgroundTasks · ARQ/Celery + correo (SES/Brevo/Resend) | diferir hasta evol-03 | **no andamiar ahora.** El puerto de notificación + el adaptador de correo + el scheduler entran SOLO al construir `evol-03`; provisionarlos hoy sería andamiar de más. Se decide el canal al planificar esa evolution. |

> IDs (T-045a): `D-A`/`D-G`/`D-N`/`D-C` reutilizan los IDs canónicos; `ESC-1` es escape de estilo; `DEC-01`/`DEC-02` son decisiones propias del proyecto. No se usó la secuencia `D-J…` (reservada a los bloques).

## 5. Aplicabilidad por el roadmap (E4 — andamiar solo lo necesario)

- **Activa (este roadmap lo exige):**
  - Las 4 capas backend + policía import-linter (dominio rico: topes, ventana, ciclo de vida).
  - Puerto/repositorio de Reservas con **constraint único** (apartamento/bloque/día activos) + Unit of Work para la atomicidad de stab-03.
  - AuthN/Z JWT con rol **admin** (evol-02 aprobar/rechazar; final-01 altas/bajas/cambios) y **vecino**.
  - Scoping por apartamento en repositorio (D-I): "mis reservas", cancelación solo-dueño.
  - PostgreSQL UUIDv7 (D-H), Alembic, timestamptz; catálogo de Bloques como tabla de lookup.
  - Frontend: calendario por día (3 bloques), form de reserva con "acepto las normas" (Zod), "mis reservas"; TanStack Query para reflejar el calendario tras conflicto (stab-03).
  - Línea base de seguridad (6 vectores) + jobs CI `policy`/`security`.
- **No activa (no andamiar):** puerto de pagos + webhook, pgvector/FTS, Redis, ARQ/Celery, correo transaccional, Sentry (todos descartados o condicionales a evol-03 — ver §1).

## 6. Notas para el humano

Proyecto de dominio acotado pero **con reglas reales** → estilo **estricto + plano**, auth **jwt_backend** con rol admin, identidad **default L0** (brand.md vacío), layout **backend/+frontend/**. La base cubre todo: cero adiciones, varias piezas descartadas por E4 (pagos, Redis, pgvector). Decisiones a cerrar: D-A, D-G, D-N, D-C (todas con default recomendado), rechazo de RLS (ESC-1) y dos diferimientos propios (DEC-01 transición COMPLETADA, DEC-02 notificaciones de evol-03). Riesgo a vigilar: la atomicidad de stab-03 depende de un constraint DB + transacción, no de Redis — confírmese en el scaffold; y no andamiar correo/scheduler hasta evol-03.
