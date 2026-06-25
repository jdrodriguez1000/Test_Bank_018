# Sprint Contract — 010 Discovery (PLANTILLA)

> **C-9 del arnés 010.** Molde (plano de construcción, L-001). La **instancia** la produce **A
> (Governor)** en runtime escribiéndola en **`010_discovery/contract/sprint_contract.md`**: rellena los
> `<campos>`, la **propone al humano** y requiere **aprobación explícita en lenguaje natural** antes de
> invocar a B (gate de arranque P5). Base: `705_design/010_discovery.md` §9.
>
> Cómo se usa: A copia este molde a `010_discovery/contract/sprint_contract.md`, sustituye cada `<…>`
> por el valor del sprint concreto, lo presenta al humano y solo continúa con su "sí" explícito. **Este
> gate de arranque NO usa `/caden-approve`:** ese comando es solo para la firma del
> `roadmap-manifest.json` (gate del paso 5). No confundir los dos gates.

```
SPRINT CONTRACT — 010 Discovery (CADEN)
=======================================
Objetivo : Traducir el scope.md del cliente en un roadmap-manifest.json de Vertical Slices MECE
           con BDD por slice y restricciones no funcionales, validado y firmado (/caden-approve).
Fase     : 010 — Discovery / Co-Diseño (Engine BDD)
Modo     : <INICIO | AJUSTE | CONTINUACIÓN>

ENTRADAS del harness (lo que consume):
  - Insumo de operación    : 900_documents/scope.md  (descripción de alto nivel del cliente)
  - Statement de CADEN     : (referencia de método del motor)
  - Metodología/principios : (referencia de método del motor)
  - (Modo Ajuste) Cambio   : <descripción pasada a /caden-change>

ENTREGABLES de salida del harness (lo que produce):
  - 010_discovery/deliverables/behavior_transcript.md   : comportamiento y flujo de datos levantados
  - 010_discovery/deliverables/roadmap-manifest.json    : Vertical Slices MECE en bandas (salida central)
  - 010_discovery/deliverables/slices/<slice-id>.md     : un BDD (Gherkin + no funcionales) por slice
  - 010_discovery/eval/verdict.json                     : veredicto de auditoría (rúbrica D1–D8)
  - 010_discovery/eval/metrics_summary.json             : resumen cuantitativo de la evaluación
  - 705_knowledge/decisions_library.md, lessons_learned.md : decisiones/lecciones (transversal; siempre que las haya)
  Handoff: roadmap-manifest.json firmado → Arnés 2 (Architecture).

Instancias:
  - A (Governor)     : gobierna el sprint, propone este contrato y opera el gate (sesión principal)
  - B (Orchestrator) : planifica/secuencia la fase — discovery-orchestrator
  - C (Evaluator)    : audita con la rúbrica D1–D8 — discovery-evaluator

Workers (secuenciales):
  - behavior-questioner  → 010_discovery/deliverables/behavior_transcript.md
  - epic-slicer          → 010_discovery/deliverables/slicing_report.md   (slicing MECE + bandas; bucle de aclaración)
  - bdd-synthesizer      → 010_discovery/deliverables/roadmap-manifest.json + .../slices/<slice-id>.md

Checkpoints (qué marca cada uno):
  - CP-00  : Inicialización — scope.md leído, estado creado, modo fijado
  - CP-01  : Comportamiento levantado — behavior_transcript.md escrito
  - CP-02  : Slicing producido — slicing_report.md (slices MECE en bandas, orden y dependencias)
  - CP-03  : Borrador de salida listo — roadmap-manifest.json + slices/*.md (draft)
  - CP-03r : Reproceso por /caden-review — ajustes del humano aplicados y re-presentados
  - CP-04  : Firma humana — /caden-approve registrado; habilita la auditoría de C

Criterio Done:
  (1) Humano firma /caden-approve el plan de slices con sus BDD
  (2) Sin contradicciones nuevas en 2 rondas consecutivas
  (3) Slices MECE en bandas (Tracer→[Stab]→MVP→[Evol]→Final, 3 anclas obligatorias) con orden de dependencia
  (4) Cada slice con ≥1 escenario BDD + sección de restricciones no funcionales
  (5) Toda Épica detectada quedó triturada (ninguna slice excede una rebanada)
  (6) [Modo Ajuste] cambio reflejado sin borrar lo aprobado, calendario reordenado y re-firmado

Riesgos:
  - Slicing no-MECE envenena los Arneses 3–6
  - Compromiso prematuro (E11): fijar el plan antes de explorar la amplitud
  - Confusión de planos (construcción vs. operación del motor)

Aprobación del contrato (gate P5):
  - Propuesto por A   : <iso8601>
  - Aprobado por      : <nombre / rol del humano>
  - Fecha aprobación  : <iso8601>

Próxima acción: A invoca a B (discovery-orchestrator) y luego a behavior-questioner con el scope.md
```
