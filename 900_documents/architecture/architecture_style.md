# architecture_style.md — Estilo arquitectónico de referencia (Arnés 020_architecture)

> **Qué es este archivo.** La definición del **estilo arquitectónico estándar** con el que CADEN
> estructurará el software que fabrica: capas, fronteras, reglas del "policía invisible", patrones de
> diseño y convenciones de modelado de datos. Es el **bloque B** de los tres bloques de entrada del Arnés
> `020_architecture` (ver `stack_tec.md` §9 y D-027).
>
> **Qué NO es.** No define el **stack tecnológico** (bloque A, `stack_tec.md`) ni la **identidad visual /
> design system** (bloque C, I-001). Aquí se decide *cómo se organiza* el código, no *con qué* se escribe
> ni *cómo se ve*.
>
> **Relación con el stack.** Este estilo presupone el stack del bloque A (Python/FastAPI/SQLAlchemy en el
> backend, Next.js/TypeScript en el frontend) y **da contenido** al "policía" del §9.3 del stack
> (import-linter / dependency-cruiser): las reglas de capas que esas herramientas hacen cumplir se definen
> aquí.

---

## 0. Naturaleza del estilo: base adaptable por proyecto

Igual que el stack (D-027), este estilo es la **base por defecto de la gran mayoría de los proyectos**, no
una imposición rígida. Cuando el **Arnés 020 se ejecuta** sobre un proyecto concreto:

1. **Verifica aplicabilidad.** Según el `roadmap-manifest.json` y los BDD del Arnés 010, decide qué
   profundidad arquitectónica corresponde (un CRUD simple no necesita lo mismo que un dominio rico).
2. **Sugiere ajustes.** Puede proponer relajar o reforzar capas/patrones para las necesidades particulares,
   justificando cada cambio contra una necesidad concreta.
3. **Presenta al humano y firma.** El **estilo efectivo del proyecto = base aplicable + ajustes aprobados**,
   ratificado en el gate del 020.

> La separación estricta de capas y el mapeo ORM↔dominio son el **default**; las relajaciones existen, pero
> se **aprueban en el gate**, no se improvisan (coherente con D-027).

---

## 1. Principios del estilo

1. **Regla de dependencia hacia adentro.** El negocio (dominio) no conoce los detalles (frameworks, DB, HTTP).
   Las dependencias siempre apuntan desde lo externo hacia lo interno, nunca al revés.
2. **El dominio es puro.** `domain` no importa FastAPI, SQLAlchemy ni Pydantic. Es Python plano, testeable
   sin levantar infraestructura.
3. **Una verdad por frontera.** El contrato de datos cruza cada frontera con una representación explícita
   (schema API ≠ entidad de dominio ≠ modelo ORM), conectado por mappers, no por acoplamiento.
4. **Lo externo va detrás de un puerto.** Todo servicio externo (pagos, correo, caché) se consume por una
   interfaz definida en el dominio e implementada en infraestructura → un único punto de cambio.
5. **El estilo es verificable, no documental.** Las reglas de capas se codifican en el "policía"
   (import-linter / dependency-cruiser) y se ejecutan en CI; una violación rompe el build, no espera a una
   revisión humana.

---

## 2. Backend — Clean / Hexagonal (Ports & Adapters)

### 2.1 Capas

```
src/
  domain/          # Entidades, value objects, reglas de negocio puras, PUERTOS (interfaces)
  application/     # Casos de uso (interactors), orquestan el dominio, definen DTOs de entrada/salida
  infrastructure/  # ADAPTADORES: repos SQLAlchemy, gateway de pagos, correo, redis, etc.
  interface/       # FastAPI: routers, schemas Pydantic (request/response), wiring de DI
```

| Capa | Conoce a… | NO puede importar |
|------|-----------|-------------------|
| `domain` | (nadie) | `application`, `infrastructure`, `interface`, FastAPI, SQLAlchemy, Pydantic |
| `application` | `domain` | `infrastructure`, `interface` |
| `infrastructure` | `domain`, `application` | `interface` |
| `interface` | `domain`, `application` (e `infrastructure` solo para el wiring de DI) | — |

### 2.2 Regla de dependencia (contratos del "policía")

Las dependencias apuntan **hacia adentro**. Estos son los contratos que import-linter debe hacer cumplir
(redactados como reglas, listos para traducir a `importlinter` / `dependency-cruiser`):

- `domain` no importa de `application`, `infrastructure` ni `interface`.
- `application` no importa de `infrastructure` ni `interface`.
- `infrastructure` no importa de `interface`.
- Ninguna capa de negocio (`domain`, `application`) importa FastAPI, SQLAlchemy ni Pydantic.

> El **wiring de la inyección de dependencias** (que conecta puertos con adaptadores) es la única zona donde
> `interface` toca `infrastructure`, y vive en un módulo de composición explícito (composition root).

### 2.3 Flujo de una petición

```
HTTP → [interface: router + schema Pydantic]
     → [application: caso de uso]
     → [domain: entidades + puerto (interfaz)]
     ← [infrastructure: adaptador que implementa el puerto: repo SQLAlchemy / gateway]
     ← respuesta mapeada a schema Pydantic → HTTP
```

### 2.4 Línea base de seguridad (6 vectores — contratos verificables del policía)

Junto a la regla de dependencia (§2.2), el estilo fija una **línea base de seguridad transversal** que el
"policía" y el CI **hacen cumplir** (estilo §1.5: verificable, no documental; brief §8). Es **adaptable por
proyecto (D-027)** y **mínima (E4)**: se ajusta en el gate, no se infla. Cada vector se redacta como **regla
ejecutable** lista para traducir a la config del linter / CI (las dos primeras —violación de capa y anti-SQLi—
se **demuestran siempre** con una corrida real; las demás: configuradas-y-verificadas o topan la dimensión).

| # | Vector | Contrato (regla del policía / config / CI) | Verificación |
|---|--------|--------------------------------------------|--------------|
| 1 | **SQL Injection** | SQL crudo (`sqlalchemy.text`, f-strings/concatenación en queries) **confinado** a un adaptador firmado en `infrastructure`; prohibido en el resto. Se materializa con la regla **Bandit `S608`** (`hardcoded-sql-expression`) de Ruff, acotada por `per-file-ignores` al módulo del adaptador; reforzada por la regla de capas (`domain`/`application` no importan `sqlalchemy`, §2.2). | **Ancla D4**: inyectar SQL crudo fuera del adaptador → `ruff check` **falla** → revertir. |
| 2 | **Validación de entrada** | Toda entrada cruza **Pydantic** (backend, capa `interface`) / **Zod** (frontend, en la frontera de la feature) antes de llegar al dominio; `domain` no recibe dicts crudos. | Routers tipan request/response con schemas Pydantic; presencia de Zod en features. |
| 3 | **Gestión de secretos** | `pydantic-settings` (12-factor); **cero secretos en el código**; **secret-scan** (`gitleaks`/`detect-secrets`) en pre-commit + job CI `security`; `.env` en `.gitignore`. | Job CI presente y corre limpio; cero secretos en el árbol. |
| 4 | **AuthN/Z** | **JWT** backend (passlib/bcrypt) + autorización por **rol/scope** vía `Depends()` en la **capa de aplicación**, no en la UI (D-A). | El puerto de identidad vive donde corresponde; la autorización no está solo en frontend. |
| 5 | **XSS / headers / CORS** | Regla lint contra `dangerouslySetInnerHTML` (frontend, §3); **security headers** + **CORS restrictivo** por default en FastAPI. | El lint frontend caza el uso prohibido; el backend expone headers/CORS comprobables. |
| 6 | **Higiene de dependencias** | `pip-audit` / `npm audit` (+ `deptry`) en el job CI `security`; lockfiles (`uv.lock`, `package-lock`/`pnpm-lock`) commiteados. | Job CI presente y corre; sin CVE conocidas en el árbol base. |

> Estos contratos se **materializan** en la config del policía (import-linter / dependency-cruiser / Ruff),
> el `.clinerules` y el **workflow de CI** (jobs `policy` y `security` que **rompen el build**, no advierten).
> El detalle accionable por vector y la asignación de dueño viven en el plan del 020 (§8.2/§8.3); la
> seguridad **por slice** (authz por escenario, pruebas de abuso) es de los arneses 030 y 060, no del 020.

### 2.5 Topología: monolito en capas vs monolito modular  *(D-N — FIRME: default plano, modular firmable)*

El estilo decide la **forma interna** del backend, no solo sus capas. Hay un eje de **topología** que el 020
fija en el gate de decisión (CP-01g), análogo al modo relajado:

- **Default — monolito en capas (plano):** un único conjunto `src/{domain,application,infrastructure,interface}`
  (§2.1). Es lo correcto para la **gran mayoría** de proyectos (un dominio cohesivo). No se cambia salvo
  evidencia.
- **Opción firmable — monolito modular ("habitaciones por dominio"):** para proyectos **grandes /
  multi-dominio**, el código se parte en **módulos por bounded context**, cada uno con sus propias capas,
  **dentro del mismo despliegue** (un solo proceso, una sola base de datos, un solo deploy):

  ```
  src/
    modules/
      <dominio_a>/{domain,application,infrastructure,interface}
      <dominio_b>/{domain,application,infrastructure,interface}
    shared/            # kernel compartido mínimo (tipos base, utilidades); NO lógica de negocio de un módulo
    main.py            # composition root: monta los routers de cada módulo
  ```

  - **Fronteras inter-módulo (contratos del policía, extienden §2.2):** un módulo **no importa las capas
    internas de otro**; si A necesita a B, lo hace por el **puerto público** de B (su `interface`/un
    contrato explícito), nunca alcanzando su `domain`/`infrastructure`. Esto lo **hace cumplir
    import-linter** (contratos `forbidden` entre `modules.<a>` y las capas internas de `modules.<b>`), igual
    que las capas. Sin esto, un "modular" se degrada a monolito enredado.
  - **Una base de datos, esquemas/prefijos por módulo** (no una DB por módulo: eso ya sería distribuido).

- **Fuera de alcance del 020 — microservicios ("edificios separados"):** NO es un default ni lo propone el
  agente. Es un salto caro (operación distribuida, consistencia eventual) que casi nunca conviene y es
  **decisión humana deliberada y explícita**, no emergente (L-020). El 020 no lo andamia.

**Criterio determinista (cuándo proponer modular).** El `architecture-adapter` propone **modular** solo si el
roadmap muestra **señales fuertes de múltiples dominios**; ante duda → **plano** (default seguro):

| Señal (apunta a modular) | Cómo se evidencia en el roadmap/BDD |
|--------------------------|--------------------------------------|
| **≥ 3 bounded contexts** claramente separables (áreas de negocio con vocabulario propio) | Las slices se agrupan en familias temáticas con poco solape de entidades |
| **Alto número de entidades** (umbral orientativo **> ~20**) repartidas en esas familias | Conteo y agrupamiento de entidades por las slices |
| **Equipos/propiedad por dominio** o evolución independiente prevista | Señales del roadmap / alcance diferido por área (hermano de I-007 multi-dev) |

> Si **ninguna** señal es fuerte → **plano**. La elección + su evidencia se vuelca en `effective_config.md`
> (estilo efectivo) y se firma en CP-01g; el `governance-weaver` traduce las fronteras inter-módulo a
> contratos de import-linter **solo si** la topología firmada es modular.

---

## 3. Frontend — Modular por features (Next.js App Router)

```
app/                   # Rutas (App Router, React Server Components por defecto)
src/
  features/<feature>/  # Co-locación: components, hooks, api-client, schemas Zod, tipos
  components/ui/        # shadcn/ui (primitivos compartidos)
  lib/                  # cliente HTTP, config TanStack Query, utilidades
```

- **Server Components** para datos (fetch en servidor); **Client Components** solo donde hay interactividad.
- **Cliente TS generado del OpenAPI** (codegen): los tipos del frontend derivan del contrato real del
  backend → tipado punta a punta (cierra el §1.1 del stack).
- **Validación de formularios con Zod** derivada/replicando la forma del contrato OpenAPI (misma forma que
  Pydantic en el backend).
- **dependency-cruiser** vigila que las features no se importen entre sí de forma indebida (acoplamiento
  cruzado) y que `components/ui` no dependa de `features`.

---

## 4. Patrones de diseño (vocabulario del scaffold)

| Patrón | Dónde | Para qué |
|--------|-------|----------|
| **Ports & Adapters** | pagos, correo, redis | Puerto en `domain`, adaptador en `infrastructure`; cambiar proveedor sin tocar negocio |
| **Repository** | acceso a datos | El dominio habla con interfaces; SQLAlchemy confinado a `infrastructure` |
| **Use Case / Interactor** | `application` | Un caso de uso = una operación de negocio; orquesta entidades + puertos |
| **Unit of Work** | transacciones | Una sesión SQLAlchemy por caso de uso; commit/rollback atómico |
| **DTO / Schema separation** | fronteras | 3 representaciones: schema Pydantic (API) ≠ entidad de dominio ≠ modelo ORM |
| **Dependency Injection** | `interface` | `Depends()` de FastAPI inyecta repos/adaptadores; habilita el mock-first del stack §3 |
| **Strategy + Factory** | proveedores | Seleccionar pago/correo por región/config detrás del puerto |
| **Mapper** | entre capas | Conversión explícita ORM↔dominio↔schema |

> El patrón eje es la **separación de las 3 representaciones**: es lo que mantiene el dominio puro y permite
> al policía hacer cumplir las fronteras.

---

## 5. Modelado de datos y esquema

El stack (bloque A §3) fija PostgreSQL 18 + pgvector + FTS, SQLAlchemy + Alembic. Este bloque fija **cómo
modelar**:

### 5.1 Separación modelo ORM ↔ entidad de dominio  *(D-G — FIRME: estricto, modo relajado por checklist)*
- El **modelo SQLAlchemy NO es la entidad de dominio**. El **repositorio mapea** ORM↔dominio.
- Es el **default (estricto)**; un proyecto genuinamente CRUD-simple puede aprobar el **modo relajado** (ORM
  anémico usado como dominio, sin mapper) como **excepción firmada en el gate** del 020.

**Criterio determinista del modo relajado (no es juicio libre del agente).** Para evitar varianza entre
corridas (paralelo a la calibración de rúbrica, T-016), el `architecture-adapter` **no decide a ojo**: evalúa
una **checklist verificable** contra el `roadmap-manifest.json` + los BDD del 010. Propone **relajado** solo
si se cumplen **TODAS** las casillas; si **falla cualquiera**, propone **estricto** (el default). El humano
firma en CP-01g.

| # | Casilla (se cumple ⇒ apto para relajado) | Cómo se evidencia en el roadmap/BDD |
|---|------------------------------------------|--------------------------------------|
| 1 | **Sin reglas de negocio no-CRUD** — solo crear/leer/actualizar/borrar + validación trivial de campos | Ningún escenario describe cálculos, derivaciones o políticas más allá de persistir/leer |
| 2 | **Sin invariantes de dominio ni máquinas de estado** — no hay reglas que deban protegerse en el dominio (transiciones, totales, cupos…) | Ningún BDD impone una invariante (`Given` que restrinja estados/valores válidos entre operaciones) |
| 3 | **Sin workflows multi-paso ni orquestación entre entidades** — cada operación toca una entidad de forma aislada | Ningún escenario encadena pasos/entidades (p. ej. "al confirmar X, se actualiza Y y se notifica Z") |
| 4 | **Un solo bounded context** — un dominio cohesivo, no varios agrupados | El roadmap no parte el producto en dominios separados (ver topología §2.5) |
| 5 | **Por debajo del umbral de entidades** — **< 8 entidades de negocio** | Conteo de entidades inferibles de las slices/BDD |
| 6 | **Sin integraciones externas con lógica** — pagos, correo con reglas, colas, etc. (su puerto/adaptador ya exige dominio real) | Ningún puerto a servicio externo con comportamiento de negocio |

> **Default seguro:** ante duda o dato no inferible del roadmap, la casilla **se considera NO cumplida** →
> estricto. La checklist + su resultado (cada casilla con su evidencia) se vuelca en `effective_config.md`
> (estilo efectivo) para que el gate sea auditable y reproducible. Relajar **no** es "menos calidad": es
> reconocer un dominio sin reglas; en cuanto aparece una regla, el mapper estricto paga su costo.

### 5.2 Representación del dominio  *(D-F — FIRME: dataclasses)*
- Las entidades y value objects del dominio son **dataclasses puras** (sin Pydantic). La validación vive en
  los **value objects** del dominio. Pydantic se reserva para schemas de API (`interface`) y settings.

### 5.3 Claves primarias  *(D-H — FIRME: UUIDv7)*
- **UUIDv7 por defecto**, usando `uuidv7()` **nativo de PostgreSQL 18**: ordenable por tiempo (buena
  localidad de índice), no filtra conteos, sin colisión entre servicios.
- `bigint identity` queda como opción para proyectos cerrados que prioricen rendimiento puro.

### 5.4 Visibilidad / control de acceso por fila  *(D-I — FIRME: scoping en repositorio)*
- **Scoping en el repositorio** por defecto: filtrar por `owner`/`scope` en cada query. Explícito,
  testeable, portable.
- **RLS de PostgreSQL** queda como **opción avanzada firmable** por proyecto (datos muy sensibles,
  multi-tenant duro), a cambio de mayor complejidad operativa y de migraciones.

### 5.5 Convenciones de esquema (default)
- **Dinero:** entero en unidades mínimas (o `NUMERIC`), **nunca `float`**.
- **Tiempo:** `timestamptz` para `created_at` / `updated_at`.
- **Nombres:** `snake_case`; FKs siempre con constraint.
- **Enums de negocio:** tabla de lookup (más migrable que el `ENUM` nativo de Postgres).
- **Soft-delete:** `deleted_at` solo donde el negocio lo pida (no por defecto).
- **Migraciones:** Alembic, una por cambio, **nunca editar una ya aplicada**; revisar el autogenerate (no
  confiar a ciegas).

---

## 6. Cómo sirve este estilo a los 6 arneses

| Arnés | Qué consume de este estilo |
|-------|-----------------------------|
| 010 Discovery | (Agnóstico; sin dependencia del estilo.) |
| **020 Architecture** | **Genera** el scaffold de capas + traduce las reglas §2.2/§2.4/§3 al "policía" (import-linter / dependency-cruiser / Ruff) y al CI. |
| 030 Contract & Mold | Ubica schemas Pydantic/Zod en `interface`/features; los puertos del dominio guían los mocks. |
| 040 Tactical Planning | Mapea cada tarea a su capa (domain/application/infrastructure/interface). |
| 050/070 Execution | Programa bajo TDD respetando las fronteras; el policía falla el build ante una violación. |
| 060 Validation | Las fronteras claras facilitan aislar y testear; E2E sobre `interface`, unidad sobre `domain`. |

---

## 7. Decisiones de este bloque

| ID | Decisión | Estado | Resumen |
|----|----------|--------|---------|
| D-F | Representación del dominio | FIRME | **Dataclasses puras** (sin Pydantic en `domain`); validación en value objects |
| D-G | Mapeo ORM↔dominio | FIRME | **Estricto por default** (repositorio mapea); modo relajado = excepción firmada por **checklist determinista** (§5.1), no a juicio del agente |
| D-H | Clave primaria por defecto | FIRME | **UUIDv7** nativo de PG18; `bigint identity` como opción |
| D-I | Visibilidad / acceso por fila | FIRME | **Scoping en el repositorio**; RLS como opción avanzada firmable |
| D-N | Topología del backend | FIRME | **Monolito en capas (plano) por default**; **monolito modular** (módulos por bounded context, fronteras enforced por import-linter) firmable para proyectos grandes/multi-dominio por **criterio determinista** (§2.5); microservicios fuera de alcance del 020 (decisión humana) |

> Decisiones aún abiertas que afectan al estilo pero pertenecen al bloque A / al brief del 020: **D-A**
> (auth/authz) condiciona dónde viven los puertos de identidad; ver `stack_tec.md` §5 y §11.
