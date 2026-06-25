---
description: >-
  Comando global del motor CADEN (plano de operación). Firma plena del humano en un gate:
  registra la aprobación en harness-state.json, consolida el artefacto firmado y cierra el
  gate de la fase activa, entregando el control a la auditoría (C). Lo ejecuta la Instancia A
  (sesión principal) cuando el humano lo invoca. Es transversal a los 6 arneses; cada arnés
  lo interpreta en su propio gate (hoy: 010 Discovery y 020 Architecture).
argument-hint: "(sin argumentos — firma plena del draft presentado)"
allowed-tools: Read, Write, Edit, Agent, PowerShell
model: opus
---

# /caden-approve — Firma plena del gate (comando global del motor)

El humano acaba de decir **"Sí, totalmente de acuerdo"** sobre el draft que tú (la **Instancia A —
Governor**) le presentaste en el gate. Tu trabajo aquí es **registrar su firma**, **consolidar el
artefacto** y **cerrar el gate** de la fase activa, entregando luego el control a la **auditoría (C)**.

> **Plano de operación (L-001).** Este comando corre sobre la **carpeta del cliente**. Escribe solo en
> el runtime del cliente (`harness-state.json`, `<fase>/execution-state.json`, los entregables de la
> fase, `<fase>/project-progress.txt`). **Nunca** en `720_build/` ni en `800_persistence/`.

> **Definición canónica.** Este archivo es la **definición canónica** de qué significa aprobar (C-12,
> T-011), transversal a los 6 arneses. El playbook de cada fase (`/caden-discovery`, …) lo **consume**;
> no duplica esta lógica.

## 0. Fase activa (multi-fase: 010, 020, …)
Este comando es **transversal**: deriva todo de `current_phase`, no asume una fase concreta.
1. Lee **`harness-state.json`** → `current_phase` (`010_discovery` | `020_architecture` | …).
2. Deriva la ruta del estado táctico desde `phases[current_phase].execution_state_path`
   (010 → `010_discovery/execution-state.json`; 020 → `020_architecture/execution-state.json`) y la
   carpeta de la fase.
3. En lo que sigue, "el manifest/draft" = el **artefacto central firmado de la fase**, cuyo path lo da
   `execution-state.json → checkpoints["CP-03"].manifest_path` (no lo hardcodees):
   - **010 →** `010_discovery/deliverables/roadmap-manifest.json` (Vertical Slices).
   - **020 →** `020_architecture/deliverables/architecture-manifest.json` (laboratorio gobernado).

## 1. Precondiciones — no firmes a ciegas
Antes de tocar nada, verifica que **el gate esté realmente abierto**:
- `execution-state.json → checkpoints["CP-03"].reached == true` (hay un draft presentado), y existe
  el `manifest_path`.
- `harness-state.json → phases[current_phase].status == "EXECUTION_COMPLETE"` (gate abierto, aún sin
  firmar/auditar).
- El manifest existe y es legible.

Si **alguna** falla (no hay draft, la fase ya está `IN_AUDIT`/`PHASE_COMPLETE`): **DETENTE**, no firmes,
y explica al humano por qué (p. ej. "aún no hay draft que firmar" o "esta versión ya está consolidada").

**Procedencia: firma solo el draft que se presentó (D-024/R2).** Antes de consolidar, calcula el
**SHA256 del manifest tal como está en disco ahora** (estado draft, **sin** consolidar todavía) y
compáralo con `execution-state.json → checkpoints["CP-03"].manifest_sha256` (la huella tomada al
presentar el draft):
- **Coinciden** → el manifest es el que el humano vio → continúa con la firma.
- **Difieren** (el draft fue alterado fuera de banda entre la presentación y la firma): **DETENTE, no
  firmes y no lo repares tú** (no eres worker; D-024/R1). Surfacea la divergencia al humano en términos
  neutros y **devuélvele el control al gate** (paso 5 del playbook) para que A **re-presente el estado
  actual del disco**, **refresque** `CP-03.manifest_sha256` y el humano confirme con un nuevo
  `/caden-approve` (o ajuste con `/caden-review`). **No decides tú cuál versión es "la correcta"**: la
  **validez** del draft la audita **C** tras la firma (D-024/R3), no este comando.

> Este chequeo es de **procedencia** (¿firmo lo que se presentó?), **no de validez** (¿está bien
> formado? — eso es D2 de C). Si el humano, ante la divergencia, **re-aprueba conscientemente** un draft
> defectuoso, se firma y **fluye a C**, que lo rechazará → protocolo de rechazo (rework/HOLD). Nunca
> "arregles" el manifest aquí para que pase.

**Idempotencia (refinada por el protocolo de rechazo, D-021):**
- **No firmes** si en `approvals[]` de esta fase existe una entrada con `audit_result == "PENDING"` (hay
  una firma esperando auditoría) o `"APPROVED"` (la versión vigente ya está consolidada). La firma es
  **un acto único por versión consolidada**.
- **Sí firmas** cuando vienes de un **rework**: la firma previa quedó `audit_result == "REJECTED"` (la
  anuló el paso 6 del playbook), la fase volvió a `EXECUTION_COMPLETE` con un draft corregido, y esta
  nueva firma reabre la auditoría sobre ese draft.

## 2. Timestamp real (no lo inventes)
Obtén la hora **real** en UTC con la **única** orden permitida en `settings.json`:
`(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")`. Úsala como `approved_at`/`signed_at`.
Si por alguna razón no puedes ejecutarla, **pide la hora al humano** — no fabriques timestamps.

## 2b. Identidad del firmante (fuente controlada — nunca tu contexto)
`approved_by` es **identidad/PII** que se escribe en un artefacto **durable y commiteado** (la firma del
gate). Como el timestamp, **se obtiene de una fuente controlada, no de lo que tú "sabes" del operador**:
1. Lee la identidad git del proyecto con PowerShell (las dos órdenes):
   `git config user.name` y `git config user.email`.
2. Construye `approved_by` **exactamente** con esos dos valores, en el formato
   `"<user.name> <<user.email>>"`
   (p. ej. `"Triple S <110043648+jdrodriguez1000@users.noreply.github.com>"`).
3. Si **falta** `user.name` o `user.email` (git sin configurar), usa el literal **`"humano"`** y **no**
   completes el hueco con ningún dato del operador.

> **Prohibido (L-027):** tomar el nombre o el correo del operador de tu **contexto de conversación o
> conocimiento del modelo**. Aunque "sepas" el correo real del humano, **no lo escribas**: el `git config`
> ya está saneado (S-055 lo fija al `noreply` de GitHub) y esa higiene se rompe si embebes el Gmail real en
> la firma. La identidad de la firma sale **solo** de `git config` — verificable, no de tu contexto
> ambiente. Paralelo al timestamp (paso 2) y al credential helper ambiental (D-025): los datos que van a un
> artefacto durable se **toman**, no se **fabrican**.

## 3. Consolida el artefacto firmado
En el manifest:
- `approved: true` y `signed_at: <timestamp real>`.
- cada slice → `status: "approved"`.
- **`version` = (nº de aprobaciones de esta fase en `approvals[]` con `audit_result == "APPROVED"`) + 1**
  (política T-018/D-020, refinada por D-021). **No incrementes a ciegas:** deriva el número del
  `approvals[]`, que es la fuente de verdad, y **cuenta solo las firmas ya consolidadas por auditoría**
  (`audit_result == "APPROVED"`); ignora las `PENDING` o `REJECTED`.
  > - **1ª firma** (0 firmas APPROVED previas) → **`version: 1`**: un roadmap aprobado por primera vez
  >   **es v1**, no v2.
  > - **Re-firma tras un rework** (la firma previa quedó `REJECTED`, 0 APPROVED) → **sigue `version: 1`**:
  >   el re-trabajo es parte de producir el primer roadmap válido, no una versión nueva (D-021).
  > - **Re-firma del Modo Ajuste** (N firmas APPROVED previas) → **`version: N+1`** (v2, v3, …).
  >
  > El `version: 1` que trae el draft del synthesizer es solo un marcador de "borrador"; aquí lo fijas
  > **autoritativamente** según el conteo de firmas consolidadas.

## 4. Registra la firma — `harness-state.json → approvals[]`
Añade un ítem (no borres los previos):
```json
{
  "phase": "<current_phase>",
  "command": "/caden-approve",
  "scope": "<artefacto firmado> v<version nuevo>",
  "manifest_version": <version nuevo>,
  "manifest_hash": "<sha256 del manifest ya consolidado>",
  "presented_sha256": "<el snapshot del draft que verificaste en el paso 1 = checkpoints['CP-03'].manifest_sha256>",
  "approved_by": "<identidad del paso 2b: 'user.name <user.email>' tomado de git config, o 'humano' si git no está configurado — NUNCA del contexto del modelo, L-027>",
  "approved_at": "<timestamp real>",
  "audit_result": "PENDING"
}
```
- **`manifest_hash` = HASH DE RÉCORD.** Calcúlalo sobre el contenido **ya consolidado** (paso 3). Es el
  hash que la auditoría (C) **re-verifica contra el manifest en disco** (D7, integridad del firmado): un
  solo hash consistente, como en el 010 (D-039). **No** registres aquí el snapshot del draft como hash
  de récord (el draft se mutó al consolidar; compararlo después siempre diverge → L-022).
- **`presented_sha256` = trazabilidad del delta.** Copia el snapshot del draft que comparaste en el
  paso 1 (`CP-03.manifest_sha256`). Documenta **qué se le presentó al humano**; el delta draft→firmado
  queda auditable sin que nadie tenga que re-hashear formas distintas.
- El `audit_result` nace en **`PENDING`**: lo resolverá el **paso 6 del playbook** tras la auditoría de
  C (`APPROVED` consolida la fase; `REJECTED` anula esta firma y abre el rework, D-021). No lo fijes tú
  aquí.

## 5. Cierra el gate (CP-04) y abre la auditoría
- `execution-state.json` → `checkpoints["CP-04"] = { "reached": true, "approved_at": "<real>" }`,
  `last_checkpoint: "CP-04"`, `updated_at` real.
- `harness-state.json` → `phases[current_phase].status: "IN_AUDIT"`, `updated_at` real.
- Añade una línea en `<fase>/project-progress.txt` (CP-04: firma registrada, versión, quién, cuándo).

## 6. Entrega a la auditoría (C)
Cierra **entregando el control al paso de auditoría del playbook de la fase activa**:
- **010 →** `/caden-discovery` paso 6, evaluador **`discovery-evaluator`**.
- **020 →** `/caden-architect` paso 6, evaluador **`architecture-evaluator`** (que además **re-verifica**
  las anclas D2/D4 con cerebro fresco, D-032).

Ese paso del playbook invoca al evaluador de la fase, lee el `verdict.json`, **fija el `audit_result` de
esta firma** (`APPROVED` → `PHASE_COMPLETE`; `REJECTED` → anula la firma y abre el **protocolo de
rechazo**: `IN_REWORK` re-invocando los `failed_workers[]`, o `HOLD` si es estratégico/se agotó el tope),
registra knowledge y reporta el handoff. **No** dupliques aquí esa lógica: el playbook es su única fuente.
Indícale al humano que la auditoría arranca a continuación.

## Reglas inviolables
- **No firmes por el humano:** este comando *es* su firma; si las precondiciones no se cumplen, no
  inventes una.
- **Procedencia, no reparación (D-024):** firma solo el draft que se presentó (snapshot
  `CP-03.manifest_sha256`). Ante divergencia: **detente y re-presenta**, nunca repares el manifest a mano
  (no eres worker, R1). La validez la audita C tras la firma (R3).
- **Idempotencia:** no se firma sobre una versión con auditoría `PENDING` o ya `APPROVED`; tras un
  rework (`REJECTED`) sí se vuelve a firmar la misma versión. `approvals[]` solo crece (no se borran
  firmas; se anulan marcándolas `REJECTED`, D-021).
- **Timestamps reales**, nunca fabricados (paso 2).
- **Identidad del firmante de fuente controlada (L-027):** `approved_by` se deriva de `git config`
  (`user.name`/`user.email`), nunca de tu contexto/conocimiento del operador; si git no está configurado,
  `"humano"`. No embebas el correo real del humano (paso 2b).
- **Respeta los planos:** escribe solo en el runtime del cliente.
