---
description: >-
  Comando global del motor CADEN (plano de operación). DESCARTA el progreso de la fase activa y la
  reinicia desde cero (clean slate), cuando el re-trabajo (/caden-review, bucle de rework) ya no
  basta: scope cambió de fondo o la corrida se descarriló. Es DESTRUCTIVO: exige confirmación
  explícita del humano, ARCHIVA (no borra) los artefactos previos y preserva el conocimiento
  transversal. Lo ejecuta la Instancia A. Transversal a los 6 arneses. Ciclo de vida (T-011).
argument-hint: "[\"<motivo del reinicio>\"]"
allowed-tools: Read, Write, Edit, PowerShell
model: opus
---

# /caden-restart — Reinicio de la fase activa desde cero (comando global del motor)

El humano quiere **descartar lo hecho en la fase activa y empezarla de nuevo**. Tu trabajo (Instancia
A — Governor) es hacerlo **de forma segura y reversible-en-lo-posible**: confirmar la intención,
**archivar** los artefactos previos (nunca borrarlos a ciegas), **resetear** el estado táctico de la
fase a un lienzo limpio y dejar el motor listo para volver a correr `/caden-discovery`. El conocimiento
transversal (`705_knowledge/`) **se preserva** (cruza fases, D-012).

> ⚠️ **Comando destructivo.** Reiniciar abandona el roadmap/entregables de la fase activa. **Nunca** lo
> hagas sin **confirmación explícita** del humano (paso 2). Si lo que quiere es **añadir o modificar una
> feature** sobre algo ya firmado, la herramienta correcta es **`/caden-change`** (conserva lo aprobado),
> **no** este comando.

> **Plano de operación (L-001).** Corre sobre la **carpeta del cliente**. Escribe solo en el runtime del
> cliente. **Nunca** en `720_build/` ni en `800_persistence/`.

> **Definición canónica** del reinicio de fase (C-12, T-011), transversal a los 6 arneses.

## Timestamp real (no lo inventes)
Marca real en UTC con `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (herramienta
`PowerShell`). Si no puedes, pide la hora al humano; **no fabriques timestamps**.

## 0. Fase activa
Lee `harness-state.json → current_phase` (hoy `010_discovery`) y `phases[current_phase].status`;
deriva el estado táctico de `phases[current_phase].execution_state_path` y la carpeta de la fase.
Si `harness-state.json` no existe o la fase está en `NOT_STARTED` → no hay nada que reiniciar: informa
y **detente** (si quiere arrancar, es `/caden-init` + `/caden-discovery`).

## 1. Caso especial: fase ya aprobada (`PHASE_COMPLETE`)
Si la fase está **firmada y consolidada** (`PHASE_COMPLETE`), reiniciar **tira a la basura un roadmap
aprobado**. Antes de confirmar:
- **Adviértelo con claridad** al humano (qué versión aprobada se perdería).
- **Sugiere `/caden-change "<feature>"`** si su objetivo es evolucionar lo aprobado (preserva el trabajo
  firmado e inyecta el cambio).
- Solo continúa al paso 2 si, aun así, **confirma** que quiere descartar y rehacer desde cero.

## 2. Confirmación explícita (obligatoria, acción destructiva)
**Antes de tocar nada**, presenta al humano **exactamente** qué vas a archivar y resetear:
- archivar → `<fase>/execution-state.json`, `<fase>/project-progress.txt`, `<fase>/deliverables/`,
  `<fase>/eval/`.
- preservar → `900_documents/scope.md`, `705_knowledge/` (transversal) y el historial
  `harness-state.json → approvals[]/escalations[]`.
- resetear → la fase activa vuelve a `NOT_STARTED` (lienzo limpio).

Pide un **"sí / confirmo"** explícito. Si **no** confirma (o duda) → **no cambies nada** y detente.

## 3. Archiva (no borres) los artefactos de la fase
Toma una marca real y crea una carpeta de respaldo con sello de tiempo, p. ej.
`<fase>/_archive/<yyyymmddThhmmssZ>/`. **Mueve** allí (no copies-y-dejes el original; no borres
directamente):
- `execution-state.json`, `project-progress.txt`, la carpeta `deliverables/` y la carpeta `eval/`.

Deja `705_knowledge/` **en su sitio** (es transversal: el conocimiento acumulado sobre el producto no se
descarta al reiniciar una fase).

## 4. Resetea el estado a lienzo limpio
- **`<fase>/execution-state.json`:** re-instáncialo desde `.caden/templates/<…>/execution-state.template.json`
  (sin `.template`, sin claves `_*`): `execution_status: "NOT_STARTED"`, todos los `checkpoints[*].reached:
  false`, `clarification_loop`/`rework_loop`/`timing` en cero, `change_request.active: false`,
  `last_checkpoint: null`, `updated_at` real. En `durability`: incrementa `restarts` y añade a
  `suspensions`/`resumptions` **nada** — registra el reinicio en `durability.restarts` y deja una nota en
  la bitácora nueva (paso 5).
- **`harness-state.json`:** `phases[current_phase].status: "NOT_STARTED"`, `phases[current_phase].verdict:
  null`, `updated_at` real. **Preserva** `approvals[]` y `escalations[]` (no se borra el pasado, D-021): el
  historial queda como registro; la próxima corrida producirá su propia firma. No cambies `project` ni
  `current_phase`.
- **`<fase>/project-progress.txt`:** re-instáncialo desde su molde con una **línea de cabecera** que registre
  el reinicio (marca real, motivo `$ARGUMENTS` si vino, y la ruta del `_archive/<…>` donde quedó lo anterior).

## 5. Reporta al humano
Confirma en pocas líneas:
- Fase `<current_phase>` **reiniciada a cero**.
- **Respaldo** de lo anterior en `<fase>/_archive/<sello>/` (recuperable).
- `705_knowledge/` y el historial de `approvals[]` **preservados**.
- **Siguiente paso:** si el scope cambió, edita `900_documents/scope.md`; luego ejecuta
  **`/caden-discovery`** para la nueva corrida.

## Reglas inviolables
- **Nunca reinicies sin confirmación explícita** del humano (paso 2). Acción destructiva.
- **Archiva, no borres a ciegas:** lo anterior se **mueve** a `_archive/<sello>/`, recuperable; nunca se
  elimina directamente.
- **Preserva lo transversal y el historial:** `705_knowledge/` y `approvals[]`/`escalations[]` no se tocan
  (salvo el `status` de la fase).
- **Si el fin es evolucionar lo firmado, es `/caden-change`,** no reiniciar.
- **Timestamps reales**, nunca fabricados.
- **Respeta los planos:** escribe solo en el runtime del cliente.
