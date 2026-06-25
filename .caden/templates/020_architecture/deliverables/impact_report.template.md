# Reporte de Impacto — 020 Architecture / Modo Ajuste (PLANTILLA)

> **C-7 del arnés 020 — solo Modo Ajuste (DA-6, D-035, diseño §11).** Molde (plano de construcción, L-001).
> Lo produce el worker **`architecture-adapter` en modo impacto** en runtime
> (`020_architecture/deliverables/impact_report.md`). Se genera cuando A detecta
> `roadmap.version > architecture-manifest.based_on_roadmap.version` (el 010 mutó y re-firmó su roadmap) y
> reabre el 020 vía `/caden-architect`. **Valida la feature inyectada contra la gobernanza global** y emite
> el dictamen. Dos salidas: **luz verde sin re-andamiar** o **molde base nuevo provisionado sin reconstruir**
> lo existente. Los `<...>` son marcadores.

## 1. Disparador

- **roadmap.version nuevo:** `<N>` · **based_on_roadmap.version previo:** `<N-1>`
- **Cambio en el roadmap (010):** `<resumen de la feature/slice inyectada por /caden-change>`
- **Slices nuevas/mutadas:** `<ids>`

## 2. Análisis de impacto sobre la gobernanza global

| Eje del laboratorio | ¿Lo afecta la feature? | Detalle |
|---------------------|------------------------|---------|
| Stack efectivo (deps) | `<sí|no>` | `<requiere alguna adición? p. ej. pasarela de pagos>` |
| Estilo / capas | `<sí|no>` | `<nuevo puerto/adaptador? composition root?>` |
| Policía (contratos) | `<sí|no>` | `<nueva regla de capa / feature?>` |
| Seguridad (6 vectores) | `<sí|no>` | `<nuevo vector? p. ej. PCI si hay pagos>` |
| Design system / tokens | `<sí|no>` | `<…>` |
| Migraciones (Alembic) | `<sí|no>` | `<nueva revisión?>` |

## 3. Dictamen

- **Estrategia:** `<green_light | new_mold>`
  - **`green_light`** — la gobernanza existente **ya cubre** la feature: no se re-andamia; el manifest se
    re-firma `vN+1` solo para atarse al nuevo `roadmap.version`.
  - **`new_mold`** — la feature exige un **molde base nuevo** (p. ej. un puerto de pagos + su regla de
    policía): se **provisiona sin reconstruir** lo existente; el resto del laboratorio queda intacto.

- **`added[]` (solo si new_mold):** `<lista de piezas nuevas provisionadas — p. ej. infrastructure/payments_gateway, alembic/<rev>>`
- **`unchanged[]`:** `<lo que NO se tocó — invariante de integridad D8>`

## 4. Verificación de integridad (D8)

> D8 evalúa que la feature se validó contra la gobernanza **sin romper nada de lo existente**.

- **Nada existente se rompió:** `<confirmado | desviaciones>`
- **Si `new_mold`: el molde nuevo está verificado** (policía/seguridad si aplica): `<sí|n/a>`
- **Re-firma:** `<vN+1>` con snapshot `sha256` (D-024/R2) · **`change_log[]`** actualizado en el manifest.

## 5. Notas para el humano

`<qué cambia, qué NO, y por qué la estrategia elegida es la mínima suficiente>`
