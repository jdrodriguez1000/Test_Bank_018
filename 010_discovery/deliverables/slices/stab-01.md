# Slice `stab-01` — `Validar bloque y día permitidos`

- **Tipo (banda):** `stabilization` · **band_index:** `1`
- **Orden:** `2` · **Depende de:** `[tracer-01]`
- **Comportamiento:** El sistema solo acepta los 3 bloques predefinidos (bloque entero) en días permitidos; bloquea o no ofrece bloques inexistentes ni días fuera de lo permitido (incluida la ventana de reserva: máximo 30 días de anticipación, mínimo el mismo día mientras el bloque no haya empezado), sin ajustar por su cuenta.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Validar que solo se reserven bloques y días permitidos

  Scenario: Rechazar un bloque inexistente
    Given un vecino consultando el calendario de un día
    When intenta reservar un bloque que no es ninguno de los 3 predefinidos
    Then el sistema no crea la reserva
    And muestra solo los bloques disponibles de ese día sin ajustar la elección por su cuenta

  Scenario: Aceptar uno de los 3 bloques predefinidos en un día permitido
    Given un día permitido con el bloque de la mañana libre
    When el vecino reserva el bloque de la mañana entero
    Then el sistema acepta la solicitud y marca la franja como ocupada

  Scenario: Rechazar un día fuera de lo permitido
    Given un vecino intentando reservar
    When elige un día que está fuera del rango permitido para reservar
    Then el sistema bloquea la reserva
    And no ofrece ese día como reservable

  Scenario: Rechazar una reserva con más de 30 días de anticipación
    Given un vecino consultando el calendario
    When intenta reservar un bloque cuya fecha está a más de 30 días desde hoy
    Then el sistema bloquea la reserva por exceder la ventana de anticipación
    And no ofrece ningún día posterior a hoy + 30 días como reservable

  Scenario: Aceptar una reserva dentro de la ventana de 30 días
    Given un vecino consultando el calendario
    When elige un bloque libre cuya fecha está entre hoy y hoy + 30 días (inclusive)
    Then el sistema permite continuar con la reserva de ese bloque

  Scenario: Permitir reservar el mismo día si el bloque no ha empezado
    Given el día de hoy con el bloque de la tarde aún sin comenzar
    When el vecino reserva el bloque de la tarde de hoy
    Then el sistema acepta la solicitud por estar dentro de la ventana (mínimo el mismo día)

  Scenario: Rechazar reservar un bloque del mismo día que ya empezó
    Given el día de hoy con el bloque de la mañana ya iniciado
    When el vecino intenta reservar el bloque de la mañana de hoy
    Then el sistema bloquea la reserva por estar fuera de la ventana (el bloque ya empezó)
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| datos | Solo se aceptan los 3 bloques predefinidos y el bloque entero; nada de medios bloques o bloques partidos | Toda solicitud sobre un bloque distinto de los 3 se rechaza |
| usabilidad | Ante una elección no válida el sistema bloquea/no ofrece, nunca "ajusta" la elección por el vecino | El vecino siempre confirma explícitamente un bloque válido; el sistema no sustituye su elección |
| datos | Ventana de reserva a futuro: solo es reservable un bloque cuya fecha esté entre hoy y hoy + 30 días (inclusive); el mínimo es el mismo día mientras el bloque no haya empezado | Toda solicitud con fecha > hoy + 30 días se rechaza; el calendario no ofrece días posteriores a ese límite; un bloque del mismo día ya iniciado no es reservable |

## Notas / decisiones abiertas

- **Ventana de reserva a futuro (RESUELTA en el gate):** máximo **30 días** de anticipación (desde hoy hasta hoy + 30 días, inclusive); mínimo el **mismo día** mientras el bloque no haya empezado. Se descartó explícitamente la ventana móvil de 30 días como criterio del tope mensual (eso vive en `stab-02` como mes calendario). Regla aterrizada en los escenarios y el no-funcional de esta slice. No quedan supuestos abiertos.
