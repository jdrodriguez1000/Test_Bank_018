# Verificación del Policía y Seguridad — 020 Architecture

> Producido por el worker `governance-weaver` (CP-03) en Modo Inicio (INC-4).
> Proyecto: Reservas Sala Comunitaria. Fecha: 2026-06-25.
> Topología firmada: **PLANO** (D-N CP-01g) — un solo conjunto de 4 capas en `backend/src/`.
> Auth firmado: **jwt_backend** (D-A CP-01g) — puerto de identidad en `src/application/`.
> Corridas reales de herramientas; nada fabricado (L-009).

---

## 1. Contratos de capas configurados (plan §8.1)

### Backend — import-linter (`backend/pyproject.toml [tool.importlinter]`)

Cuatro contratos ejecutables traducen `architecture_style.md §2.2`:

| # | Nombre | Tipo | Regla |
|---|--------|------|-------|
| 1 | Clean/Hexagonal layers (dependencia hacia adentro) | `layers` | `src.interface > src.infrastructure > src.application > src.domain` |
| 2 | domain puro (sin frameworks ni capas externas) | `forbidden` | `src.domain` no importa `src.application`, `src.infrastructure`, `src.interface`, `fastapi`, `sqlalchemy`, `pydantic` |
| 3 | application sin infraestructura/interface ni frameworks | `forbidden` | `src.application` no importa `src.infrastructure`, `src.interface`, `fastapi`, `sqlalchemy` |
| 4 | infrastructure no depende de interface | `forbidden` | `src.infrastructure` no importa `src.interface` |

- `root_package = "src"` · `include_external_packages = true` (requerido para los paquetes externos en forbidden)
- **Composition root:** el único punto donde `src.interface` puede tocar `src.infrastructure` es el módulo de wiring DI (convencionalmente `src/interface/container.py` o `src/interface/dependencies.py`). El contrato `layers` ya lo hace legal (interface es la capa más alta); no se necesita allow extra.
- **Topología PLANO (D-N):** no hay contratos inter-módulo (no hay módulos). Un único conjunto de 4 capas.

Corrida limpia en scaffold vacío (todos los contratos KEPT, exit 0):
```
$ cd backend && uv run lint-imports

=============
Import Linter
=============

Analyzed 5 files, 0 dependencies.
---------------------------------

Clean/Hexagonal layers (dependencia hacia adentro) KEPT
domain puro (sin frameworks ni capas externas) KEPT
application sin infraestructura/interface ni frameworks KEPT
infrastructure no depende de interface KEPT

Contracts: 4 kept, 0 broken.
EXIT: 0
```

### Frontend — dependency-cruiser (`frontend/.dependency-cruiser.cjs`)

Cinco reglas traducen `architecture_style.md §3`:

| Nombre | Severidad | Regla |
|--------|-----------|-------|
| `no-cross-feature` | error | una feature no importa de otra feature |
| `ui-no-features` | error | `src/components/ui/` no importa `src/features/` |
| `lib-no-features` | error | `src/lib/` no importa `src/features/` |
| `no-circular` | error | sin dependencias circulares |
| `no-orphans` | warn | sin módulos huérfanos (no rompe el build) |

Corrida limpia en scaffold (0 errores, 1 warn esperado en `app/page.tsx` como orphan de App Router, exit 0):
```
$ cd frontend && npx depcruise src app --config .dependency-cruiser.cjs --output-type err

  warn no-orphans: app/page.tsx

x 1 dependency violations (0 errors, 1 warnings). 3 modules, 1 dependencies cruised.
EXIT: 0
```

### deptry — higiene de dependencias (`backend/pyproject.toml [tool.deptry]`)

`deptry` comprueba deps declaradas vs usadas (DEP001/003/004). DEP002 suprimido en scaffold vacío
(todos los `__init__.py` están vacíos — activar en Arnés 050 eliminando `ignore = ["DEP002"]`).

```
$ cd backend && uv run deptry src
Scanning 5 files...
Success! No dependency issues found.
EXIT: 0
```

---

## 2. ANCLA D2 — Violación de capa BLOQUEADA (demostración obligatoria)

### Paso 1 — Inyección (domain → infrastructure)

Archivo tocado: `backend/src/domain/__init__.py`

```python
# VIOLATION INJECTED — governance-weaver D2 anchor test (MUST BE REVERTED)
from src.infrastructure import something  # noqa: F401  # violates §2.2
```

### Paso 2 — Corrida: `lint-imports` **FALLA** (exit 1)

```
$ cd backend && uv run lint-imports

=============
Import Linter
=============

Analyzed 5 files, 1 dependencies.
---------------------------------

Clean/Hexagonal layers (dependencia hacia adentro) BROKEN
domain puro (sin frameworks ni capas externas) BROKEN
application sin infraestructura/interface ni frameworks KEPT
infrastructure no depende de interface KEPT

Contracts: 2 kept, 2 broken.


----------------
Broken contracts
----------------

Clean/Hexagonal layers (dependencia hacia adentro)
--------------------------------------------------

src.domain is not allowed to import src.infrastructure:

- src.domain -> src.infrastructure (l.2)


domain puro (sin frameworks ni capas externas)
----------------------------------------------

src.domain is not allowed to import src.infrastructure:

-   src.domain -> src.infrastructure (l.2)

EXIT: 1
```

### Paso 3 — Reversión y confirmación limpia

`backend/src/domain/__init__.py` restaurado a archivo vacío (0 bytes).

```
$ cd backend && uv run lint-imports

Analyzed 5 files, 0 dependencies.

Clean/Hexagonal layers (dependencia hacia adentro) KEPT
domain puro (sin frameworks ni capas externas) KEPT
application sin infraestructura/interface ni frameworks KEPT
infrastructure no depende de interface KEPT

Contracts: 4 kept, 0 broken.
EXIT: 0
```

**Inyección revertida: confirmado** — `backend/src/domain/__init__.py` = 0 bytes.

- **`verification.policy_blocks`:** `true`

---

## 3. ANCLA D4 — Anti-SQLi BLOQUEADO (demostración obligatoria)

### Configuración S608

En `backend/pyproject.toml [tool.ruff.lint]`:
- `S608` incluido vía `select = ["S", ...]` (Bandit flake8-bandit, regla `hardcoded-sql-expression`)
- `per-file-ignores`: S608 IGNORADO únicamente en el **adaptador firmado** `src/infrastructure/persistence/raw_sql.py`
- Cualquier otro módulo que construya queries por f-string/concatenación → bloqueado por S608

Adaptador firmado (convención documentada — se crea en Arnés 050):
`backend/src/infrastructure/persistence/raw_sql.py`

Verificación de la exención: se creó temporalmente ese archivo con una f-string SQL → `ruff check` exit 0 (S608 ignorado); se eliminó el archivo temporal tras la verificación.

### Paso 1 — Inyección (SQL crudo fuera del adaptador)

Archivo tocado: `backend/src/application/__init__.py`

```python
# VIOLATION INJECTED — governance-weaver D4 anchor test (MUST BE REVERTED)
def get_user(user_id: str) -> str:
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return query
```

### Paso 2 — Corrida: `ruff check` **FALLA** (exit 1)

```
$ cd backend && uv run ruff check src/application/__init__.py

S608 Possible SQL injection vector through string-based query construction
 --> src\application\__init__.py:6:13
  |
5 | def get_user(user_id: str) -> str:
6 |     query = f"SELECT * FROM users WHERE id = {user_id}"
  |             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
7 |     return query
  |

Found 1 error.
EXIT: 1
```

### Paso 3 — Reversión y confirmación limpia

`backend/src/application/__init__.py` restaurado a archivo vacío (0 bytes).

```
$ cd backend && uv run ruff check src/

All checks passed!
EXIT: 0
```

**Inyección revertida: confirmado** — `backend/src/application/__init__.py` = 0 bytes.

- **`verification.sqli_blocked`:** `true`

---

## 4. Línea base de seguridad — 6 vectores (plan §8.2)

| # | Vector | Materialización | Verificación real | `verified` |
|---|--------|-----------------|-------------------|------------|
| 1 | SQL Injection | Ruff S608 + per-file-ignore al adaptador firmado `src/infrastructure/persistence/raw_sql.py` | §3 (ancla D4): inyección fallada exit 1, revert exit 0 | `true` |
| 2 | Validación de entrada | Pydantic 2.13.4 en `pyproject.toml`; Zod 4.4.3 en `package.json`; `.clinerules §3 vector 2` mandata su uso en interface y features | Presencia en manifiestos verificada; no hay código corriendo aún (scaffold) | `false` |
| 3 | Gestión de secretos | `.env` en `.gitignore` (L6), pydantic-settings declarado, `.pre-commit-config.yaml` con gitleaks hook, job `security` en CI con `gitleaks-action@v2` | `git check-ignore -v .env` → confirmado ignorado; no hay secretos rastreados; `pre-commit` no disponible localmente → scan no ejecutado localmente | `false` |
| 4 | AuthN/Z | passlib/bcrypt declarados, `jwt_backend` firmado en CP-01g, `.clinerules §3 vector 4` mandata `Depends()` en `src/application/` | Estructura declarada y documentada; no hay código corriendo | `false` |
| 5 | XSS / headers / CORS | Regla ESLint `react/no-danger: error` en `frontend/eslint.config.mjs`; CORS restrictivo mandatado en `.clinerules §3 vector 5` | **lint dangerouslySetInnerHTML: verificado** — inyección en `app/page.tsx` → ESLint exit 1 (`react/no-danger`), revert exit 0; headers/CORS: configurable en scaffold vacío, no corrido | `false` (lint verificado, headers/CORS no) |
| 6 | Higiene de dependencias | `pip-audit>=2.10.1` en dev deps; lockfiles `uv.lock` + `package-lock.json` commiteados; job CI `security` ejecuta pip-audit + npm audit + deptry | `pip-audit` exit 0 ("No known vulnerabilities found"); `npm audit --audit-level=high` exit 0 ("found 0 vulnerabilities"); `deptry src` exit 0 ("No dependency issues found") | `true` |

### Notas por vector

**Vector 2 (Validación):** La arquitectura mandata Pydantic en `src/interface/` y Zod en `src/features/<feat>/schemas.ts`. El scaffold no tiene código aún; se verificará en Arnés 030 (Contract & Mold).

**Vector 3 (Secretos):** La protección estructural (gitignore) está verificada. El hook pre-commit `gitleaks` y el job CI `security` (gitleaks-action) están configurados; `gitleaks` no está instalado localmente — la corrida se verifica en CI al hacer push a GitHub.

**Vector 4 (AuthN/Z):** El puerto de identidad vivirá en `src/application/auth_service.py` (convención .clinerules). La autorización vía `Depends()` se implementa en Arnés 050. No hay código que auditar en el scaffold.

**Vector 5 (XSS):** La regla ESLint está activa y **demostrada** (inject-test-revert: captura real en §anterior). La configuración de security headers y CORS del backend FastAPI se verifica en Arnés 050 cuando exista el app factory en `src/interface/`.

**Vector 6 (Deps):** pip-audit y npm audit corrieron limpios. El lockfile `uv.lock` fue actualizado al añadir `pip-audit>=2.10.1` a dev deps. deptry corre sin DEP002 (scaffold vacío); activar DEP002 en Arnés 050.

---

## 5. `.clinerules` (manual de agente, D5)

- **Presente:** sí — `C:\Users\USUARIO\Documents\TripleS\Test_Caden\Test_Bank_018\.clinerules`
- **Coherente con el policía y el estilo:** sí
- **Directrices accionables para los arneses 3–6:**
  - §1 — Disciplina de capas: la regla de dependencia hacia adentro, tabla de qué puede importar cada capa, composition root como única excepción.
  - §2 — Estilo de modelado (D-G = ESTRICTO): 3 representaciones separadas (schema ≠ entidad ≠ ORM), dataclasses puras en dominio, repositorios confinados a infrastructure, Unit of Work.
  - §3 — Los 6 vectores de seguridad como reglas que los arneses 3–6 no pueden violar.
  - §4 — Reglas del frontend: no-cross-feature, ui-no-features, lib-no-features, Server vs Client Components.
  - §5 — Tabla de comandos locales y jobs CI que rompen el build.
  - §6 — Convenciones de nombres y ubicación por artefacto.
  - §7 — Decisiones firmadas relevantes (D-G, D-A, D-N, D-H, D-I, ESC-1).

---

## 6. Jobs de CI (plan §8.3 — rompen el build, no advierten)

**Path del workflow:** `.github/workflows/ci.yml`

| Job | Herramientas | Rompe el build | Estado |
|-----|--------------|----------------|--------|
| `lint` | Ruff (incl. `S` = Bandit S608) + ESLint (`react/no-danger`) | sí | configurado |
| `type-check` | mypy (strict) + tsc --noEmit | sí | configurado |
| `policy` | import-linter (`lint-imports`) + dependency-cruiser (`depcruise`) | **sí** (sin `continue-on-error`) | configurado |
| `security` | pip-audit + deptry + npm audit + gitleaks-action | **sí** (sin `continue-on-error`) | configurado |
| `test` | pytest (E2E Playwright → Arnés 060) + servicio Postgres | sí | configurado |

- Los jobs `policy` y `security` van **sin** `continue-on-error` → cualquier violación de capa, CVE conocida o secreto detectado rompe el build.
- Los comandos de los jobs `policy` y `security` fueron verificados localmente (Tareas 1–6): `lint-imports`, `ruff check`, `depcruise`, `pip-audit`, `npm audit`, `deptry` — todos pasan exit 0 en el scaffold limpio.
- `gitleaks-action@v2` solo corre en GitHub Actions (requiere `GITHUB_TOKEN`); no ejecutable localmente sin gh.

---

## 7. Re-verificación independiente de C (D-032)

C re-corre ambas anclas con cerebro fresco. Los comandos para reproducirlas:

**Ancla D2 (violación de capa):**
```bash
# 1. Inyectar
echo "from src.infrastructure import something" >> backend/src/domain/__init__.py
# 2. Verificar que falla (exit 1)
cd backend && uv run lint-imports
# 3. Revertir
> backend/src/domain/__init__.py
# 4. Verificar que pasa (exit 0)
uv run lint-imports
```

**Ancla D4 (anti-SQLi):**
```bash
# 1. Inyectar
python -c "
content = '''def get_user(user_id: str) -> str:
    query = f\"SELECT * FROM users WHERE id = {user_id}\"
    return query
'''
open('backend/src/application/__init__.py', 'w').write(content)
"
# 2. Verificar que falla (exit 1, S608)
cd backend && uv run ruff check src/application/__init__.py
# 3. Revertir
> backend/src/application/__init__.py
# 4. Verificar que pasa (exit 0)
uv run ruff check src/
```

- **C reprodujo el veto de capa (D2):** pendiente (C lo verifica)
- **C reprodujo el bloqueo anti-SQLi (D4):** pendiente (C lo verifica)

---

## Resumen ejecutivo

| Ancla | Resultado | Detalle |
|-------|-----------|---------|
| D2 — policy_blocks | **true** | lint-imports exit 1 con violación domain→infrastructure; exit 0 tras revert |
| D4 — sqli_blocked | **true** | ruff check exit 1 (S608) con f-string SQL en application; exit 0 tras revert |

| Archivo | Path |
|---------|------|
| Contratos backend | `backend/pyproject.toml` `[tool.importlinter]` |
| Contratos frontend | `frontend/.dependency-cruiser.cjs` |
| Anti-XSS | `frontend/eslint.config.mjs` |
| Pre-commit secretos | `.pre-commit-config.yaml` |
| CI workflow | `.github/workflows/ci.yml` |
| Manual de agentes | `.clinerules` |
| Este reporte | `020_architecture/deliverables/policy_verification.md` |
