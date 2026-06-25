# Sprint Contract — 020 Architecture (PLANTILLA)

> **C-8 del arnés 020.** Molde (plano de construcción, L-001). La **instancia** la produce **A
> (Governor)** en runtime escribiéndola en **`020_architecture/contract/sprint_contract.md`**: rellena los
> `<campos>`, la **propone al humano** y requiere **aprobación explícita en lenguaje natural** antes de
> invocar a B (gate de arranque P5, D-023). Base: `705_design/020_architecture.md` §9.
>
> **No confundir los gates.** Este arnés tiene **tres** momentos de aprobación humana:
> 1. **Gate de arranque (P5):** aprobar este Sprint Contract — **lenguaje natural**, NO `/caden-approve`.
> 2. **Gate de decisión (CP-01g):** cerrar D-A (auth), D-G (modo ORM, checklist §5.1), D-N (topología,
>    §2.5), opt-in de versión al filo (D-C) y los escapes del estilo — **lenguaje natural**,
>    *antes* de andamiar (DA-4).
> 3. **Gate de firma (CP-04):** firmar el laboratorio construido — **`/caden-approve`** (solo este firma
>    el `architecture-manifest.json` con snapshot `sha256`, D-024/R2).

```
SPRINT CONTRACT — 020 Architecture (CADEN)
==========================================
Objetivo : Traducir el roadmap-manifest.json firmado (010) + el stack/estilo/identidad de referencia
           (adaptados al proyecto y firmados) en un laboratorio gobernado — scaffold de 4 capas + frontend
           por features + dependencias + policía verificable + línea base de seguridad + manual de agente +
           tokens de design system — con un commit base. Sin lógica de negocio.
Fase     : 020 — Architecture / Gobernanza Técnica Global
Modo     : <INICIO | AJUSTE | CONTINUACIÓN>

ENTRADAS del harness (lo que consume):
  - Roadmap firmado (010)   : 010_discovery/deliverables/roadmap-manifest.json + .../slices/*.md
  - Bloques de referencia   : stack / estilo / design system (base adaptable, D-027)
  - Marca (opcional)        : 900_documents/brand.md  (si vacío → design system por defecto)
  - Statement / metodología : (referencia de método del motor)
  - (Modo Ajuste) Cambio    : roadmap mutado por /caden-change (Validación de Impacto, DA-6)

ENTREGABLES de salida del harness (lo que produce):
  - 020_architecture/deliverables/effective_config.md          : configuración efectiva + decisiones abiertas
  - 020_architecture/deliverables/architecture-manifest.json   : artefacto firmado (salida central, DA-5)
  - 020_architecture/deliverables/scaffold_report.md           : inventario del scaffold + arranque/compilación
  - 020_architecture/deliverables/policy_verification.md       : verificación demostrada del policía + anti-SQLi
  - 020_architecture/deliverables/impact_report.md             : (solo Modo Ajuste) dictamen de impacto
  - 020_architecture/eval/verdict.json                         : veredicto de auditoría (rúbrica D1–D8)
  - 020_architecture/eval/metrics_summary.json                 : resumen cuantitativo de la evaluación
  - Scaffold del producto (en la RAÍZ)                         : src/, app/, manifiestos, docker-compose, policía, .clinerules, tokens
  - 705_knowledge/decisions_library.md, lessons_learned.md     : decisiones/lecciones (transversal; siempre que las haya)
  Handoff: laboratorio gobernado + architecture-manifest.json firmado → Arnés 3 (Contract & Mold).

Instancias:
  - A (Governor)     : gobierna el sprint, propone este contrato y opera el DOBLE gate (sesión principal)
  - B (Orchestrator) : planifica/secuencia la fase — architecture-orchestrator
  - C (Evaluator)    : audita con la rúbrica D1–D8 y RE-VERIFICA (D-032) — architecture-evaluator

Workers (secuenciales — EJECUTAN, D-031):
  - architecture-adapter   → 020_architecture/deliverables/effective_config.md   (+ gate de decisión CP-01g)
  - scaffold-builder       → scaffold en la raíz + scaffold_report.md            (deps + tokens; entorno arranca)
  - governance-weaver      → policía + seguridad + .clinerules + policy_verification.md  (verificación demostrada)

Gates       : (1) arranque [contrato, lenguaje natural]  (2) decisión [cierra D-A/D-G/D-N/D-C/escapes, lenguaje natural]
              (3) firma [/caden-approve, sobre el laboratorio]
Checkpoints : CP-00, CP-01, CP-01g, CP-02, CP-03, CP-03r, CP-04

Checkpoints (qué marca cada uno):
  - CP-00   : Inicialización — roadmap firmado + 3 bloques leídos, estado creado, modo fijado
  - CP-01   : Configuración efectiva — effective_config.md (config propuesta + decisiones abiertas)
  - CP-01g  : Gate de decisión — humano cierra D-A (auth) + D-G (modo ORM) + D-N (topología) + opt-in D-C + escapes; sin esto NO se andamia (P5)
  - CP-02   : Scaffold construido — árbol + manifiestos + deps + tokens; entorno arranca/compila
  - CP-03   : Gobernanza tejida — policía + seguridad + .clinerules + verificación; manifest draft + sha256
  - CP-03r  : Reproceso por /caden-review — ajustes del humano aplicados y re-presentados (recalcula sha256)
  - CP-04   : Firma humana — /caden-approve (compara sha256, D-024/R2); commit base; habilita la auditoría de C

Criterio Done:
  (1) Humano cierra las decisiones abiertas (D-A auth + D-G modo ORM + D-N topología + opt-in D-C + escapes) en el gate de decisión
  (2) Humano firma /caden-approve la configuración efectiva + laboratorio
  (3) Scaffold = estilo efectivo (4 capas backend + features frontend), vacío de negocio
  (4) Policía VERIFICADO: una violación de capa (domain→infrastructure) es bloqueada (demostrable, veto D2)
  (5) Línea base de seguridad activa y verificable (anti-SQLi demostrado; 6 vectores del brief §8, veto D4)
  (6) Dependencias del stack efectivo instaladas; entorno arranca/compila limpio
  (7) Manual de agente (.clinerules) + design system (tokens claro+oscuro, marca/default, WCAG AA)
  (8) Commit base + architecture-manifest.json persistido y trazable (P8)
  (9) [Modo Ajuste] feature validada contra la gobernanza; molde nuevo provisionado y re-firmado sin re-andamiar (D8)

Riesgos:
  - Base adaptable mal aplicada (imponer/arrastrar piezas sin verificar — D-027)
  - Policía/seguridad declarativos pero inertes (configurados sin verificar bloqueo)
  - D-A sin cerrar contamina los arneses aguas abajo
  - Andamiar de más (E4) ; versiones recientes sin verificar (brief §7)
  - Confusión de planos (laboratorio del cliente vs. memoria de construcción)

Aprobación del contrato (gate de arranque P5):
  - Propuesto por A   : <iso8601>
  - Aprobado por      : <nombre / rol del humano>
  - Fecha aprobación  : <iso8601>

Próxima acción: A invoca a B (architecture-orchestrator) y luego a architecture-adapter con el roadmap + 3 bloques
```
