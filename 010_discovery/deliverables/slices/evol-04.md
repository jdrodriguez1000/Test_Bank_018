# Slice `evol-04` — `Vista dedicada de historial de uso`

- **Tipo (banda):** `evolution` · **band_index:** `4`
- **Orden:** `10` · **Depende de:** `[mvp-01, stab-04]`
- **Comportamiento:** (Diferido declarado) Vista dedicada del historial de uso de la sala (quién la usó) sobre las reservas COMPLETADAS persistidas en stab-04.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Vista dedicada de historial de uso de la sala

  Scenario: Consultar quién usó la sala en un mes
    Given reservas COMPLETADAS persistidas para un mes
    When se consulta el historial de uso de ese mes
    Then se listan las reservas completadas con apartamento, día y bloque

  Scenario: Un periodo sin uso muestra historial vacío
    Given un mes sin reservas completadas
    When se consulta el historial de uso de ese mes
    Then la vista muestra el historial vacío sin error
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| datos | El historial se construye solo sobre reservas COMPLETADAS persistidas (no recalcula ni borra el dato base) | La vista refleja exactamente las COMPLETADAS guardadas en stab-04 |
| usabilidad | La vista permite consultar por rango/mes (p. ej. "quién usó la sala el mes pasado") | Una consulta por mes devuelve solo las completadas de ese mes |

## Notas / decisiones abiertas

- Feature diferida declarada. Esta slice es la "vista" del historial; el dato persistente (COMPLETADAS) ya vive en `stab-04`, sin solape. Queda fuera el ranking de "quién usó más" (excluido del alcance).
