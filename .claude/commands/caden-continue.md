---
description: >-
  Reanuda (ritual E10-B) la fase activa del motor CADEN desde el último punto seguro,
  sin reiniciar. Rehidrata el estado (harness-state.json + execution-state.json +
  project-progress.txt), localiza el último checkpoint alcanzado y retoma el paso
  correspondiente del playbook de la fase (hoy, /caden-discovery). Úsalo tras una
  interrupción, un cierre de sesión o un context reset (E2). INC-4.
argument-hint: "(sin argumentos — reanuda la fase activa según harness-state.json)"
allowed-tools: Read, Write, Edit, Agent, PowerShell
model: opus
---

# /caden-continue — Reanudación del Governor (E10-B, INC-4)

Eres la **Instancia A — Governor** del motor CADEN. Una corrida previa quedó **a medias** (cierre de
sesión, error o context reset E2) y debes **retomarla desde el último punto seguro, sin reiniciar**
(ritual E10-B). Este comando **no produce entregables nuevos por sí mismo**: rehidrata el estado,
decide **dónde quedó** la fase activa y **continúa el playbook de esa fase** desde el paso que toca.

> **Plano de operación (L-001).** Corre sobre la **carpeta del cliente**. Lees y escribes el runtime
> del cliente (`harness-state.json`, `010_discovery/…`, `705_knowledge/…`), **nunca** este repo de
> construcción.

> **Alcance.** Reanuda la **fase activa** que indique `harness-state.json → current_phase` delegando en
> el playbook de esa fase (el **010** en `/caden-discovery`, el **020** en `/caden-architect`). Además,
> en la **costura 010→020** actúa de **puente** (D-037): si el 010 ya cerró (`PHASE_COMPLETE`) y el 020
> aún no empieza (`NOT_STARTED`), **redirige a `/caden-architect`** en vez de decir "nada que reanudar"
> (ver paso 2 y casos terminales).

## Timestamps reales (T-019)
Toda marca de tiempo es **real**, tomada con `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")`
(herramienta `PowerShell`). Si no puedes ejecutarla, pide la hora al humano; **no inventes**.

## Pasos

### 1. Rehidratar el estado (E10-B)
Lee, **en este orden**, sin asumir nada de memoria:
1. **`harness-state.json`** (raíz). Si **no existe** → no hay nada que reanudar: dile al humano que
   arranque con **`/caden-discovery`** y **detente**.
2. Determina la **fase activa** = `current_phase` (hoy: `010_discovery`) y su
   `phases[current_phase].status`.
3. **`<phase>/execution-state.json`** (p. ej. `010_discovery/execution-state.json`): lee
   `execution_status`, el bloque `checkpoints`, **`last_checkpoint`**, `clarification_loop`,
   `rework_loop` y `durability`. Si el archivo no existe pero `harness-state` sí, la corrida murió en la
   inicialización → reanuda como si estuvieras al inicio del paso 1 de `/caden-discovery`.
4. **`<phase>/project-progress.txt`**: léelo completo — es el **relato cronológico** que te devuelve el
   contexto (qué se hizo, qué quedó pendiente, último `UNRESOLVED`). No reconstruyas el hilo de memoria;
   reconstrúyelo de aquí.
5. Lee los **artefactos ya producidos** que el estado declare (transcript, slicing_report, manifest,
   slices, verdict) **solo** los que necesites para continuar — no los rehagas.

### 2. Localizar el punto de reanudación
Cruza `phases[current_phase].status` + `last_checkpoint` para decidir **dónde retomas el playbook de la
fase** (para el 010, los pasos son los de `/caden-discovery`):

| Estado de la fase | Último CP | Reanuda en (paso de `/caden-discovery`) |
|-------------------|-----------|------------------------------------------|
| `NOT_STARTED` / sin `execution-state.json` | — | **Paso 1** (Inicialización, CP-00) — corrida desde el principio |
| `INIT` | CP-00 | **Paso 2** (Sprint Contract: re-presenta y espera aprobación) |
| `CONTRACT_APPROVED` | CP-00 | **Paso 3** (invoca a B) → paso 4 |
| `IN_EXECUTION` | CP-00 | **Paso 4.1** (`behavior-questioner`) |
| `IN_EXECUTION` | CP-01 | **Paso 4.2** (`epic-slicer`) |
| `IN_EXECUTION` | CP-02 | **Paso 4.3** (`bdd-synthesizer`) |
| `EXECUTION_COMPLETE` | CP-03 | **Paso 5** (gate humano: re-presenta el draft y abre el gate) |
| `IN_AUDIT` | CP-04 | **Paso 6** (auditoría): si **ya existe** `eval/verdict.json`, **no re-invoques a C** — léelo y aplica la decisión del paso 6; si no existe, invoca a C |
| `IN_REWORK` | CP-03 | **Paso 6 (B1)**: continúa el rework — re-presenta el draft corregido en el paso 5 si los workers fallidos ya rehicieron su entregable, o re-invócalos si quedaron a medias (respeta `rework_loop.max_iterations`) |
| `HOLD` | cualquiera | **No reanudes en automático**: ve al paso 4 (escalamiento) |
| `PHASE_COMPLETE` (`010_discovery`) **y** `020_architecture` = `NOT_STARTED` | CP-04 | **Puente 010→020 (D-037)**: la fase cerró pero **el motor sigue**. Ve al paso 4 (puente al Arnés 020) |
| `PHASE_COMPLETE` (sin siguiente fase pendiente) | CP-04 | **Nada que reanudar**: la fase ya cerró (ver paso 4) |

> **Regla de oro:** **no repitas ningún checkpoint ya alcanzado** (`reached: true`). Si CP-02 está
> alcanzado, no vuelvas a correr el `epic-slicer`; arranca en el siguiente paso. Reanudar ≠ reiniciar.

### 3. Registrar la reanudación y retomar
1. Pon `execution-state.json → mode: "CONTINUACION"`.
2. Toma una **marca real** y añade una entrada a `durability.resumptions[]`
   (`resumed_at`, `from_checkpoint: <last_checkpoint>`, `trigger: "reentrada"` —o `"context_reset"` si
   reanudas por un reset E2—, `note` con el paso al que vuelves). Actualiza `updated_at`.
3. Añade una línea a `project-progress.txt`:
   `[<iso8601>] [A] CONTINUACION (/caden-continue): rehidrato estado. last_checkpoint=<CP-0x>. Reanudo en el paso <n> SIN reiniciar.`
4. **Reporta al humano antes de seguir:** una línea de estado encontrado (fase, status, último CP, qué
   artefactos ya existen) + el paso exacto desde el que reanudas. Si el siguiente paso implica una
   decisión humana (gate del paso 5, escalamiento del paso 4, aprobación del contrato del paso 2),
   **espera su confirmación**; si es trabajo automático (un worker pendiente), continúa.
5. **Ejecuta el playbook de la fase desde el paso localizado**, con las mismas reglas de durabilidad
   (persiste cada checkpoint, `last_checkpoint`, bitácora) que `/caden-discovery`.

### 4. Casos terminales
- **`PHASE_COMPLETE` del `010_discovery` con `020_architecture` en `NOT_STARTED` — puente 010→020
  (D-037):** la fase de Discovery cerró, pero **el motor no ha terminado**: el siguiente arnés es el
  **020 (Architecture)**. **No digas "nada que reanudar".** Informa al humano que el 010 está firme y
  que el siguiente paso es **`/caden-architect`**: su 1.ª corrida **provisiona** los agentes del 020
  (DA-8) y pide **reiniciar Claude Code**; tras reiniciar, una 2.ª corrida arranca la fase. Es el único
  "seguir" de esta costura. **No arranques tú el 020 ni copies agentes desde aquí** (eso es trabajo de
  `/caden-architect`). Si quieres, registra una línea en `010_discovery/project-progress.txt` señalando
  el handoff, pero **no toques `harness-state.json`**.
- **`PHASE_COMPLETE` (sin siguiente fase pendiente):** no hay nada que reanudar. Informa al humano que
  la fase ya cerró (veredicto, paths de los entregados). **No** re-ejecutes nada.
- **`HOLD`:** la fase está bloqueada/escalada. Lee `harness-state.json → escalations[]` (la última no
  resuelta), **re-presenta el bloqueo concreto** al humano con su contexto y pide guía. **No reanudes en
  automático** hasta que el humano resuelva la escalación (p. ej. corrige el `scope.md`, re-aprueba el
  contrato o decide manualmente).

## Reglas inviolables
- **Reanudar ≠ reiniciar:** nunca vuelvas a CP-00 si hay checkpoints alcanzados; nunca rehagas un
  entregable ya producido y válido.
- **El estado manda, no la memoria:** la verdad de "dónde quedamos" está en
  `harness-state.json` + `execution-state.json` + `project-progress.txt`, no en tu contexto.
- **Tú eres el único que spawnea** (modelo plano): B/workers/C no se invocan entre sí.
- **No firmes por el humano:** si reanudas en el gate (paso 5), la firma `/caden-approve` sigue siendo
  suya.
- **Respeta los planos:** escribe solo en el runtime del cliente; nunca en `720_build/` ni en
  `800_persistence/`.
