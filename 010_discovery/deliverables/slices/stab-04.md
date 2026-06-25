# Slice `stab-04` — `Cancelación y ciclo de vida de la reserva`

- **Tipo (banda):** `stabilization` · **band_index:** `4`
- **Orden:** `5` · **Depende de:** `[tracer-01, stab-02]`
- **Comportamiento:** El dueño cancela su reserva solo hasta el día anterior (mismo día no); al cancelar a tiempo la franja vuelve a libre de inmediato. Al pasar el bloque, la reserva transiciona a COMPLETADA y persiste.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Cancelación a tiempo y ciclo de vida de la reserva

  Scenario: Cancelar a tiempo libera la franja de inmediato
    Given un vecino con una reserva activa para un bloque de un día futuro
    And aún no ha llegado el día de la reserva
    When el vecino cancela su propia reserva
    Then la reserva queda cancelada
    And la franja de ese bloque vuelve a estado libre de inmediato

  Scenario: No se puede cancelar el mismo día del bloque
    Given un vecino con una reserva activa cuyo día es hoy
    When intenta cancelarla
    Then el sistema rechaza la cancelación
    And la reserva permanece activa

  Scenario: Solo el dueño puede cancelar su reserva
    Given una reserva activa de un apartamento
    When un vecino de otro apartamento intenta cancelarla
    Then el sistema rechaza la cancelación

  Scenario: Al pasar el bloque la reserva queda COMPLETADA y persiste
    Given una reserva activa cuyo bloque ya transcurrió
    When el tiempo del bloque ha pasado
    Then la reserva transiciona a estado COMPLETADA
    And la reserva persiste (no desaparece) para consulta posterior
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| seguridad | La cancelación solo la realiza el dueño (apartamento) sobre sus propias reservas | Un intento de cancelar una reserva ajena se rechaza |
| datos | Ventana de cancelación: hasta el día anterior; el mismo día del bloque ya no se puede cancelar | Una cancelación en el día del bloque se rechaza; un día antes o más se acepta |
| datos | Las reservas COMPLETADAS persisten (sustrato del historial); no se borran al pasar el bloque | Tras pasar el bloque, la reserva sigue consultable con estado COMPLETADA |

## Notas / decisiones abiertas

- Sin UNRESOLVED propio. La persistencia de COMPLETADAS aquí es el dato del que se nutrirá la futura vista de historial (`evol-04`); esta slice cubre el dato persistente, no la vista dedicada.
