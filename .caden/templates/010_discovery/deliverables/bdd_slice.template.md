<!--
PLANTILLA (C-8, plano de construccion, L-001). UN Markdown BDD por slice. La instancia la produce el
worker bdd-synthesizer en runtime: /010_discovery/deliverables/slices/<slice-id>.md. Los <...> son marcadores.
El manifest referencia este archivo por bdd_path. Debe tener >=1 escenario Gherkin (D4) + seccion de
restricciones no funcionales (D5).
-->

# Slice `<slice-id>` — `<nombre de la slice>`

- **Tipo (banda):** `<tracer_bullet | stabilization | mvp | evolution | final>` · **band_index:** `<null | n>`
- **Orden:** `<n>` · **Depende de:** `<[slice-ids] | ninguna>`
- **Comportamiento:** `<resumen en una frase del comportamiento del usuario / flujo de datos>`

## Escenarios BDD (Gherkin)

```gherkin
Feature: <capacidad observable de esta slice>

  Scenario: <caso principal>
    Given <contexto/estado inicial>
    When <accion del usuario o evento>
    Then <resultado observable esperado>

  Scenario: <caso alterno o de borde>
    Given <...>
    When <...>
    Then <...>
```

> Mínimo **1 escenario** no ambiguo por slice (rúbrica D4). Añade escenarios de borde/fallo cuando el
> comportamiento lo exija (la cobertura de fallos alimenta a los arneses siguientes).

## Restricciones no funcionales (ligadas a este comportamiento)

> Sección obligatoria (rúbrica D5). Lista solo las restricciones **atadas a esta slice**, no genéricas.

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| `<rendimiento\|seguridad\|disponibilidad\|usabilidad\|datos\|…>` | `<restriccion concreta>` | `<como se comprueba>` |

## Notas / decisiones abiertas

- `<contradicciones pendientes, supuestos, o UNRESOLVED del cuestionario, si aplica>`
