---
description: >-
  Comando global del motor CADEN (plano de operación). "Sí, pero con este ajuste": aprobación
  condicionada a correcciones puntuales sobre el draft del gate. A registra el ajuste (CP-03r),
  re-invoca a los workers mínimos necesarios, re-presenta el draft ajustado y reabre el gate
  para que el humano cierre con /caden-approve. NO firma. Lo ejecuta la Instancia A. Transversal
  a los 6 arneses; cada arnés lo interpreta en su propio gate (hoy: 010 Discovery y 020 Architecture).
argument-hint: "\"<ajustes puntuales a aplicar>\""
allowed-tools: Read, Write, Edit, Agent, PowerShell
model: opus
---

# /caden-review — Sí con ajuste puntual (comando global del motor)

El humano aprueba el draft **con correcciones puntuales**: `/caden-review "<ajustes>"`. Tu trabajo
(Instancia A — Governor) es **aplicar esos ajustes con el mínimo re-trabajo**, **re-presentar** el
draft ajustado y **reabrir el gate**. Este comando **no firma**: cerrar el gate sigue siendo trabajo de
`/caden-approve`.

> **Plano de operación (L-001).** Corre sobre la carpeta del cliente. Escribe solo en el runtime del
> cliente. **Nunca** en `720_build/` ni en `800_persistence/`.

> **Definición canónica** del "sí con ajuste" (C-12, T-011), transversal a los 6 arneses. El playbook de
> la fase lo consume; no duplica esta lógica.

## 0. Fase activa (multi-fase: 010, 020, …)
Lee `harness-state.json → current_phase` (`010_discovery` | `020_architecture` | …); deriva el estado
táctico de `phases[current_phase].execution_state_path` y la carpeta de la fase. "El draft" = el
**artefacto central de la fase**, cuyo path da `execution-state.json → checkpoints["CP-03"].manifest_path`:
- **010 →** `010_discovery/deliverables/roadmap-manifest.json` + sus `slices/<id>.md`.
- **020 →** `020_architecture/deliverables/architecture-manifest.json` (laboratorio gobernado).

## 1. Precondiciones
- El gate debe estar **abierto**: `execution-state → CP-03.reached == true` y
  `harness-state → phases[current_phase].status == "EXECUTION_COMPLETE"`. Si no, **detente** y explica
  (no hay draft que ajustar, o la fase ya fue firmada/auditada).
- **`$ARGUMENTS` no puede ir vacío.** Si el humano no especificó los ajustes, **pídeselos** antes de
  continuar — no adivines qué corregir.
- **Juicio de alcance:** `/caden-review` es para **ajustes puntuales y con traza** (renombrar una slice,
  afinar un Gherkin, mover una dependencia, corregir un no-funcional). Si lo pedido es una **reescritura
  amplia** o un **cambio de comportamiento mayor**, dilo y sugiere la vía adecuada: conversación en
  lenguaje natural para re-descubrir, o `/caden-change "<feature>"` si es una feature nueva sobre algo ya
  firmado (Modo Ajuste). No fuerces un cambio grande por esta vía.

## 2. Registra el ajuste — CP-03r
En `execution-state.json → checkpoints["CP-03r"]`:
- `reached: true`
- añade a `requested_adjustments[]` el texto de `$ARGUMENTS` (con timestamp real, ver `/caden-approve`
  paso 2 para la orden de reloj permitida).

## 3. Aplica el mínimo re-trabajo
Re-invoca **solo** los workers necesarios para reflejar el ajuste — **no** rehagas la cadena completa.
Los workers dependen de la **fase activa**:

- **010 (Discovery):**
  - ajustes de slicing/BDD/no-funcionales/dependencias → **`bdd-synthesizer`** sobre el draft vigente,
    indicándole exactamente qué cambiar (no que reescriba desde cero).
  - solo si el ajuste cambia el **comportamiento de base** capturado → `behavior-questioner` acotado y
    luego `bdd-synthesizer`.
- **020 (Architecture):**
  - ajustes de stack/estilo/decisiones efectivas → **`architecture-adapter`**.
  - ajustes del scaffold/manifiestos/tokens → **`scaffold-builder`**.
  - ajustes del policía/seguridad/CI/`.clinerules` → **`governance-weaver`**.

Tras un worker del 020 que toque el laboratorio, **A re-consolida** el `architecture-manifest.json`
(paso 5 del playbook) antes de re-presentar. Registra en `CP-03r.reworked_workers[]` los que invocaste.
**No incrementes `version`** ni marques nada `approved` (eso es exclusivo de `/caden-approve`).

## 4. Actualiza el draft y la bitácora
- Sobrescribe el manifest y los `slices/<id>.md` afectados (el draft sigue `approved: false`,
  `status: "draft"`).
- Actualiza `CP-03` (`manifest_path`, `slice_md_paths[]`) si cambiaron rutas, y **refresca
  `CP-03.manifest_sha256`** con la huella del draft ajustado (es un cambio legítimo del entregable, así la
  procedencia que verifica `/caden-approve` apunta al draft que vas a re-presentar; D-024/R2).
- Añade una línea en `<fase>/project-progress.txt` (CP-03r: ajuste pedido, workers re-invocados).
- `updated_at` real en `execution-state.json`.

## 5. Re-presenta y reabre el gate
- Muestra al humano el **draft ajustado** y, idealmente, un **diff legible** de qué cambió respecto al
  anterior.
- La fase **permanece `EXECUTION_COMPLETE`** (gate abierto): no avanza el estado.
- Indícale que cierre con **`/caden-approve`** (firma plena) o pida otro **`/caden-review "<ajustes>"`**
  si aún falta algo.

## Reglas inviolables
- **`/caden-review` nunca firma:** no toca `approvals[]`, no marca `approved`, no incrementa `version`,
  no pasa la fase a `IN_AUDIT`.
- **Re-trabajo mínimo:** invoca solo los workers imprescindibles; preserva lo no afectado.
- **Timestamps reales**, nunca fabricados.
- **Respeta los planos:** escribe solo en el runtime del cliente.
