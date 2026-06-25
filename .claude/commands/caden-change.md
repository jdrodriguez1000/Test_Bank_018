---
description: >-
  Comando global del motor CADEN (plano de operación). Modo Ajuste / Inyección de Features:
  reabre una fase YA FIRMADA sobre un manifest vigente para inyectar una feature nueva sin
  borrar lo aprobado, reordenar el calendario y exigir re-firma. Tras consolidar (PHASE_COMPLETE) hace
  commit (+ push opt-in) autónomo del ajuste vN+1 (T-035). Lo ejecuta la Instancia A
  (sesión principal). Transversal a los 6 arneses; hoy aterriza en el 010 (Discovery, diseño §11).
argument-hint: "\"<descripción de la feature/cambio a inyectar>\""
allowed-tools: Read, Write, Edit, Agent, Bash, PowerShell
model: opus
---

# /caden-change — Modo Ajuste / Inyección de Features (comando global, INC-5)

El humano quiere **inyectar una feature nueva** en una fase **ya firmada**: `/caden-change "<descripción>"`.
Tú eres la **Instancia A — Governor**. Tu trabajo es **reabrir el arnés en Modo Ajuste**, mutar el
manifest vigente **sin borrar lo aprobado** (cirugía precisa), reordenar el calendario, presentar el
**diff** y exigir **re-firma** (`/caden-approve`) antes de re-auditar con **D8** activa.

> **Plano de operación (L-001).** Corre sobre la **carpeta del cliente**. Escribe solo en el runtime del
> cliente (`harness-state.json`, `010_discovery/…`, `705_knowledge/…`); **nunca** en `720_build/` ni en
> `800_persistence/`.

> **Definición canónica (C-12, T-011).** Este archivo define qué significa "inyectar una feature";
> transversal a los 6 arneses. Hoy la única fase construida es el **010 (Discovery)**; este playbook
> aterriza el flujo **§11 del diseño** del 010. Reutiliza el **protocolo de rechazo** y el **gate** de
> `/caden-discovery` (no los duplica).

> **Regla dura.** Una feature nueva **siempre** pasa por este arnés **antes** de tocar código; nunca se
> inyecta "en caliente" en la ejecución (riesgo del brief §7 — deuda técnica).

## Timestamps reales (T-019)
Toda marca es **real**, con `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (`PowerShell`).
Si no puedes ejecutarla, pide la hora al humano; **no inventes**. Aplica a `project-progress.txt`,
`*_at`, `change_log[].changed_at`, `durability`/`timing` y al registro de la firma.

## Pasos

### 1. Apertura — CP-00 (modo AJUSTE)
1. **Exige `$ARGUMENTS` no vacío** (la descripción del cambio). Si viene vacío, **detente** y pídela.
2. Lee **`harness-state.json`** → `current_phase` (hoy `010_discovery`) y su estado.
   **Precondición:** la fase debe estar **firmada y consolidada** —
   `phases[current_phase].status == "PHASE_COMPLETE"` y el manifest vigente con `approved: true` y al
   menos una entrada `approvals[]` con `audit_result == "APPROVED"`. Si **no** hay un manifest firmado:
   **detente** y dile al humano que primero complete la fase con `/caden-discovery` (Modo Ajuste solo
   reabre lo ya aprobado; un draft sin firmar se ajusta con `/caden-review`, no con `/caden-change`).
3. Lee el **`010_discovery/deliverables/roadmap-manifest.json` vigente** (firmado) + sus
   `slices/<id>.md`. A partir de la **descripción del cambio**, determina las **slices impactadas** (las
   que la feature toca o desplaza) con un primer juicio; lo afinará el `epic-slicer`.
4. **Reabre la fase:** `execution-state.json → mode: "AJUSTE"`; inicializa el bloque `change_request`
   (`description` = `$ARGUMENTS`, `requested_at` real, `impacted_slices` tentativas, `strategy: null`).
   Marca **CP-00** (mode AJUSTE), fija `last_checkpoint: "CP-00"`, `timing.started_at` real, y crea/usa
   `010_discovery/project-progress.txt` añadiendo la línea de apertura del ajuste.
5. **Durabilidad (INC-4):** esta corrida también es reanudable — persiste cada checkpoint
   (`last_checkpoint`, `durability`, bitácora) igual que en `/caden-discovery`; `/caden-continue` puede
   retomarla.

### 2. Sprint Contract en modo AJUSTE — gate de arranque (P5)
1. Redacta el Sprint Contract desde su molde con **Modo: AJUSTE**, declarando en ENTRADAS el cambio
   (`$ARGUMENTS`) y en el Criterio Done el punto (6) (cambio reflejado sin borrar lo aprobado, calendario
   reordenado y re-firmado).
2. **Preséntalo al humano y espera aprobación explícita.** No invoques a nadie hasta el "sí".
3. Al aprobar: persiste el contrato; `phases[current_phase].status: "IN_EXECUTION"` (la fase vuelve a
   ejecución; reusamos el enum, no hay estado nuevo).

### 3. Aclaración de comportamiento — behavior-questioner acotado
Invoca al **`behavior-questioner` en modo acotado** (NO un cuestionario completo): solo el
**comportamiento/flujo de datos nuevo** que introduce la feature. Relaya las preguntas al humano,
recoge respuestas y re-invócalo para que **actualice** `behavior_transcript.md` con `Edit` (preserva lo
ya acordado; no lo reescribe). Marca **CP-01** y añade su línea a la bitácora. (Fallback E5 / `UNRESOLVED`
aplica igual: no inventes.)

### 4. Análisis de impacto — epic-slicer en modo impacto — CP-02
Invoca al **`epic-slicer` en modo impacto** pasándole el manifest vigente + el transcript actualizado +
la descripción del cambio. Decide la **estrategia de cirugía precisa** (sin borrar lo aprobado):
- **Opción A — Expansión:** la feature cabe **dentro de una slice existente** → añade
  escenarios/no-funcionales a esa slice (no nace slice nueva).
- **Opción B — Nueva Rebanada:** la feature es una slice propia → crea una **slice intermedia** en la
  banda correcta y **recalcula `order`/`depends_on`** de las posteriores (desplaza el calendario, sin
  violar el orden de bandas ni las 3 anclas).
- Si la feature es una **Épica**, el slicer la tritura primero (mismo **bucle de aclaración** del §2:
  `PENDIENTE DE ACLARACIÓN` → re-invocas questioner acotado → slicer; `ALERTA`/≥3 iteraciones → escalas).

El slicer actualiza `010_discovery/deliverables/slicing_report.md` con la estrategia (A/B) y el delta.
Persiste `change_request.strategy` y las `impacted_slices`/`added_slices` definitivas. Marca **CP-02**.

### 5. Mutación del manifest — bdd-synthesizer (modo mutación) — CP-03
Invoca al **`bdd-synthesizer` en modo mutación**: **muta** el `roadmap-manifest.json` vigente
(NO lo reescribe desde cero) y escribe/actualiza **solo** los `slices/<id>.md` afectados; el resto
permanece **intacto**. Reglas:
- **Opción A:** añade escenarios BDD / no-funcionales al `.md` de la slice existente; su entrada en el
  manifest cambia lo mínimo.
- **Opción B:** inserta la nueva slice con su `.md` y aplica el `order`/`depends_on` recalculados por el
  slicer a las posteriores.
- **No toca `version`** (la fija `/caden-approve` en la re-firma → `vN+1`); **reabre el draft**:
  manifest `approved: false`, `signed_at: null`, y las slices **añadidas/modificadas** → `status: "draft"`
  (las no tocadas conservan su contenido).
- Añade una entrada a `change_log[]` del manifest (`change_description`, `strategy`, `affected_slices`,
  `added_slices`, `changed_at` real; `version` quedará en la re-firma).

Marca **CP-03** (`manifest_path`, `slice_md_paths[]`); `execution_status: "EXECUTION_COMPLETE"`;
`phases[current_phase].status: "EXECUTION_COMPLETE"`.

### 6. Diff + gate de re-firma — CP-03 → CP-04
1. **Presenta el DIFF al humano**, explícito: **qué se añadió**, **qué se movió** (slices con `order`/
   `depends_on` recalculados) y **qué NO cambió** (lo aprobado que permanece intacto). Sé claro sobre la
   estrategia (Expansión / Nueva Rebanada).
2. **Abre el gate y espera** la resolución con un comando global:
   - **`/caden-approve`** → re-firma plena: registra la firma en `approvals[]`, marca slices `approved`,
     fija **`version = N+1`** (N = firmas previas con `audit_result == "APPROVED"`; D-020/D-021), pone
     **CP-04** y deja la fase `IN_AUDIT`; te devuelve el control en el paso 7.
   - **`/caden-review "<ajustes>"`** → sí con ajuste puntual al diff: re-trabajo mínimo y reabre el gate.
   > La firma es del humano. **No firmes tú.** Sin re-firma, el cambio **no se consolida**.

### 7. Auditoría con D8 — invoca a C
1. Cierra el registro de tiempos (`timing.completed_at` real) antes de invocar a C.
2. Invoca al **`discovery-evaluator`** indicándole el **modo `AJUSTE`** y los paths habituales
   (manifest, slices, transcript, slicing_report, `decisions_library`, execution-state, harness-state).
   En AJUSTE, **D8 (integridad del cambio) aplica**: C verifica que la feature se integró **sin borrar lo
   aprobado**, el calendario quedó coherente y hay re-firma. **Veto:** `D8 == 0.0` → `REJECTED`.
3. Lee `010_discovery/eval/verdict.json` y **aplica el mismo protocolo de rechazo del paso 6 de
   `/caden-discovery`** (no lo dupliques aquí):
   - **APPROVED** → fija `audit_result: "APPROVED"` en la última firma; `phases[current_phase].status:
     "PHASE_COMPLETE"`, `verdict: "APPROVED"`. El manifest mutado queda consolidado en `vN+1`.
   - **REJECTED técnico** (`failed_workers[]`) → `IN_REWORK`: anula la firma (`REJECTED`), re-invoca solo
     los workers fallidos (tope `rework_loop.max_iterations`), reabre el draft y vuelve al paso 6.
   - **REJECTED estratégico / tope agotado / veto** → `HOLD` + `escalations[]` + escala al humano.

### 8. Conocimiento transversal — `705_knowledge/`
Registra en `705_knowledge/` (sin preguntar) las **decisiones/lecciones** del ajuste (p. ej. por qué
Expansión vs. Nueva Rebanada, supuestos acordados). Si no hubo, no escribes nada.

### 9. Versionado autónomo — commit (+ push) del ajuste firme (T-035)
Aplica **el mismo procedimiento que `/caden-discovery` paso 8** (lee `.caden/config.json`; commit local si
`git.local_versioning`; push **opt-in** si `git.push == true` y existe `origin`; **reintento 1× y fallo de
push NO bloquea** —commit queda local + aviso—; sin `--force`; credential helper ambiental, sin secretos).
Particularidades del Modo Ajuste:
- **Disparador:** solo si el ajuste quedó **`PHASE_COMPLETE`** (APPROVED en el paso 7). Si terminó en
  `IN_REWORK` o `HOLD`, **no llegas aquí** → nunca commitees un ajuste a medias o rechazado. Este es el
  **segundo** y último momento de commit autónomo del motor (el otro es `PHASE_COMPLETE` de Discovery).
- **Mensaje de commit:** refleja la re-firma, p. ej.
  `caden(010_discovery): ajuste v<N+1> — <descripción corta del cambio> (<project>)`
  (toma `v<N+1>` del manifest re-firmado y la descripción de `change_request`).
- **Alcance del commit:** el manifest mutado, los `slices/<id>.md` afectados, `705_knowledge/` y ambos
  estados (`harness-state.json`, `010_discovery/execution-state.json`).
- **Traza:** línea en `project-progress.txt` con el hash del commit + estado del push
  (`pushed` / `local-only: <razón>` / `omitido: <razón>`).

### 10. Cierre
Reporta al humano: estado final, `v<N+1>`, el diff consolidado, los paths y el **resultado del
versionado** (commit local y, si aplica, push). El manifest es **vivo**: el bucle de Arneses 3→6 se
reanuda sobre el manifest mutado (handoff). Cierra la bitácora y `updated_at`.

## Reglas inviolables
- **Cirugía, no reescritura:** nunca borres ni regeneres lo aprobado; muta lo mínimo y conserva el resto.
- **Re-firma obligatoria:** sin `/caden-approve` el cambio no se consolida (D7); en AJUSTE además rige D8.
- **Tú eres el único que spawnea** (modelo plano): B/workers/C no se invocan entre sí.
- **No firmes por el humano.** Timestamps reales, nunca fabricados.
- **Commit/push autónomo solo en `PHASE_COMPLETE` (T-035):** nunca commitees un ajuste en rework o `HOLD`.
  Push opt-in; su fallo no bloquea (commit local + aviso). Nunca `--force`.
- **Respeta los planos:** escribe solo en el runtime del cliente.
