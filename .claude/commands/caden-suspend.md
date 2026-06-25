---
description: >-
  Comando global del motor CADEN (plano de operación). Pausa DELIBERADAMENTE la fase activa
  dejándola en un punto seguro y totalmente reanudable. Es la contraparte intencional de la
  interrupción que /caden-continue retoma: persiste el estado, registra la suspensión y reporta
  cómo reanudar. NO descarta, no reescribe entregables y no firma. Lo ejecuta la Instancia A.
  Transversal a los 6 arneses. Ciclo de vida (T-011).
argument-hint: "[\"<motivo opcional de la pausa>\"]"
allowed-tools: Read, Write, Edit, PowerShell
model: opus
---

# /caden-suspend — Pausa limpia de la fase activa (comando global del motor)

El humano quiere **detener la corrida ahora** y retomarla más tarde. Tu trabajo (Instancia A —
Governor) es **dejar la fase activa en un punto seguro y reanudable** y registrar la pausa, **sin
deshacer ni rehacer nada**. Suspender ≠ reiniciar: no se pierde progreso. La reanudación posterior la
hace **`/caden-continue`** (ritual E10-B).

> **Plano de operación (L-001).** Corre sobre la **carpeta del cliente**. Escribe solo en el runtime
> del cliente (`harness-state.json`, `<fase>/execution-state.json`, `<fase>/project-progress.txt`).
> **Nunca** en `720_build/` ni en `800_persistence/`.

> **Definición canónica** de la pausa deliberada (C-12, T-011), transversal a los 6 arneses.

## Timestamp real (no lo inventes)
Marca real en UTC con `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (herramienta
`PowerShell`). Si no puedes, pide la hora al humano; **no fabriques timestamps**.

## 0. Fase activa
Lee `harness-state.json → current_phase` (hoy `010_discovery`) y `phases[current_phase].status`;
deriva el estado táctico de `phases[current_phase].execution_state_path`.

## 1. Precondiciones — ¿hay algo que suspender?
- Si `harness-state.json` no existe o la fase está en **`NOT_STARTED`** → no hay corrida activa.
  Informa y **detente** (no hay nada que pausar).
- Si la fase está en **`PHASE_COMPLETE`** → la fase ya cerró; no se suspende algo terminado. Informa y
  **detente**.
- Si la fase está en **`HOLD`** → ya está detenida y escalada al humano; suspender no aporta. Informa el
  bloqueo (de `escalations[]`) y **detente**.
- En cualquier otro estado intermedio (`INIT`, `CONTRACT_APPROVED`, `IN_EXECUTION`,
  `EXECUTION_COMPLETE`, `IN_AUDIT`, `IN_REWORK`) → es **suspendible**. Continúa.

## 2. Asegura el punto seguro
La regla de durabilidad de `/caden-discovery` ya persiste cada checkpoint, pero **verifica** que el
estado refleja lo último hecho antes de pausar:
- `execution-state.json → last_checkpoint` apunta al último CP alcanzado y sus campos están escritos.
- Si quedaba algo a medio persistir del último paso, **persístelo ahora** (sin avanzar a un paso nuevo).
  No inicies trabajo nuevo: suspender es congelar, no progresar.

## 3. Registra la suspensión
En `execution-state.json → durability.suspensions[]` añade (toma marca real):
```json
{
  "suspended_at": "<iso8601 real>",
  "at_checkpoint": "<last_checkpoint, p.ej. CP-02>",
  "reason": "<$ARGUMENTS si vino; si no, 'suspensión manual'>"
}
```
Actualiza `execution-state.json → updated_at` (real). **No** cambies el `status` de la fase en
`harness-state.json`: la fase conserva su estado intermedio para que `/caden-continue` retome el mismo
paso. (El estado intermedio + `last_checkpoint` ya bastan para reanudar; el marcador de suspensión es
trazabilidad, no una transición de la máquina de estados.)

## 4. Bitácora
Añade una línea a `<fase>/project-progress.txt` (marca real):
`[<iso8601>] [A] SUSPENSION (/caden-suspend): pausa en <last_checkpoint>. Motivo: <reason>. Reanudar con /caden-continue.`

## 5. Reporta al humano
Confirma en pocas líneas:
- **Suspendida** la fase `<current_phase>` en `<last_checkpoint>` (status intermedio conservado).
- Nada se perdió: los entregables ya producidos siguen intactos.
- **Para reanudar:** abrir Claude Code en esta carpeta y ejecutar **`/caden-continue`** (retoma el paso
  exacto sin reiniciar).

## Reglas inviolables
- **Suspender ≠ reiniciar:** no borres ni reescribas entregables, no rehagas pasos, no avances la máquina
  de estados.
- **Suspender nunca firma:** no toca `approvals[]`, `version`, ni pasa la fase a `IN_AUDIT`.
- **El estado manda:** deja todo reanudable por `/caden-continue` (estado táctico + maestro + bitácora).
- **Timestamps reales**, nunca fabricados.
- **Respeta los planos:** escribe solo en el runtime del cliente.
