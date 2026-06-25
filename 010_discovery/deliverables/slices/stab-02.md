# Slice `stab-02` — `Topes por apartamento`

- **Tipo (banda):** `stabilization` · **band_index:** `2`
- **Orden:** `3` · **Depende de:** `[tracer-01, stab-01]`
- **Comportamiento:** El sistema hace cumplir los topes por apartamento: máximo 2 reservas activas a futuro y no más de 4 reservas en el mes; rechaza con aviso al superar el tope, sin prioridades ni puntajes.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Hacer cumplir los topes de reservas por apartamento

  Scenario: Rechazar una tercera reserva activa a futuro
    Given un apartamento con 2 reservas activas a futuro
    When un vecino de ese apartamento intenta crear una tercera reserva a futuro
    Then el sistema rechaza la reserva por superar el tope de activas
    And muestra un aviso claro indicando el límite alcanzado

  Scenario: Permitir reservar cuando aún hay cupo de activas
    Given un apartamento con 1 reserva activa a futuro y sin alcanzar el tope mensual
    When un vecino de ese apartamento crea otra reserva a futuro válida
    Then el sistema acepta la reserva

  Scenario: Rechazar la quinta reserva cuyo bloque cae en un mes calendario ya con 4
    Given un apartamento con 4 reservas cuya fecha de bloque cae en el mes calendario de septiembre
    When un vecino de ese apartamento intenta reservar otro bloque cuya fecha también cae en septiembre
    Then el sistema rechaza la reserva por superar el tope de 4 del mes calendario
    And el conteo se hace por la fecha del bloque reservado, no por la fecha en que se hace el clic

  Scenario: Permitir reservar para otro mes calendario aunque el mes en curso esté lleno
    Given un apartamento con 4 reservas cuya fecha de bloque cae en el mes calendario de septiembre
    When un vecino de ese apartamento reserva un bloque cuya fecha cae en octubre y no supera el tope de activas
    Then el sistema acepta la reserva porque el tope de 4 es por mes calendario de la fecha del bloque
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| datos | El conteo de topes es por apartamento (no por persona): varias personas del mismo apartamento comparten el contador | Dos personas del mismo apartamento no pueden, sumadas, exceder 2 activas a futuro ni 4 en el mes |
| datos | Tope de 2 reservas activas a futuro al mismo tiempo y de 4 reservas por mes calendario (día 1 al último del mes), contadas por la **fecha del bloque reservado** y no por la fecha del clic | Una solicitud que excedería cualquiera de los dos topes se rechaza de forma determinista; reservas cuyas fechas de bloque caen en meses calendario distintos cuentan en topes mensuales independientes |
| usabilidad | Sin prioridades ni puntajes: la justicia se logra solo con los topes | No existe ningún mecanismo de ranking o prioridad que altere la aceptación/rechazo |

## Notas / decisiones abiertas

- **Definición de "el mes" para el tope de 4 (RESUELTA en el gate):** "el mes" = **mes calendario** (del día 1 al último día del mes). El tope de 4 se cuenta por la **fecha del bloque reservado**, no por la fecha en que se hace el clic. Se descartó explícitamente la ventana móvil de 30 días por ser difícil de entender. Regla aterrizada en los escenarios y el no-funcional de esta slice. No quedan supuestos abiertos.
