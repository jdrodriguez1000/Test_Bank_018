# Sprint Contract — 010 Discovery

> Instancia del C-9 del arnés 010, producida por A (Governor) y presentada al humano para
> aprobación explícita en lenguaje natural (gate de arranque P5). Este gate **no** usa
> `/caden-approve` (ese comando firma el `roadmap-manifest.json` en el paso 5).

```
SPRINT CONTRACT — 010 Discovery (CADEN)
=======================================
Proyecto : Reservas Sala Comunitaria
Objetivo : Traducir el scope.md del cliente en un roadmap-manifest.json de Vertical Slices MECE
           con BDD por slice y restricciones no funcionales, validado y firmado (/caden-approve).
Fase     : 010 — Discovery / Co-Diseño (Engine BDD)
Modo     : INICIO

ENTRADAS del harness (lo que consume):
  - Insumo de operación    : 900_documents/scope.md  (app de reservas de la sala comunitaria de un edificio)
  - Statement de CADEN     : (referencia de método del motor)
  - Metodología/principios : (referencia de método del motor)

ENTREGABLES de salida del harness (lo que produce):
  - 010_discovery/deliverables/behavior_transcript.md   : comportamiento y flujo de datos levantados
  - 010_discovery/deliverables/slicing_report.md        : slicing MECE en bandas + dependencias
  - 010_discovery/deliverables/roadmap-manifest.json    : Vertical Slices MECE en bandas (salida central)
  - 010_discovery/deliverables/slices/<slice-id>.md     : un BDD (Gherkin + no funcionales) por slice
  - 010_discovery/eval/verdict.json                     : veredicto de auditoría (rúbrica D1–D8)
  - 010_discovery/eval/metrics_summary.json             : resumen cuantitativo de la evaluación
  - 705_knowledge/decisions_library.md, lessons_learned.md : decisiones/lecciones (transversal; si las hay)
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

Riesgos:
  - Slicing no-MECE envenena los Arneses 3–6
  - Compromiso prematuro (E11): fijar el plan antes de explorar la amplitud
  - Confusión de planos (construcción vs. operación del motor)
  - El scope incluye una ambigüedad deliberada ("reservas justas entre vecinos") → posible bucle de aclaración

Aprobación del contrato (gate P5):
  - Propuesto por A   : 2026-06-25T12:19:11Z
  - Aprobado por      : Triple S <110043648+jdrodriguez1000@users.noreply.github.com>
  - Fecha aprobación  : 2026-06-25T12:20:50Z

Próxima acción: A invoca a B (discovery-orchestrator) y luego a behavior-questioner con el scope.md
```
