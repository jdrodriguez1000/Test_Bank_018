# Slice `evol-02` — `Visto bueno del administrador`

- **Tipo (banda):** `evolution` · **band_index:** `2`
- **Orden:** `8` · **Depende de:** `[mvp-01]`
- **Comportamiento:** (Diferido declarado) Las reservas de fechas señaladas quedan pendientes de aprobación; el administrador las aprueba o rechaza.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Visto bueno del administrador para reservas de fechas señaladas

  Scenario: Una reserva de fecha señalada queda pendiente de aprobación
    Given un vecino reservando un bloque en una fecha señalada
    When confirma la reserva
    Then la reserva queda en estado pendiente-de-aprobación
    And no ocupa la franja en firme hasta que el administrador decida

  Scenario: El administrador aprueba una reserva pendiente
    Given una reserva en estado pendiente-de-aprobación
    When el administrador la aprueba
    Then la reserva pasa a activa y la franja queda ocupada en firme

  Scenario: El administrador rechaza una reserva pendiente
    Given una reserva en estado pendiente-de-aprobación
    When el administrador la rechaza
    Then la reserva queda rechazada y la franja permanece libre
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| seguridad | Solo la administración puede aprobar o rechazar reservas pendientes | Un vecino no puede aprobar/rechazar ninguna reserva |
| datos | Se introduce un estado pendiente-de-aprobación distinto de activa/cancelada/COMPLETADA | El ciclo de vida contempla la transición pendiente → activa | rechazada |

## Notas / decisiones abiertas

- Feature diferida declarada. La definición exacta de "fechas señaladas" (qué fechas requieren visto bueno) está sin precisar; se afinará al planificar esta evolution.
