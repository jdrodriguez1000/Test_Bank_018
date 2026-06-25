# stack_tec.md — Stack Tecnológico de referencia (Arnés 020_architecture)

> **Qué es este archivo.** La definición del **stack tecnológico estándar** con el que CADEN fabricará
> software sobre las carpetas de proyecto. Es uno de los **tres bloques de entrada** del Arnés
> `020_architecture` (ver §9). Toma como base el stack habitual del usuario y lo completa con las piezas
> necesarias para que el motor pueda andamiar, programar, validar y desplegar un proyecto end-to-end.
>
> **Qué NO es.** No define el **estilo arquitectónico** (Clean/Hexagonal, capas, reglas del "policía
> invisible") ni la **identidad visual / design system** (I-001). Esos son los otros dos bloques de
> entrada del 020 y viven en sus propios documentos.
>
> **Convención de versiones.** Las versiones marcadas en firme son elecciones deliberadas. Las marcadas
> `(verificar)` son sugerencias cuya versión exacta debe confirmarse con la documentación vigente antes de
> fijarlas en el scaffold.

---

## 0. Naturaleza del stack: base adaptable por proyecto

Este stack es la **base por defecto de la gran mayoría de los proyectos** que CADEN fabricará — **no** una
imposición rígida ni un catálogo abierto. Cuando el **Arnés 020 se ejecuta** sobre un proyecto concreto,
debe tratarlo como punto de partida y **adaptarlo al proyecto**, en este orden:

1. **Verificar aplicabilidad.** Determinar, según las necesidades reales del proyecto (el
   `roadmap-manifest.json` y los BDD que produjo el Arnés 010), **qué partes de este stack aplican** y
   cuáles no. Lo que no aporta valor al proyecto no se arrastra.
2. **Sugerir adiciones / complementos.** Proponer tecnologías que **mejoren o completen** el stack para las
   necesidades **particulares** de ese proyecto (lo que la base no cubre). Cada sugerencia se justifica
   contra una necesidad concreta.
3. **Presentar al humano y firmar.** El **stack efectivo del proyecto = base aplicable + adiciones
   aprobadas**, ratificado en el gate del 020. La base nunca se impone a ciegas.

> Esto **resuelve la decisión D-B** (§11): el stack no es totalmente fijo ni un menú libre, sino una
> **base opinionada con adaptación contextual aprobada por el humano**. Mantiene baja la varianza (objetivo
> del harness) sin forzar tecnología que un proyecto no necesita.

### 0.1 Política de piso de versiones — "última estable madura, no la recién salida"  *(D-C — FIRME)*

La plantilla base **no shippea el filo**. El scaffold que el motor fabrica debe **arrancar y compilar
limpio** y nacer **sin CVEs conocidas**; perseguir el último major recién publicado pone en riesgo ese
objetivo (incompatibilidades de librerías, fallbacks en caliente, vulnerabilidades transitivas). Por eso:

1. **Piso = última estable madura.** Para cada herramienta, la base fija la **última versión estable
   probada**, normalmente el major anterior al recién salido (p. ej. Python 3.13 en vez de 3.14, Next.js
   15.x en vez de 16.x, TypeScript 5.9 en vez de 6.0), y dentro de ese major un **patch probado**, no el
   día-0 de un minor nuevo.
2. **0 CVEs en el lockfile base.** El lockfile base no debe tener vulnerabilidades conocidas (lo verifica el
   `governance-weaver` en el vector de dependencias, §2.4 del estilo). Si la única forma de quedar limpio es
   subir/bajar una versión, se ajusta el piso.
3. **Excepción load-bearing.** Si un major **nuevo** es **requisito de una decisión FIRME** del diseño, se
   mantiene ese major (no se baja), fijando un patch estable. Hoy aplica a: **Tailwind 4** (OKLCH + `@theme`
   CSS-first del design system) y **PostgreSQL 18** (`uuidv7()` nativo, D-H). Estas excepciones se documentan
   explícitamente.
4. **El filo es opt-in del proyecto.** Un proyecto puede **subir** cualquier pieza a su última versión en el
   **gate del 020** (firma humana), asumiendo el riesgo. La base no lo hace por defecto.

> Esta política **resuelve D-C** (§11) y la generaliza más allá de Python: aplica a todo el stack. Convierte
> la "postura al filo" (que ya causó síntomas reales: mismatch 3.13/3.14, vulns postcss, fallbacks en
> caliente) en una regla de defecto conservadora con escape firmable.

---

## 1. Principios del stack

1. **Tipado de punta a punta.** TypeScript en el frontend, Python con type hints + Pydantic en el backend.
   El contrato de datos es una sola verdad que cruza la frontera HTTP.
2. **Contrato antes que código.** La API se describe con OpenAPI (autogenerado por FastAPI) y se valida en
   ambos lados (Pydantic en backend, Zod en frontend). Encaja con el Arnés 030 (Contract & Mold).
3. **Simular primero, integrar después.** Servicios externos (pagos, correo) arrancan simulados/mockeados
   y se conectan cuando el comportamiento está probado.
4. **Reproducibilidad.** Entornos gestionados con `uv` (Python) y lockfiles; servicios en Docker para
   paridad dev/CI/prod.
5. **Opinión fuerte, puntos de extensión claros.** El stack es opinionado para reducir varianza (objetivo
   del harness), pero deja decisiones abiertas explícitas donde el proyecto puede variar (§10).

---

## 2. Resumen del stack (tabla)

| Capa / Función | Tecnología | Versión |
|----------------|------------|---------|
| Base de datos | PostgreSQL (en Docker) | 18.4 |
| Extensiones DB | pgvector · Full-text search | pgvector 0.8.2 |
| Backend — lenguaje | Python | 3.13.x (piso estable, D-C) |
| Backend — framework | FastAPI | 0.137.1 |
| Backend — servidor ASGI | Uvicorn | 0.49.0 |
| Backend — ORM / migraciones | SQLAlchemy / Alembic | 2.0.51 / 1.18.4 |
| Backend — validación / settings | Pydantic / pydantic-settings | 2.13.4 / 2.14.2 |
| Frontend — framework | Next.js | 15.5.19 (piso estable, D-C) |
| Frontend — lenguaje | TypeScript | 5.9.3 (piso estable, D-C) |
| Frontend — estilos | Tailwind CSS | 4.x (línea estable; **load-bearing** del design system OKLCH/CSS-first) |
| Frontend — componentes (UI base) | shadcn/ui (CLI) · lucide-react | shadcn 4.11.0 · lucide-react 1.21.0 |
| Frontend — data fetching / estado servidor | TanStack Query | 5.101.0 |
| Frontend — formularios + validación | React Hook Form + Zod | 7.80.0 / 4.4.3 |
| Comunicación front ↔ back | REST API (OpenAPI) | — |
| Comunicación back ↔ db | ORM (SQLAlchemy) | — |
| Comunicación pasarela ↔ back | Webhook | — |
| Autenticación / autorización | JWT propio del backend (passlib/bcrypt; rol/scope) — ver §5 (D-A FIRME) | — |
| Pagos | Stripe / Wompi / MercadoPago (simulado primero) | — |
| Correos transaccionales | AWS SES / Brevo / Resend | — |
| Cola / caché / sesiones | Redis (imagen Docker) + cliente redis-py | redis-py 8.0.0 · imagen `redis:8` |
| Trabajos en background | FastAPI BackgroundTasks → ARQ/Celery si escala | ARQ 0.28.0 / Celery 5.6.3 |
| Gestión de entorno Python | uv | 0.11.21 |
| Testing — unit/integración (back) | pytest + httpx | pytest 9.1.0 · httpx 0.28.1 |
| Testing — E2E / navegador | Playwright | py 1.60.0 · @playwright/test 1.61.0 |
| Lint / format — Python | Ruff | 0.15.18 |
| Lint / format — TS/JS | ESLint + Prettier (o Biome) | ESLint 10.5.0 · Prettier 3.8.4 · (Biome 2.5.0) |
| Type-check estático | mypy o pyright (Py) · tsc (TS) | mypy 2.1.0 · pyright 1.1.410 |
| Gobernanza de arquitectura ("policía") | import-linter / deptry (Py) · dependency-cruiser (TS) | import-linter 2.11 · deptry 0.25.1 · dependency-cruiser 17.4.3 |
| Empaquetado / contenedores | Docker + docker-compose | — |
| CI/CD | GitHub Actions | — |
| Observabilidad | logging estructurado (structlog) · Sentry (opcional) | structlog 26.1.0 · sentry-sdk 2.63.0 |

---

## 3. Base de datos

- **PostgreSQL 18.4**, ejecutándose en **Docker** (un contenedor por proyecto; volumen persistente).
- **Extensiones desde el inicio:**
  - **pgvector 0.8.2** — búsqueda por embeddings (habilita escenarios de búsqueda semántica y prepara el
    terreno para conocimiento compartido, idea I-002).
  - **Full-text search** nativo de PostgreSQL — búsqueda textual sin servicio externo.
- **Acceso vía ORM** (no SQL crudo en la capa de negocio): **SQLAlchemy** (modelo declarativo) +
  **Alembic** para migraciones versionadas. Toda migración se versiona en git.

---

## 4. Backend

- **Lenguaje:** Python **3.13.x** (piso estable, **D-C FIRME**).
  > **Por qué 3.13 y no 3.14:** la plantilla base shippea la **última versión madura**, no la recién salida
  > (política de piso estable, §0.1). 3.13 tiene soporte completo de todas las librerías del stack (incl.
  > extensiones C); 3.14 era muy reciente y arrastraba riesgo de compatibilidad + un mismatch real
  > Dockerfile/`.python-version`. Un proyecto puede **optar por 3.14** (o superior) en el gate del 020 si lo
  > necesita y lo firma. Fija **3.13** tanto en `.python-version` como en la imagen Docker (`python:3.13-slim`)
  > para que ambas capas coincidan.
- **Framework:** **FastAPI 0.137.1** — async, tipado, **OpenAPI autogenerado**.
- **Servidor ASGI:** **Uvicorn 0.49.0**.
- **Validación y configuración:** **Pydantic** (modelos/DTOs, ya incluido con FastAPI) +
  **pydantic-settings** para configuración por entorno (12-factor, sin secretos en el código).
- **ORM / migraciones:** SQLAlchemy + Alembic (ver §3).
- **Gestión de entorno y dependencias:** **uv 0.11.21** — instala librerías, gestiona el entorno virtual,
  instala/gestiona versiones de Python y administra el proyecto completo. Un único gestor.

---

## 5. Autenticación y autorización  *(D-A — FIRME: JWT propio del backend)*

El stack base **no traía** capa de identidad y casi toda aplicación la necesita. **Decisión cerrada en el
brief del 020 (2026-06-21):** el **default del motor** es autenticación propia del backend.

- **Default (FIRME):** autenticación emitida por el **backend** con **JWT** (access + refresh), hashing de
  contraseñas con **passlib/bcrypt**, y dependencias de FastAPI para autorización por **rol/scope**. Sin
  dependencia externa, control total, coherente con el stack Python.
- **Sustituciones por proyecto (adición aprobada en el gate, D-027):**
  - **OAuth/social:** **Auth.js (NextAuth)** en el frontend si se requieren proveedores externos
    (Google, etc.), con el backend validando el token.
  - **"Comprar, no construir":** proveedor gestionado (Clerk / Auth0 / Supabase Auth / Keycloak) si se
    prioriza time-to-market sobre control.

> El default es **base adaptable**: el 020 lo verifica al ejecutarse y el humano puede sustituirlo en el
> gate. Condiciona scaffold, contratos y pruebas; por eso se fijó al definir el brief del 020.

---

## 6. Frontend

- **Framework:** **Next.js 15.5.19** (App Router, React Server Components) — piso estable (**D-C**); 16.x es
  opt-in firmable en el gate.
- **Lenguaje:** **TypeScript 5.9.3** — piso estable (**D-C**); 6.x es opt-in firmable en el gate.
- **Estilos:** **Tailwind CSS 4.x** (en v4 la configuración es CSS-first; los design tokens viven aquí). Se
  mantiene en v4 (no se baja al LTS v3) porque es **load-bearing**: el design system usa OKLCH + `@theme`
  CSS-first, exclusivos de v4. Se fija un patch estable probado, no el día-0 de un minor nuevo.
- **UI / componentes base:** **shadcn/ui** (Radix UI + Tailwind) + **lucide-react** (iconos) +
  `next/font` (tipografía). Es la base sobre la que se aplica la **identidad visual** (I-001), que se
  define en su propio documento de entrada del 020.
- **Datos del servidor:** **TanStack Query** (fetching, caché, reintentos, estados de carga).
- **Formularios + validación:** **React Hook Form + Zod**. Los esquemas Zod replican/derivan del contrato
  OpenAPI para validar en cliente con la misma forma que el backend.

---

## 7. Comunicación entre componentes

```
[ Navegador / Next.js ]  --REST (OpenAPI, JSON)-->  [ FastAPI ]  --ORM-->  [ PostgreSQL ]
        |                                                  ^
        |  inicia compra                                   | webhook (confirmación)
        v                                                  |
[ Pasarela de pagos ]  ------------------------------------+
```

- **Frontend ↔ Backend:** **REST API** descrita con **OpenAPI**. Recomendado generar el **cliente TS**
  desde el OpenAPI (codegen) para que los tipos del frontend deriven del contrato real del backend.
- **Backend ↔ DB:** vía **ORM** (SQLAlchemy); migraciones con Alembic.
- **Pasarela ↔ Backend:** **webhook**. En una compra, el **frontend** se comunica con la pasarela y la
  **pasarela** confirma al **backend** por webhook (no el frontend directamente al backend para confirmar).

---

## 8. Servicios e integraciones

### 8.1 Pagos
- Opciones: **Stripe** (mundial, no habilitado en Colombia), **Wompi** (Colombia), **MercadoPago**
  (Latinoamérica).
- **Estrategia:** **se simula inicialmente** (adaptador mock) y se conecta el proveedor real cuando el
  flujo está probado. La integración debe estar **detrás de una interfaz/puerto** (un solo punto de
  cambio) para poder alternar de proveedor por región sin tocar la lógica de negocio.
- Comunicación de confirmación: **webhook** hacia el backend.

### 8.2 Correos transaccionales
- Opciones: **AWS SES**, **Brevo**, **Resend** (decidir por proyecto; mismo patrón de adaptador detrás de
  una interfaz). Envío preferentemente **asíncrono** (ver §8.3).

### 8.3 Cola / caché / background
- **Redis** (en Docker): caché, sesiones y *message broker*.
- **Trabajos en background:** empezar con `BackgroundTasks` de FastAPI para casos simples (p. ej. enviar
  correo tras una acción); escalar a **ARQ / Celery / Dramatiq** + Redis cuando se requieran reintentos,
  programación o concurrencia real (procesar webhooks, reportes).

---

## 9. Calidad, gobernanza y operación

### 9.1 Testing
- **Unit / integración (backend):** **pytest** 9.1.0 + **httpx** 0.28.1 (para probar las APIs/código).
- **E2E / navegador:** **Playwright** — requerido por el **Arnés 060 (Validation)** para simular al
  usuario sobre los escenarios BDD en un sandbox. (El stack base no lo incluía; es indispensable.)

### 9.2 Lint / format / type-check
- **Python:** **Ruff** (lint + format) · **mypy** o **pyright** (tipos).
- **TS/JS:** **ESLint + Prettier** (o **Biome** como alternativa todo-en-uno) · `tsc` (tipos).
- **pre-commit** para correr estas verificaciones antes de cada commit.

### 9.3 Gobernanza de arquitectura — el "policía invisible"
El statement nombra *dependency-cruiser* (TS), pero como el backend es **Python** hace falta su contraparte:
- **Python:** **import-linter** o **deptry** — prohíben imports que violen las capas (p. ej. que `domain`
  importe de `infrastructure`).
- **TS/JS:** **dependency-cruiser**.
> Estas herramientas materializan las reglas del **estilo arquitectónico** (bloque B del input del 020).

### 9.4 Observabilidad
- **Logging estructurado** (p. ej. structlog) y **error tracking** opcional (Sentry). Soporta el principio
  de observabilidad/trazabilidad (P8 de la metodología).

### 9.5 Contenedores y despliegue
- **Docker** para la base de datos y **para empaquetar** la aplicación.
- **docker-compose** para el entorno de desarrollo completo (PostgreSQL + Redis + backend), garantizando
  paridad dev/CI.
- **Destino de despliegue** (a definir por proyecto): típicamente **Vercel** para Next.js + un host de
  contenedores (Railway / Fly.io / AWS) para FastAPI + PostgreSQL gestionado.

### 9.6 CI/CD
- **GitHub Actions:** en cada push, correr lint + type-check + tests (unit/integración) y, en ramas de
  validación, los E2E. Encaja con el versionado git autónomo que el motor ya gestiona.

---

## 10. Cómo sirve este stack a los 6 arneses

| Arnés | Qué consume del stack |
|-------|------------------------|
| 010 Discovery | (Agnóstico de tecnología; sin dependencia del stack.) |
| **020 Architecture** | **Define** el scaffold según el estilo arquitectónico + instala el "policía" (import-linter / dependency-cruiser) + tooling base (uv, docker-compose, lint, CI) + tema/tokens (I-001). |
| 030 Contract & Mold | OpenAPI + Pydantic (back) + tipos TS/Zod (front) + mocks. |
| 040 Tactical Planning | Mapea tareas a capas del scaffold (domain/application/infrastructure). |
| 050/070 Execution | Programa bajo TDD con pytest/Playwright; respeta el "policía" en cada refactor. |
| 060 Validation | Levanta sandbox en Docker; corre regresión (pytest) + E2E (Playwright) contra el BDD. |

---

## 11. Decisiones abiertas (a cerrar en el brief/diseño del 020)

- **D-A — Autenticación/Autorización:** elegir entre JWT propio del backend, Auth.js, o proveedor
  gestionado (§5).
- **D-B — Stack fijo o parametrizable → RESUELTA:** el stack es una **base adaptable por proyecto** (ver
  §0). El 020, al ejecutarse, verifica aplicabilidad y sugiere adiciones/complementos, con aprobación
  humana en el gate. Ni totalmente fijo ni menú libre.
- **D-C — Piso de versiones → RESUELTA:** **política de piso estable** (§0.1) — la base shippea la última
  estable **madura** (no la recién salida), con **0 CVEs** en el lockfile, **excepción load-bearing** para
  majors requeridos por decisiones FIRMES (Tailwind 4, PostgreSQL 18), y **filo opt-in** por proyecto en el
  gate. Floor efectivo: Python **3.13**, Next.js **15.5.19**, TypeScript **5.9.3**; React 19.2.7, Tailwind 4.x
  y PostgreSQL 18 se mantienen por madurez / load-bearing.
- **D-D — Proveedores por defecto:** correo (SES/Brevo/Resend) y pagos por región (Stripe/Wompi/MercadoPago).
- **D-E — Destino de despliegue** por defecto de la plantilla (§9.5).

---

## 12. Notas de versiones

- **Versiones base (piso estable, D-C — política §0.1; números verificados contra npm/PyPI el 2026-06-24):**
  PostgreSQL **18** (load-bearing: `uuidv7()` nativo, D-H), pgvector 0.8.2, Python **3.13.x** (no 3.14),
  FastAPI 0.137.1, Uvicorn 0.49.0, Next.js **15.5.19** (no 16.x), TypeScript **5.9.3** (no 6.x), React 19.2.7,
  Tailwind **4.x** (load-bearing: OKLCH/CSS-first del design system), uv 0.11.21, pytest 9.1.0, httpx 0.28.1.
  Las piezas marcadas *load-bearing* mantienen el major nuevo por requisito de una decisión FIRME; el resto
  baja al último major maduro. Un proyecto puede subir cualquiera al filo en el gate (opt-in firmable).
- Las versiones de las **adiciones recomendadas** fueron **verificadas el 2026-06-21** contra los registros
  oficiales (**PyPI** para Python, **npm** para JS/TS) tomando la última estable publicada:
  SQLAlchemy 2.0.51 · Alembic 1.18.4 · Pydantic 2.13.4 · pydantic-settings 2.14.2 · redis-py 8.0.0 ·
  ARQ 0.28.0 · Celery 5.6.3 · Ruff 0.15.18 · mypy 2.1.0 · pyright 1.1.410 · import-linter 2.11 ·
  deptry 0.25.1 · structlog 26.1.0 · sentry-sdk 2.63.0 · playwright (py) 1.60.0 · @playwright/test 1.61.0 ·
  @tanstack/react-query 5.101.0 · react-hook-form 7.80.0 · zod 4.4.3 · lucide-react 1.21.0 · eslint 10.5.0 ·
  prettier 3.8.4 · @biomejs/biome 2.5.0 · typescript-eslint 8.61.1 · dependency-cruiser 17.4.3 · shadcn 4.11.0.
- **Nota sobre Redis:** `redis-py 8.0.0` es el **cliente** Python; la **imagen Docker** del servidor se fija
  por tag (`redis:8`). Son dos versionados distintos.
- **Nota sobre shadcn/ui:** la versión corresponde a la **CLI** (`shadcn`), no a las librerías base; los
  componentes se copian al proyecto (Radix UI + Tailwind como dependencias).
