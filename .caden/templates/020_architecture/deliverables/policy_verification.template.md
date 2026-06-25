# Verificación del Policía y Seguridad — 020 Architecture (PLANTILLA)

> **C-7 del arnés 020 — el corazón del arnés.** Molde (plano de construcción, L-001). Lo produce el worker
> **`governance-weaver`** en runtime (`020_architecture/deliverables/policy_verification.md`, CP-03) y la
> **Instancia C lo RE-VERIFICA** con cerebro fresco (D-032). Demuestra que el policía **bloquea de verdad**
> (no es declarativo-pero-inerte, brief §7) con **capturas reales** de las corridas (L-009: nunca declarar
> "verificado" sin la corrida). Anclas **obligatorias**: la **violación de capa** (D2) y el **anti-SQLi**
> (D4) se demuestran **siempre**. Los `<...>` son marcadores.

## 1. Contratos de capas configurados (plan §8.1)

- **import-linter** (`pyproject.toml [importlinter]`): `<contratos: layers interface>infrastructure>application>domain + forbidden ...>`
- **dependency-cruiser** (`.dependency-cruiser.js`): `<no-cross-feature, ui-no-features, no-orphans, no-circular>`
- **deptry:** `<higiene de deps declaradas/usadas (vector 6)>`

## 2. ANCLA D2 — Violación de capa BLOQUEADA (demostración obligatoria)

| Paso | Acción | Evidencia (captura real) | Resultado |
|------|--------|--------------------------|-----------|
| 1 | Inyectar `domain → infrastructure` | `<diff / archivo tocado>` | inyectada |
| 2 | Correr el análisis estático | `<comando: lint-imports / import-linter>` | **FALLA** ✅ |
| 3 | Revertir la inyección | `<revert>` | limpio |

- **`verification.policy_blocks`:** `<true | false>` → si `false` o no demostrado: **veto D2** (policía inerte).

## 3. ANCLA D4 — Anti-SQLi BLOQUEADO (demostración obligatoria)

| Paso | Acción | Evidencia (captura real) | Resultado |
|------|--------|--------------------------|-----------|
| 1 | Inyectar SQL crudo fuera del adaptador firmado | `<f-string SELECT en application/interface>` | inyectada |
| 2 | Correr el lint anti-SQLi | `<ruff check ... (regla Bandit S608, confinada al adaptador vía per-file-ignores)>` | **FALLA/BLOQUEA** ✅ |
| 3 | Revertir | `<revert; ruff check limpio (exit 0)>` | limpio |

- **`verification.sqli_blocked`:** `<true | false>` → si no demostrado: **veto D4** (vector ancla, brief criterio 8).

## 4. Línea base de seguridad — 6 vectores (plan §8.2)

| # | Vector | Materialización | Verificación (cómo se demostró) | `verified` |
|---|--------|-----------------|----------------------------------|------------|
| 1 | SQL Injection | adaptador firmado + regla forbidden | §3 (ancla) | `<t/f>` |
| 2 | Validación de entrada | Pydantic (backend) + Zod (frontend) en frontera | `<routers tipados; presencia de Zod>` | `<t/f>` |
| 3 | Gestión de secretos | pydantic-settings + secret-scan (CI/pre-commit) + `.env` en gitignore | `<job CI presente; scan limpio>` | `<t/f>` |
| 4 | AuthN/Z | JWT backend + rol/scope vía `Depends()` en capa de aplicación (D-A) | `<puerto de identidad ubicado; authz no solo en frontend>` | `<t/f>` |
| 5 | XSS / headers / CORS | lint anti-`dangerouslySetInnerHTML` + security headers + CORS restrictivo | `<backend arranca; headers/CORS comprobados; lint caza el uso>` | `<t/f>` |
| 6 | Higiene de dependencias | pip-audit / npm-audit (+ deptry) en CI + lockfiles | `<job CI presente y corre; sin CVE conocidas>` | `<t/f>` |

> Vectores 2–6: **configurado-y-verificado** o, si solo configurado sin captura, **topan D2/D4 ≤ 0.8**
> (tope por verificación pendiente, paralelo a T-016). Nunca declarar `verified:true` sin la corrida real.

## 5. `.clinerules` (manual de agente, D5)

- **Presente:** `<sí|no>` · **Coherente con el policía y el estilo:** `<sí|desviaciones>`
- **Directrices accionables para los arneses 3–6:** `<resumen>`

## 6. Jobs de CI (plan §8.3 — rompen el build, no advierten)

> **Dueño del workflow: `governance-weaver` (D-040 / T-049).** Crea `.github/workflows/ci.yml`; `policy` y
> `security` van **sin** `continue-on-error`. Path del workflow: `<.github/workflows/ci.yml>`.

| Job | Herramientas | Estado | Rompe el build |
|-----|--------------|--------|----------------|
| `lint` | Ruff (incl. `S`) + ESLint | `<configurado|n/a>` | sí |
| `type-check` | mypy/pyright + tsc | `<configurado|n/a>` | sí |
| `policy` | import-linter + dependency-cruiser | `<configurado|n/a>` | **sí** |
| `security` | pip-audit/npm-audit + secret-scan | `<configurado|n/a>` | **sí** |
| `test` | pytest (E2E Playwright → 060) | `<configurado|n/a>` | sí |

## 7. Re-verificación independiente de C (D-032)

> C re-corre las anclas (§2 y §3) con cerebro fresco. Si la corrida de C no reproduce el bloqueo, el
> policía es inerte → veto, aunque el worker lo haya reportado OK.

- **C reprodujo el veto de capa (D2):** `<sí|no>`
- **C reprodujo el bloqueo anti-SQLi (D4):** `<sí|no>`
