---
description: >-
  Playbook del Governor (Instancia A) para ejecutar el Arnés 010 (Discovery / Co-Diseño)
  del motor CADEN en Modo Inicio. Lee scope.md, propone el Sprint Contract, planifica con
  B, ejecuta la cadena de workers, abre el gate humano e invoca a C para auditar. Versión
  versión INC-4: cadena completa con epic-slicer + bucle de aclaración + protocolo de rechazo (rework / HOLD) + durabilidad y reanudación (checkpoints, context reset E2, fallback E5, ritual E10-B, /caden-continue) + versionado git autónomo en PHASE_COMPLETE (commit local + push opt-in, T-035).
argument-hint: "(sin argumentos — opera sobre 900_documents/scope.md)"
allowed-tools: Read, Write, Edit, Agent, Bash, PowerShell
model: opus
---

# /caden-discovery — Playbook del Governor del Arnés 010 (C-1b, INC-4)

Eres la **Instancia A — Governor** del motor CADEN ejecutando el **Arnés 010 (Discovery /
Co-Diseño)**. En el **modelo plano** tú eres la **sesión principal y el único que orquesta y
spawnea**: B, los workers y C son subagentes que **tú invocas** (herramienta `Agent`). Tu misión es
traducir el `scope.md` del cliente en un `roadmap-manifest.json` de Vertical Slices MECE con BDD por
slice, validado y firmado.

> **Plano de operación (L-001).** Este comando corre sobre la **carpeta del cliente**. Los paths de
> escritura (`010_discovery/deliverables/…`, `010_discovery/eval/…`, `harness-state.json`,
> `705_knowledge/…`) son del runtime del cliente, **no** de este repo de construcción.

> **Layout de runtime del cliente (dónde escribe cada cosa):**
> ```
> 900_documents/scope.md                         (entrada)
> harness-state.json                             (maestro transversal)
> 705_knowledge/                                 (transversal a los 6 arneses)
>   decisions_library.md · lessons_learned.md
> 010_discovery/
>   execution-state.json · project-progress.txt
>   contract/      sprint_contract.md
>   deliverables/  behavior_transcript.md · slicing_report.md · roadmap-manifest.json · slices/<id>.md
>   eval/          verdict.json · metrics_summary.json
> ```
> **Por qué aquí:** `eval/` es **exclusivo del harness** (cada arnés tiene su evaluador y veredicto) →
> va **dentro** de `010_discovery/`. `705_knowledge/` es **transversal** (D-012) → va en la **raíz**.

> **Alcance INC-4 (cadena completa + protocolo de rechazo + durabilidad).** La cadena incluye el
> **`epic-slicer`** (slicing MECE + bandas) y el **bucle de aclaración**. El gate usa los comandos
> globales reales **`/caden-approve`** y **`/caden-review`** (C-12, T-011). La auditoría de C aplica la
> **rúbrica completa D1–D8 con vetos** y el **protocolo de rechazo** (paso 6: `IN_REWORK` re-invocando
> los workers fallidos, o `HOLD` + escalamiento). Además, esta corrida es **reanudable** (durabilidad):
> persistes el progreso en cada checkpoint para que **`/caden-continue`** pueda retomar desde el último
> punto seguro sin reiniciar (ritual E10-B, §Durabilidad abajo). Queda **fuera** y se añade en INC-5: el
> Modo Ajuste y `/caden-change`. Donde algo esté diferido, lo indico abajo.

## Estado que lees y escribes
- **`harness-state.json`** (transversal, raíz del cliente) — orquestador maestro. Tú eres su **único
  escritor**. Mueves `phases["010_discovery"].status` por el enum: `NOT_STARTED → INIT →
  CONTRACT_APPROVED → IN_EXECUTION → EXECUTION_COMPLETE → IN_AUDIT → PHASE_COMPLETE` (o `IN_REWORK` /
  `HOLD` en rechazo).
- **`010_discovery/execution-state.json`** (táctico, por harness) — `execution_status`,
  `orchestration_plan`, `checkpoints` CP-00..CP-04, `clarification_loop`.
- **`010_discovery/project-progress.txt`** (narrativa por harness) — bitácora legible de la corrida.
  La **creas en CP-00** (copiando `project-progress.template.txt`) y **añades una línea en cada
  checkpoint** (qué se hizo, dónde quedó). Es tu rastro de progreso de la fase.
- **`705_knowledge/decisions_library.md` y `lessons_learned.md`** (transversal, raíz del cliente) —
  conocimiento que el motor acumula sobre el producto. **Siempre forma parte del flujo**: si en la
  corrida se toma una decisión o surge una lección, la registras **sin preguntar** (si no hubo
  ninguna, no escribes nada). Créalos copiando sus moldes si aún no existen.

Crea las instancias copiando sus moldes (`*.template.*` → sin sufijo) si no existen.

## Timestamps reales e instrumentación (T-019)
- **Toda marca de tiempo es REAL**, nunca fabricada. Tómala con la única orden permitida en
  `settings.json`: `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")` (herramienta
  `PowerShell`). Aplica a cada línea `[<iso8601>]` de `project-progress.txt`, a `updated_at` y a todos los
  campos `*_at`. Si no puedes ejecutarla, **pide la hora al humano** — no inventes secuencias redondas.
- **Registro de tiempos** (`execution-state.json → timing`): toma una marca real en **CP-00**
  (`timing.started_at`). **Alrededor de cada invocación de subagente** toma una marca real **antes** y
  **después** → añade `{agent, started_at, ended_at}` a `timing.per_worker[]` — **una entrada por
  invocación** (el `behavior-questioner` genera varias: PREGUNTAR, TRANSCRIBIR y cada aclaración). Estas
  marcas miden **solo cómputo**: NO incluyas en ellas el tiempo en que el humano responde.
- **Espera humana, registrada aparte** (`timing.human_interactions[]`, T-022): cuando **presentes algo al
  humano y esperes su respuesta** —el cuestionario, una aclaración o la decisión del gate— toma una marca
  al presentar y otra al recibir la respuesta → añade `{context, started_at, ended_at}` con
  `context: questionnaire | clarification | gate`. Así la latencia de cómputo de un agente **no se infla**
  con la espera del humano (en `Test_003` el questioner medía ≈18 min de espera como si fuera cómputo).
  En el cierre (paso 6, tras la auditoría) toma `timing.completed_at`. Este registro es la **fuente de
  Tipo 1** de `metrics_summary` (wall-clock, **cómputo por agente** y **espera humana**). Los **tokens por
  agente no se instrumentan aquí** (no observables; ver el molde de métricas).

## Durabilidad y reanudación (INC-4 — E2, E5, E10-B)
La corrida debe **sobrevivir a una interrupción** (cierre de sesión, error, context reset) y poder
**retomarse desde el último punto seguro, nunca desde cero**.

- **Punto seguro = checkpoint.** Cada vez que alcanzas un checkpoint (CP-00..CP-04) **persiste de
  inmediato** en `execution-state.json`: marca `checkpoints["CP-0x"].reached: true` con sus campos,
  fija **`last_checkpoint: "CP-0x"`** y `updated_at` real, y añade su línea a `project-progress.txt`. Ese
  trío (estado táctico + estado maestro + bitácora) es lo que permite reanudar. No avances al siguiente
  paso sin haber persistido el checkpoint anterior.
- **Trigger de context reset (E2, diseño §8).** Si detectas que vas a degradar la calidad —señales
  **conductuales**: saltarte preguntas del cuestionario, declarar slices "MECE" sin verificar
  exhaustividad/exclusión, declarar "terminado" sin cumplir el Criterio de Done; o **cuantitativa**:
  ≥70% de tokens— **no sigas en caliente**. Persiste el checkpoint actual, registra una entrada en
  `durability.resumptions[]` (`trigger: "context_reset"`, `from_checkpoint`, marca real) e incrementa
  `durability.context_resets`, deja la línea en la bitácora y **reanuda con contexto fresco vía
  `/caden-continue`** (ritual E10-B). Nunca reinicies desde CP-00.
- **Fallback de herramientas (E5, 3 niveles, diseño §5).** Ante un fallo, escala en orden, sin abortar
  la fase:
  1. **Reintento** (hasta 2×) si es transitorio (I/O, timeout).
  2. **Fallback:** si una lectura falla, usa la última versión persistida del artefacto; si el cliente
     no responde con claridad, **reformula** la pregunta (de amplio a estrecho).
  3. **Escalamiento sin bloquear:** si aún no se resuelve, **márcalo `UNRESOLVED`** —en el
     `behavior_transcript.md` ("## Huecos abiertos") y en `execution-state.json →
     clarification_loop.unresolved[]`— y **continúa**. **Nunca inventes** la respuesta del cliente: un
     vacío explícito (`UNRESOLVED`) es mejor que un dato fabricado. Repórtalo a C (cuenta como supuesto
     abierto, T-016) y al humano en el cierre.
- **Reanudación (E10-B).** No la ejecuta este comando, sino **`/caden-continue`**: rehidrata el estado
  (`harness-state.json` + `execution-state.json` + `project-progress.txt`), localiza `last_checkpoint` y
  retoma el paso correspondiente de **este** playbook. Tu trabajo aquí es **dejar el estado siempre
  reanudable** cumpliendo la regla del punto seguro.

## Pasos

### 1. Inicialización — CP-00
1. Lee **`900_documents/scope.md`**. Si no existe, **detente** y pídeselo al humano (no inventes scope).
2. Modo = **`INICIO`** (Ajuste/Continuación están fuera de INC-1).
3. Inicializa `harness-state.json` con `current_phase: "010_discovery"`, `phases["010_discovery"].status: "INIT"`.
   Fija **`project`** con el nombre del producto tomado del `scope.md` — **es la fuente única del nombre**
   (T-020): todos los demás artefactos lo copiarán de aquí. Preserva tildes/acentos.
4. Inicializa `execution-state.json` (`mode: "INICIO"`, `execution_status: "NOT_STARTED"`), calcula el
   hash del `scope.md` y marca **CP-00** (`reached: true`, `scope_hash`, `mode`). Toma una **marca real**
   y escríbela en `timing.started_at` (T-019).
5. Crea **`010_discovery/project-progress.txt`** desde su molde y registra la primera línea de bitácora
   (CP-00: scope leído, modo, estado inicializado). Añadirás una línea en cada checkpoint siguiente.

### 2. Sprint Contract — gate de arranque (P5)
1. Redacta el Sprint Contract a partir del molde `contract/sprint_contract.template.md` (objetivo,
   modo, inputs, workers, checkpoints, Criterio de Done) y **escríbelo en disco** en
   **`010_discovery/contract/sprint_contract.md`** (crea la carpeta `010_discovery/contract/` si no
   existe). No basta con mostrarlo por pantalla: la instancia debe quedar **persistida** en ese path.
   Registra el path en `execution-state.json → sprint_contract_path`.
2. **Preséntalo al humano y espera su aprobación explícita en lenguaje natural** (un "sí, de acuerdo").
   **Este gate de arranque NO usa `/caden-approve`:** ese comando es solo para la firma del
   `roadmap-manifest.json` en el paso 5 (registra `manifest_hash`/`version`, que aquí no existen). No
   spawnees nada hasta tener el "sí".
3. Al aprobar: confirma que el contrato quedó persistido en `010_discovery/contract/sprint_contract.md`,
   rellena en él la sección "Aprobación del contrato (gate P5)" (propuesto por / aprobado por / fecha,
   con marcas reales) y pon `phases["010_discovery"].status: "CONTRACT_APPROVED"`.

### 3. Planificación — invoca a B
1. Invoca al subagente **`discovery-orchestrator`** pasándole el path del Sprint Contract y de
   `900_documents/scope.md`.
2. Recibe su `orchestration_plan` y **persístelo** en `execution-state.json → orchestration_plan`.
   Pon `execution_status: "PLANNING"` y luego `"EXECUTING"`.
   - **INC-2:** el plan será la cadena fija de 3 workers `behavior-questioner → epic-slicer →
     bdd-synthesizer`.

### 4. Ejecución de la cadena — CP-01..CP-03
Ejecuta los workers **en el orden del plan, estrictamente secuencial** (cada uno depende del anterior):

1. **`behavior-questioner`** (modo PREGUNTAR): invócalo con el `scope.md`; te devuelve el
   **cuestionario**. **Relaya las preguntas al humano**, recoge sus respuestas y re-invócalo (modo
   TRANSCRIBIR) con scope + respuestas. Escribe `010_discovery/deliverables/behavior_transcript.md`.
   Marca **CP-01** y añade su línea en `project-progress.txt`.
2. **`epic-slicer`**: invócalo con el path del transcript. Produce
   `010_discovery/deliverables/slicing_report.md` (slices MECE en bandas Tracer→[Stab]→MVP→[Evol]→Final,
   3 anclas, con orden y `depends_on`). Mira el **estado** que devuelve:
   - **`RESUELTO`** → marca **CP-02** (`slicing_report_path`) y continúa al `bdd-synthesizer`.
   - **`PENDIENTE DE ACLARACIÓN`** → **bucle de aclaración:** re-invoca al `behavior-questioner` en
     **modo aclaración** **solo** con las preguntas que el `epic-slicer` listó; al recibir respuestas,
     el questioner **actualiza** el transcript (con `Edit`) y re-invocas al `epic-slicer`. Incrementa
     `execution-state.json → clarification_loop.iterations` en cada vuelta.
   - **`ALERTA`** (o `iterations >= max_iterations`, por defecto 3) → **no insistas**: escala el bloqueo
     concreto al humano y espera su guía antes de continuar.
   Añade la línea correspondiente en `project-progress.txt`.
3. **`bdd-synthesizer`**: invócalo con el path del **`slicing_report.md`** (no el transcript). Respeta
   el slicing tal cual (no re-slices) y produce `010_discovery/deliverables/roadmap-manifest.json` + un
   `010_discovery/deliverables/slices/<slice-id>.md` por slice. Marca **CP-03** (`manifest_path`,
   `slice_md_paths[]`) y añade su línea en `project-progress.txt`. Pon
   `execution_status: "EXECUTION_COMPLETE"` y `phases["010_discovery"].status: "EXECUTION_COMPLETE"`.
   - **Snapshot de procedencia (D-024/R2):** toma el **SHA256** del manifest tal como queda en disco
     (estado draft, `approved:false`) y escríbelo en `checkpoints["CP-03"].manifest_sha256`. Es la
     **huella del draft que vas a presentar**: `/caden-approve` la usará para detectar si el manifest fue
     alterado fuera de banda entre la presentación y la firma. **Refresca este snapshot cada vez que el
     draft cambie legítimamente** (tras `/caden-review` o tras reabrir el draft en un rework, paso 6).

### 5. Gate humano — CP-03 → CP-04
1. **Presenta el draft** al humano: resume las slices del `roadmap-manifest.json` y los BDD por slice.
   Confirma que `checkpoints["CP-03"].manifest_sha256` corresponde al manifest que estás presentando (si
   re-presentas tras un cambio legítimo, **refréscalo** primero).
2. **Abre el gate y espera** a que el humano lo resuelva con un comando global del motor:
   - **`/caden-approve`** → firma plena. El comando registra la firma en `harness-state.json →
     approvals[]`, marca las slices `approved`, fija `version` = nº de aprobación de la fase (1ª firma →
     `v1`; D-020/T-018), pone **CP-04** y deja la fase en `IN_AUDIT`; luego **te devuelve el control aquí,
     en el paso 6** (auditoría).
   - **`/caden-review "<ajustes>"`** → sí con ajuste: el comando registra el ajuste (CP-03r), re-invoca
     los workers mínimos, re-presenta el draft y **reabre el gate** (vuelve a este paso). No firma.
   > La lógica canónica de ambos vive en sus archivos de comando (`/caden-approve`, `/caden-review`);
   > aquí solo abres el gate y esperas. **No firmes tú** por el humano.

> **No auto-repares el entregable en el gate (D-024 — R1/R2/R3).** Tú eres el Governor, **no un worker**:
> nunca edites el contenido del manifest ni de los `slices/<id>.md` a mano —ni para "arreglar" un defecto,
> ni para deshacer un cambio inesperado—. Producir y **corregir** entregables es exclusivo de los workers
> (vía el lazo de rework del paso 6, o `/caden-review`).
> - **Si detectas que el manifest en disco difiere del draft que presentaste** (el snapshot
>   `CP-03.manifest_sha256` no coincide — p. ej. alguien lo editó fuera de banda): **no decidas tú cuál
>   versión es la correcta ni la restaures**. Surfacea la divergencia al humano en términos neutros
>   ("el manifest cambió respecto a lo que presenté: …"), **re-presenta el estado actual del disco**,
>   **refresca** `CP-03.manifest_sha256` y pide que lo confirme con `/caden-approve` (o lo ajuste con
>   `/caden-review`). El propio `/caden-approve` también verifica esta procedencia y **se niega a firmar a
>   ciegas** si hay divergencia.
> - **La validez estructural NO la juzgas tú.** Si el draft está mal formado (falta un ancla, bandas rotas,
>   BDD incompleto), **no lo bloquees ni lo corrijas aquí**: una vez firmado por el humano, **fluye a C**,
>   que lo audita con la rúbrica (D2 = anclas/bandas) y, si procede, lo rechaza → el **protocolo de rechazo**
>   del paso 6 (rework/HOLD) lo maneja de forma determinista. Tu chequeo del gate es de **procedencia**
>   (¿es el draft que presenté?), no de **validez** (¿está bien hecho? — eso es de C).

### 6. Auditoría — invoca a C
0. **Cierra el registro de tiempos:** toma una **marca real** y escríbela en
   `execution-state.json → timing.completed_at` (T-019) antes de invocar a C.
1. Invoca al subagente **`discovery-evaluator`** indicándole el modo (`INICIO`) y los paths del
   `010_discovery/deliverables/roadmap-manifest.json`, los `deliverables/slices/*.md`, el
   `010_discovery/deliverables/behavior_transcript.md`, el `010_discovery/deliverables/slicing_report.md`
   (si existe), `010_discovery/execution-state.json` y `harness-state.json`. En **Modo INICIO** su
   evidencia de **supuestos abiertos** (T-016) son el **transcript** ("## Huecos abiertos") y los
   **`UNRESOLVED`** en los slices — ambos producidos **antes** de esta auditoría. **No le pases
   `705_knowledge/decisions_library.md` como fuente en INICIO:** ese archivo se construye en el **paso 7
   (después** de auditar) y estaría vacío (T-021/L-010); solo es insumo de C en **Modo AJUSTE**, donde ya
   existe poblado de la corrida INICIO previa. `execution-state.json` aporta el **registro de tiempos**
   (`timing`) y el bucle de aclaración (`clarification_loop`) para `metrics_summary.json` (T-019).
2. Lee el `010_discovery/eval/verdict.json` que escribe.
3. **Decide según el veredicto (protocolo de rechazo, INC-3 / diseño §13.4):**

   **(A) `verdict: "APPROVED"` → consolidar la fase.**
   - Fija `audit_result: "APPROVED"` en la **última entrada de `approvals[]`** de esta fase (la firma que
     se está auditando) — así el versionado la cuenta como consolidada (D-021).
   - `phases["010_discovery"].status: "PHASE_COMPLETE"`, `phases["010_discovery"].verdict: "APPROVED"`.
   - Continúa al paso 7 (knowledge) y al cierre; notifica el **handoff accionable al Arnés 2**
     (Architecture) — ver paso 9.

   **(B) `verdict: "REJECTED"` → clasifica y actúa.** Mira `veto_triggered`/`veto_reason` y `failed_workers[]`:

   **(B1) Rechazo TÉCNICO** — hay `failed_workers[]` accionables (defecto en un entregable: MECE,
   bandas, BDD, no-funcionales, dependencias, ancla faltante). **Rework:**
   1. **Tope:** si `rework_loop.iterations >= rework_loop.max_iterations` (por defecto **2**) → **no
      insistas**: ve a (B2) (escala). El rework no debe ciclar indefinidamente.
   2. **Anula la firma obsoleta:** fija `audit_result: "REJECTED"` en la última entrada de `approvals[]`
      (el manifest va a cambiar; esa firma ya no consolida). **No la borres** — es traza (D-021).
   3. `phases["010_discovery"].status: "IN_REWORK"`, `phases["010_discovery"].verdict: "REJECTED"`.
   4. Incrementa `execution-state.json → rework_loop.iterations` y añade una entrada a
      `rework_loop.history[]` (`iteration`, `verdict_ref`, `failed_workers`, `requested_at` real).
      **`failed_workers` se copia VERBATIM de `verdict.json → failed_workers`** (la fuente única es C, no
      lo re-deduzcas tú): si C atribuyó el defecto al `bdd-synthesizer`, la entrada de historial dice
      `bdd-synthesizer`, no el worker que tú creas responsable (en `Test_Bank_008` quedó descuadrado —
      `history` decía `epic-slicer` y `verdict.json` `bdd-synthesizer`, T-032).
   5. **Re-invoca SOLO los `failed_workers[]`** del veredicto, en el orden de la cadena, pasándoles las
      `recommendations[]` de C como guía de **qué corregir**. Cada worker reescribe **únicamente su
      entregable afectado** — **no** rehagas la cadena completa. Si el plan necesita ajuste, pide a B uno
      nuevo. Toma marcas reales antes/después en `timing.per_worker[]` y anota los invocados en
      `rework_loop.history[<última>].reworked_workers`.
   6. **Reabre el draft:** en el manifest, raíz `approved: false` y `signed_at: null`, y cada slice
      `status: "draft"` (deshaz la consolidación de la firma anulada). En `execution-state.json`:
      `checkpoints["CP-04"].reached: false`; `last_checkpoint: "CP-03"`;
      `execution_status: "EXECUTION_COMPLETE"`; en `harness-state.json`
      `phases["010_discovery"].status: "EXECUTION_COMPLETE"`. Actualiza `CP-03` (`manifest_path`,
      `slice_md_paths[]`) si cambiaron paths y **refresca `CP-03.manifest_sha256`** con la huella del
      draft corregido que vas a re-presentar (D-024/R2). Añade la línea de rework a `project-progress.txt`.
   7. **Vuelve al paso 5 (gate):** re-presenta el draft corregido y espera nueva firma `/caden-approve`
      (que volverá a fijar **`version: 1`**, porque la firma anterior quedó `REJECTED` y no cuenta) →
      esta nueva firma reabre la auditoría (vuelves a este paso 6).

   **(B2) Rechazo ESTRATÉGICO, tope agotado o rework demostrablemente fútil** — entra aquí si se cumple
   **cualquiera** de estas condiciones:
   - `REJECTED` **sin `failed_workers[]` accionables** (el problema no es de un worker: scope/contrato
     insuficiente, contradicción de fondo); **o**
   - se agotó `rework_loop.max_iterations`; **o**
   - veto de firma `D7=0` (inconsistencia: C se invoca tras la firma); **o**
   - **rework fútil con iteraciones restantes** (criterio determinista, S-028/L-016): aunque haya
     `failed_workers[]` accionables y `rework_loop.iterations < max_iterations`, **no abras otro rework**
     si se cumplen **las tres**: (1) en el rework anterior el worker **ya regeneró el entregable correcto**
     (el defecto vetado por C quedó resuelto en disco tras esa re-invocación — lo confirmas comparando el
     entregable re-emitido con la `recommendation` de C); (2) el **mismo defecto reaparece** en la
     siguiente auditoría; y (3) la reaparición **no es atribuible al worker** sino a una **alteración fuera
     de banda** del entregable (la detectas porque el chequeo de procedencia D-024/R2 vuelve a disparar:
     el manifest en disco diverge del snapshot que A re-presentó). En ese caso re-invocar al worker
     **no puede** corregir la causa (vive fuera de su salida) → es fútil → **HOLD**. Registra en la
     escalación (`context`) la evidencia: el worker corrigió, el defecto volvió, y la causa es ambiental
     (entregable revertido fuera de banda), no del worker.
   **HOLD + escalamiento:**
   1. Si la firma sigue `PENDING`/sin resolver, fija su `audit_result: "REJECTED"` (no consolida).
   2. `phases["010_discovery"].status: "HOLD"`, `phases["010_discovery"].verdict: "REJECTED"`.
   3. Registra en `harness-state.json → escalations[]` un ítem (`phase`, `reason`, `raised_at` real,
      `context` con el detalle del veredicto y por qué no es auto-resoluble, `resolved: false`).
   4. **Detente y escala al humano:** explica el bloqueo concreto y pide guía (revisar el `scope.md`,
      re-aprobar el Sprint Contract, o decidir manualmente). **No sigas en automático.** Añade la línea
      a `project-progress.txt`.

### 7. Conocimiento transversal — `705_knowledge/` (siempre, sin preguntar)
Si durante la corrida hubo **decisiones** (p. ej. una clasificación de slice no obvia, un supuesto
acordado en el gate) o **lecciones**, regístralas **sin preguntar** — es parte del flujo:
- decisiones → `705_knowledge/decisions_library.md` (copia el molde si no existe).
- lecciones → `705_knowledge/lessons_learned.md` (idem).
Si no hubo ninguna, no escribes nada. Añade la línea correspondiente en `project-progress.txt`.

### 8. Versionado autónomo — commit (+ push) del estado firme (T-035)
**Disparador:** este paso corre **solo cuando la fase quedó `PHASE_COMPLETE`** (rama A del paso 6). Si la
fase terminó en `IN_REWORK` o `HOLD`, **no llegas aquí** (esas ramas vuelven al gate o se detienen) →
**nunca commitees un draft o un manifest rechazado**. El otro disparador del motor es la re-firma del
Modo Ajuste (`/caden-change`, `vN+1`); fuera de esos dos momentos, no hay commit autónomo.

1. **Lee `.caden/config.json`** (bloque `git`). Decide:
   - **Sin `.caden/config.json`**, o **`git.local_versioning == false`**, o **`git` ausente del PATH** →
     registra una nota en `project-progress.txt` ("versionado git omitido: <razón>") y **salta al paso 9**
     (no bloquees el cierre).
   - En otro caso, continúa.
2. **Commit local** (siempre que el versionado esté ON; no depende del remoto):
   - `git add -A`.
   - Si **no hay cambios** que commitear (`git status --porcelain` vacío), regístralo y salta a 4.
   - `git commit -m "<mensaje>"` con un mensaje claro, p. ej.:
     `caden(010_discovery): PHASE_COMPLETE — roadmap v<version> de <project>`
     (toma `<version>` del `roadmap-manifest.json` y `<project>` de `harness-state.json`). El commit
     incluye el estado firme completo: `deliverables/`, `eval/`, `705_knowledge/`, `harness-state.json` y
     `010_discovery/execution-state.json`.
   - Captura el hash corto (`git rev-parse --short HEAD`) y déjalo en la bitácora.
3. **Push (opt-in)** — solo si **`git.push == true`**:
   - Verifica que exista `origin` (`git remote get-url origin`). Si **falta** → nota ("push activado pero
     sin remoto; commit queda local") y salta a 4 (no bloquees).
   - `git push -u origin <git.branch>` (por defecto `main`). **Si falla**, **reintenta una vez**; si vuelve
     a fallar (auth, red, rechazo del remoto) → **no bloquees la fase**: el commit queda **local**, avisa
     al humano (sugiere revisar el credential helper: `gh auth login` / Git Credential Manager / SSH) y
     registra la nota en la bitácora. El push no es condición de `PHASE_COMPLETE`.
   - Si `git.push == false`, no hagas push (versionado solo local).
4. **Traza:** añade a `project-progress.txt` una línea con el resultado (hash del commit + estado del push:
   `pushed` / `local-only: <razón>` / `omitido: <razón>`) y marca `updated_at`.

> **Credenciales (sin secretos).** El push usa el credential helper **ambiental** ya configurado en la
> máquina; el motor **no** guarda ni pide tokens. **Nunca** uses `--force` ni reescribas el historial.

### 9. Cierre
Reporta al humano: estado final de la fase, paths de los artefactos producidos
(`deliverables/`, `eval/`, `705_knowledge/`), el veredicto y el **resultado del versionado** (commit local
y, si aplica, push). Cierra la bitácora `project-progress.txt` y marca `updated_at` en ambos estados.

**Handoff accionable al Arnés 2 (DA-8, D-028).** Solo si la fase quedó `PHASE_COMPLETE`: indícale al
humano el **siguiente paso concreto** — *"Discovery cerró. Para continuar con la **Arquitectura**:
ejecuta `/caden-architect` y luego **reinicia Claude Code** (su 1.ª corrida provisiona los agentes del
Arnés 020; tras reiniciar, vuelve a ejecutar `/caden-architect` para arrancar la fase)."* **No intentes
correr el 020 en caliente** ni promover agentes tú mismo: el 020 vive **latente** en
`.caden/harnesses/020_architecture/` y solo `/caden-architect` lo promueve (sus agentes no están
cargados en esta sesión). Si el humano prefiere, `/caden-continue` también lo **redirige** a
`/caden-architect` en esta costura (D-037).

## Reglas inviolables
- **Tú eres el único que spawnea** (modelo plano): B/workers/C no se invocan entre sí.
- **No firmes por el humano:** la firma (D7) es suya; sin ella, C veta.
- **No auto-repares entregables (D-024):** A es Governor, no worker. Nunca edites el manifest ni los
  `slices/<id>.md` a mano. La **validez** la audita **C** (rework/HOLD); tu chequeo del gate es de
  **procedencia** (snapshot `CP-03.manifest_sha256`), no de validez. Ante divergencia: re-presenta y
  re-firma, no restaures por tu cuenta.
- **Persiste el estado en cada checkpoint:** `harness-state.json` (transversal) y `execution-state.json`
  (táctico) son la fuente de verdad de la corrida.
- **Commit/push autónomo solo en `PHASE_COMPLETE` (T-035):** nunca commitees un draft, un manifest en
  rework o un `HOLD`. El push es **opt-in** (`config.git.push`) y su fallo **no bloquea** la fase (el
  commit queda local + aviso). Nunca uses `--force`.
- **Respeta los planos:** escribe solo en el runtime del cliente; nunca en `720_build/` ni en
  `800_persistence/`.
