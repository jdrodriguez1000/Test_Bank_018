# Slice `evol-03` — `Recordatorio previo a la reserva`

- **Tipo (banda):** `evolution` · **band_index:** `3`
- **Orden:** `9` · **Depende de:** `[mvp-01]`
- **Comportamiento:** (Diferido declarado) El sistema envía al vecino un recordatorio un par de días antes de su reserva próxima.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Recordatorio de la reserva un par de días antes

  Scenario: El vecino recibe un recordatorio antes de su reserva
    Given un vecino con una reserva activa próxima
    When faltan un par de días para la fecha de la reserva
    Then el sistema le envía una notificación de recordatorio con el día y el bloque

  Scenario: Una reserva cancelada no genera recordatorio
    Given una reserva que fue cancelada a tiempo
    When llega la fecha del recordatorio que habría correspondido
    Then el sistema no envía ningún recordatorio para esa reserva
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| disponibilidad | El recordatorio se dispara una sola vez, un par de días antes de la reserva activa | No se envían recordatorios duplicados ni para reservas no activas |
| datos | El recordatorio incluye el día y el bloque de la reserva | La notificación referencia la reserva concreta del vecino |

## Notas / decisiones abiertas

- Feature diferida declarada. El canal de notificación (correo u otro) y la anticipación exacta ("un par de días") están sin precisar; se afinarán al planificar esta evolution.
