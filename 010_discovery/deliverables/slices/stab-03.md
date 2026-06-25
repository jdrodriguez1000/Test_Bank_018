# Slice `stab-03` — `Sin doble reserva (concurrencia)`

- **Tipo (banda):** `stabilization` · **band_index:** `3`
- **Orden:** `4` · **Depende de:** `[tracer-01, stab-01]`
- **Comportamiento:** Ante dos confirmaciones concurrentes sobre el mismo bloque/día, gana el primero que confirma; el perdedor recibe un aviso claro y el calendario actualizado, sin reservas pisadas.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Evitar la doble reserva del mismo bloque y día

  Scenario: Dos vecinos confirman el mismo bloque casi al tiempo
    Given el bloque de la noche de un día está libre
    And dos vecinos de apartamentos distintos lo están intentando reservar a la vez
    When ambos confirman casi simultáneamente
    Then solo el primero que confirma obtiene la reserva
    And el segundo recibe el aviso "ese bloque ya fue tomado, elige otro"
    And el segundo ve el calendario actualizado con ese bloque ocupado

  Scenario: Nunca quedan dos reservas pisadas sobre el mismo bloque/día
    Given múltiples intentos de reserva sobre el mismo bloque y día
    When el sistema procesa las confirmaciones
    Then existe a lo sumo una reserva activa para ese bloque y día
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| datos | Atomicidad/integridad: a lo sumo una reserva activa por combinación bloque+día | Bajo confirmaciones concurrentes, nunca se crean dos reservas para el mismo bloque/día |
| disponibilidad | La resolución es "primero que confirma gana"; el perdedor obtiene resultado inmediato y consistente | El segundo confirmador recibe el aviso de conflicto y el calendario reflejando el bloque ocupado sin recargar manualmente |
| usabilidad | El aviso al perdedor es claro y accionable ("ese bloque ya fue tomado, elige otro") | El mensaje invita a elegir otro bloque y el calendario muestra los aún disponibles |

## Notas / decisiones abiertas

- Sin UNRESOLVED propio. La regla de concurrencia está cerrada en el transcript ("gana el primero que confirma; nunca dos reservas pisadas").
