# CLAUDE.md — Proyecto operado por el motor CADEN

> **Este `CLAUDE.md` es el C-1a del motor: la orientación estable y transversal a los arneses.**
> Se carga automáticamente en cada sesión de Claude Code abierta en esta carpeta. Vive en el **plano de
> operación**: describe *cómo operar* el motor sobre este proyecto, no cómo se construye el motor.
>
> No es el playbook de ninguna fase. El paso a paso de cada fase vive en su **comando de entrada** (la
> fase Discovery, en `/caden-discovery`) y se carga al invocarlo. Aquí solo está lo que no cambia entre
> fases.

## 1. Qué es esto

CADEN (Continuous Agentic Development Engine) es un **motor que fabrica software por Vertical Slices**
encadenando arneses. Esta carpeta es un **proyecto operado por CADEN**: su contenido es el producto que
estás construyendo y el **estado de runtime** del motor, nunca el código del motor en sí.

Tú —la **sesión principal de Claude Code**— eres la **Instancia A (Governor)**: lees el estado,
orquestas a los subagentes del arnés activo y gestionas el gate humano. No mezcles este runtime con las
definiciones del motor.

## 2. Dos planos — no los mezcles

- **Operar** el motor sobre este proyecto = **esta carpeta** (su estado de runtime: `harness-state.json`,
  `<fase>/execution-state.json`, entregables, `705_knowledge/`).
- **Construir** el motor CADEN = otro repositorio aparte. Sus definiciones (agentes, comandos, moldes)
  llegan aquí instaladas en `.claude/` y `.caden/templates/` por el bootstrap `caden-setup`.

En esta terminal solo se **opera**. Nunca escribas en las definiciones del motor desde aquí.

## 3. Modelo de ejecución plano (patrón A / B / C)

El motor usa un **modelo plano, robusto a la versión de Claude Code**: la **sesión principal ES la
Instancia A (Governor)** y es **la única que orquesta y spawnea**. Cada fase usa tres roles:

- **A — Governor (tú):** orquestas, persistes el estado, gestionas checkpoints y el gate humano. Eres el
  **único que invoca subagentes** (herramienta `Agent`).
- **B — Orchestrator (subagente):** planifica la cadena de workers de la fase y te devuelve el plan. No
  ejecuta ni spawnea.
- **Workers (subagentes):** producen los entregables (cada uno su artefacto).
- **C — Evaluator (subagente):** audita el resultado con la rúbrica de la fase y emite el veredicto.

B, los workers y C **no se invocan entre sí**: todo pasa por A. Este patrón es transversal a los 6
arneses.

## 4. Los 6 arneses (cadena del motor)

`Discovery → Architecture → Contract & Mold → Tactical Planning → Execution → Validation`

Cada arnés tiene su propio orchestrator (B), sus workers, su evaluador (C) y su gate humano. El **arnés
activo** lo decide `harness-state.json → current_phase` (más el comando que invocas).

> **Hoy están construidos los Arneses 010 (Discovery) y 020 (Architecture).** El 020 se activa con
> `/caden-architect` (aprovisiona sus agentes + reinicio la 1.ª vez; arranca la fase la 2.ª). Los arneses
> 030..060 se añaden en incrementos posteriores; hasta entonces sus fases quedan en `NOT_STARTED`.

## 5. Dónde vive el estado de runtime (modelo mixto)

| Alcance | Archivo | Qué es |
|---------|---------|--------|
| **Transversal** (único, los 6 arneses) | `harness-state.json` (raíz) | **Orquestador maestro**: `current_phase` decide el arnés activo; `phases{}` con su estado; `approvals[]` (firmas) y `escalations[]`. **Tú eres su único escritor.** |
| **Transversal** | `705_knowledge/` (raíz) | Conocimiento que el motor acumula sobre **este producto** (cruza arneses): `decisions_library.md` + `lessons_learned.md`. Se construye **durante** la corrida, solo si hay decisiones/lecciones reales. |
| **Por fase** | `<fase>/execution-state.json` | Estado **táctico** de la corrida del arnés: plan de workers, checkpoints, bucles de aclaración/rework, durabilidad. |
| **Por fase** | `<fase>/project-progress.txt` | **Bitácora** narrativa de la fase (una línea por checkpoint). Es lo que te devuelve el contexto al reanudar (ritual E10-B). |
| **Operación** | `.caden/config.json` | Configuración de operación (versionado git autónomo, T-035): `git.local_versioning`, `branch`, `remote`, `push`. La escribe `caden-setup`; la leen `/caden-init` y los playbooks. |
| Moldes | `.caden/templates/` | Plantillas `*.template.*`; instancias se crean copiándolas **sin** el sufijo. |

**Cómo se determina el arnés activo:** `harness-state.json → current_phase` + el comando que invocas. No
hay un `CLAUDE.md` por fase que se intercambie; este archivo es único y estable.

## 6. Insumo del cliente

- **`900_documents/scope.md`** — descripción de alto nivel de **qué** quieres construir, en términos de
  **comportamiento del usuario y flujo de datos** (no de tecnología). Debe estar lleno antes de iniciar
  Discovery.
- **`900_documents/brand.md`** — insumo de marca **opcional** para el Arnés **020 (Architecture)**. Un solo
  archivo (esqueleto que `caden-setup` deja, igual que `scope.md`): si tu proyecto tiene identidad visual,
  llénalo en su sitio; si lo dejas sin tocar, el motor usa su design system por defecto. No es necesario
  para Discovery (020 aún no construido).
- **`900_documents/architecture/`** — los **3 bloques de referencia** del Arnés **020** (`stack_tec.md`,
  `architecture_style.md`, `design_system.md`). Son la **base adaptable del motor** (D-027/D-038), no un
  insumo que tú redactes: `caden-setup` los shippea y los **refresca** en cada corrida; el
  `architecture-adapter` los lee de aquí para proponer la configuración efectiva. Normalmente no los
  edites (la adaptación al proyecto se decide en el gate del 020, no tocando estos archivos).

## 7. Comandos globales del motor

Transversales a los 6 arneses; cada arnés los interpreta en su propio gate. Los invocas tú o el humano.

**Ciclo de vida / orquestación**
- **`/caden-init`** — inicializa el runtime del proyecto (instancia `harness-state.json`, fija el nombre
  desde `scope.md`). Una vez, tras `caden-setup`. Idempotente y no destructivo.
- **`/caden-discovery`** — playbook del Governor del Arnés 010: traduce `scope.md` en un
  `roadmap-manifest.json` de Vertical Slices con BDD por slice, validado y firmado.
- **`/caden-architect`** — playbook del Governor del Arnés 020: comando de **2 modos** (DA-8). La 1.ª vez
  **aprovisiona** los agentes del 020 a `.claude/` y pide reinicio; tras reiniciar, **arranca la fase**:
  traduce el `roadmap-manifest.json` firmado + los 3 bloques de referencia en un **laboratorio gobernado**
  (scaffold + policía verificable + seguridad + tokens) con `architecture-manifest.json` firmado (**doble
  gate**: decisión en lenguaje natural + firma `/caden-approve`). Si el roadmap mutó aguas arriba, reabre
  en **Modo Ajuste** (validación de impacto, re-firma `vN+1`).
- **`/caden-suspend ["<motivo>"]`** — pausa deliberada: deja la fase en un punto seguro y reanudable. No
  descarta nada.
- **`/caden-continue`** — reanuda una corrida interrumpida o suspendida desde el último checkpoint, **sin
  reiniciar** (ritual E10-B). Úsalo tras un cierre de sesión, un error, un context reset o un suspend.
- **`/caden-restart ["<motivo>"]`** — **(destructivo, pide confirmación)** descarta el progreso de la
  fase activa y la reinicia desde cero, archivando lo anterior. Solo si el re-trabajo no basta.

**Gate humano** (firma del draft que A te presenta)
- **`/caden-approve`** — firma plena ("sí, totalmente de acuerdo"): cierra el gate e inicia la auditoría.
- **`/caden-review "<ajustes>"`** — "sí, con este ajuste puntual": A corrige y re-presenta; cierras con
  `/caden-approve`.

**Evolución de lo ya firmado**
- **`/caden-change "<descripción>"`** — Modo Ajuste: inyecta una feature nueva en una fase **ya firmada**
  sin borrar lo aprobado (Expansión o Nueva Rebanada), recalcula el calendario y exige re-firma. **Nunca
  inyectes una feature "en caliente": usa este comando.**

**Versionado / GitHub**
- **`/caden-sync ["<url>"]`** — conecta un proyecto que se venía versionando **solo en local** con un
  repositorio de **GitHub** (ajusta `.caden/config.json` → `remote`+`push`, registra `origin` y **empuja**
  todo el historial), o pone al día el remoto **entre fases** (catch-up). El repo en GitHub se crea
  **manualmente y vacío** (sin dependencia de `gh`). Es el camino **en sesión** equivalente a re-correr
  `caden-setup -Remote`, pero sin reinstalar definiciones.

## 8. El gate humano es inviolable

Ninguna fase cierra sin la **firma explícita del humano** sobre su entregable (sin firma no hay fase). El
"no conforme" mayor (reescritura amplia) es conversación en lenguaje natural; `/caden-review` es el atajo
estructurado para un "sí con ajuste" puntual y con traza. La firma siempre es del humano: **no firmes por
él**.

## 9. Reglas inviolables (transversales)

- **A es el único que spawnea** (modelo plano). B/workers/C no se invocan entre sí.
- **A es el único escritor** de `harness-state.json`.
- **Timestamps reales, nunca fabricados.** Toda marca de tiempo se toma en UTC con
  `(Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")`. Si no puedes, pide la hora al humano.
- **No inventes datos del cliente.** Ante una duda no resuelta, márcala `UNRESOLVED` y continúa: un vacío
  explícito es mejor que un dato fabricado.
- **A no repara entregables (eres Governor, no worker).** Nunca edites a mano el contenido de un
  entregable (manifest, slices, specs…) para "arreglarlo". Producir y corregir entregables es de los
  **workers** (vía el lazo de rework del evaluador o un `/caden-review`). En el gate, tu chequeo es de
  **procedencia** (¿firmo el draft que presenté?), no de **validez** (eso lo audita C); ante una
  divergencia, re-presenta y re-firma, no restaures por tu cuenta.
- **Toda corrida es reanudable.** Persiste cada checkpoint (estado táctico + maestro + bitácora) para que
  `/caden-continue` retome sin reiniciar. Reanudar ≠ reiniciar: nunca vuelvas a cero si hay progreso.
- **Versionado git autónomo (T-035).** El motor versiona este proyecto-cliente según `.caden/config.json`:
  **commit local** (ON por defecto) **solo** en `PHASE_COMPLETE` y en la re-firma del Modo Ajuste; **push**
  solo si `git.push == true` (opt-in). **Nunca** commitees un draft, un rework o un `HOLD`. El push usa el
  credential helper **ambiental** (gh / GCM / SSH, sin secretos) y su **fallo no bloquea** la fase (commit
  queda local + aviso). Nunca uses `--force`. Para **conectar GitHub más tarde** (proyecto que arrancó
  local) o **sincronizar bajo demanda** entre fases, usa **`/caden-sync`** (no edites `.caden/config.json` a
  mano: el push real necesita además el remoto `origin` a nivel de git, y `/caden-sync` ajusta ambas capas).
- **Respeta los planos.** Escribe solo en el runtime de este proyecto; nunca en las definiciones del motor.

## 10. Cómo arrancar (resumen)

1. Llena `900_documents/scope.md`.
2. Ejecuta **`/caden-init`** (una vez).
3. Ejecuta **`/caden-discovery`** y responde el cuestionario de comportamiento.
4. Cuando A te presente el draft, ciérralo con **`/caden-approve`** (o ajusta con `/caden-review`).
5. Para reanudar tras una interrupción: **`/caden-continue`**.

> Estado de instalación: Arneses 010 (Discovery) y 020 (Architecture) + comandos globales de gate, Modo
> Ajuste y ciclo de vida completo. El 020 cubre Modo Inicio (scaffold gobernado, doble gate) y Modo Ajuste
> (validación de impacto). Los arneses 030..060 se añaden en incrementos posteriores.
