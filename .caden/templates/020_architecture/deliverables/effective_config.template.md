# Configuración Efectiva — 020 Architecture (PLANTILLA)

> **C-7 del arnés 020.** Molde (plano de construcción, L-001). Lo produce el worker **`architecture-adapter`**
> en runtime (`020_architecture/deliverables/effective_config.md`, CP-01). Es la propuesta de **stack/estilo
> efectivo** (base adaptable D-027) + la **lista de decisiones abiertas** que el humano debe cerrar en el
> **gate de decisión (CP-01g)** antes de andamiar. El adapter **verifica aplicabilidad** y **justifica**
> adiciones/relajaciones; **verifica versiones contra documentación vigente** (no las fija a ciegas, brief §7).
> Los `<...>` son marcadores.

## 1. Stack efectivo propuesto (base aplicable + adiciones − no aplicables)

| Pieza | Base (referencia) | Propuesta efectiva | Veredicto | Justificación |
|-------|-------------------|--------------------|-----------|---------------|
| Backend lenguaje/framework | python / fastapi | `<x.y>` / fastapi | aplica | <por qué> |
| Frontend | next / typescript | `<x.y.z>` / typescript | aplica | <por qué> |
| DB | postgres `<x.y>` | postgres + `<extensiones>` | aplica | <por qué> |
| `<adición>` | — | `<pieza@versión>` | **adición** | <necesidad detectada en el roadmap> |
| `<no aplicable>` | `<pieza>` | — | **descartada (E4)** | <por qué este proyecto no la necesita> |

- **`added[]`:** `<lista de adiciones a aprobar>`
- **`dropped[]`:** `<lista de piezas de la base que no aplican>`
- **Versiones verificadas contra:** `<PyPI/npm/docs, fecha>` (E8; nunca a ciegas, brief §7).

## 2. Estilo efectivo propuesto

| Eje | Valor propuesto | Escape (si aplica) |
|-----|-----------------|--------------------|
| Capas | clean_hexagonal_4 | — |
| Mapeo ORM (D-G) | `<strict | relaxed>` | relaxed = **escape firmado** → §3 |
| Representación de dominio (D-F) | dataclasses | — |
| Clave primaria (D-H) | `<uuidv7 | bigint_identity>` | — |
| Alcance de fila (D-I) | `<repository | rls>` | rls = **escape firmado** → §3 |

### Disposición front/back (T-045d)

> `architecture_style.md` ubica el backend en `src/` (§2.1) y el frontend en `app/`+`src/features` (§3);
> en una sola raíz colisionan. **Declara la convención** que el `scaffold-builder` seguirá.

- **Layout:** `<subraíces backend/ + frontend/ | src/ (Python) + app/+web/ (front) | otra>` — `<por qué>`

## 3. Design system efectivo

| Campo | Valor | Nota |
|-------|-------|------|
| `source` | `<brand | default>` | `brand` si `900_documents/brand.md` está lleno; `default` si no/esqueleto |
| `level` | `<L0 | L1 | L2 | L3 | L4>` | design_system §6.2 (L0 default · L1 color/​logo semilla · L2 paleta+tipo · L3 guía completa · L4 DS propio) |
| Modos | claro + oscuro | siempre ambos (D-M) |
| Piso a11y | WCAG AA | invariante; la marca no lo cruza a la baja (design_system §4) |

## 4. Decisiones abiertas a cerrar en el gate de decisión (CP-01g)

> Sin cerrar estas decisiones **no se andamia** (P5). El humano las resuelve en **lenguaje natural**.
>
> **IDs (T-045a):** los `D-<letra>` están **reservados** a las decisiones canónicas de los bloques de
> referencia (auth `D-A`, ORM `D-G`, topología `D-N`, versión `D-C`; el design system usa `D-J`…`D-M`).
> Reutiliza el ID canónico cuando aplique; usa `ESC-n` para escapes; y para **decisiones nuevas propias
> del proyecto** acúñalas como **`DEC-01`, `DEC-02`…** — nunca continúes la secuencia `D-J`/`D-K`/… (choca
> con los bloques).

| # | Decisión | Opciones | Default adaptable | Recomendación del adapter |
|---|----------|----------|-------------------|---------------------------|
| D-A | **AuthN/Z** | jwt_backend · authjs · managed:`<provider>` | jwt_backend (brief §2) | `<recomendación + por qué>` |
| ESC-1 | **Escape de estilo** (orm_relaxed / rls / …) | aprobar / rechazar | rechazar (estilo estricto) | `<solo si el roadmap lo justifica>` |
| DEC-01 | `<decisión nueva propia del proyecto>` | `<…>` | `<…>` | `<…>` |

## 5. Aplicabilidad por el roadmap (E4 — andamiar solo lo necesario)

> Qué piezas del scaffold/policía activa este roadmap concreto y cuáles **no** (para no andamiar de más).

- **Activa:** `<features/puertos que el roadmap exige — p. ej. puerto de pagos solo si hay slice de pago>`
- **No activa (no andamiar):** `<piezas de la base que este proyecto no usa>`

## 6. Notas para el humano

`<resumen de 1–3 líneas: qué se propone, qué decisiones quedan abiertas, qué riesgos vigilar>`
