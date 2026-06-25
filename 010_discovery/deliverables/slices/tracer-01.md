# Slice `tracer-01` — `Reservar un bloque libre (cableado punta a punta)`

- **Tipo (banda):** `tracer_bullet` · **band_index:** `null`
- **Orden:** `1` · **Depende de:** `ninguna`
- **Comportamiento:** Un vecino dado de alta entra con su correo, ve los 3 bloques de un día, elige uno libre y la franja queda ocupada y persiste (identidad → disponibilidad → reserva → persistencia).

## Escenarios BDD (Gherkin)

```gherkin
Feature: Reservar de punta a punta un bloque libre de la sala comunitaria

  Scenario: El vecino reserva un bloque libre y la franja queda ocupada
    Given un vecino dado de alta con su correo, asociado a un apartamento
    And el calendario muestra el día con los 3 bloques (mañana, tarde, noche) libres
    When entra con su correo, consulta el día y elige el bloque de la tarde con un motivo corto
    Then queda registrada una reserva activa para ese apartamento en ese día y bloque
    And la franja de la tarde de ese día pasa a estado ocupada
    And la reserva persiste tras recargar el calendario

  Scenario: El calendario refleja un bloque ya ocupado
    Given un día con el bloque de la tarde ya ocupado por una reserva existente
    When un vecino dado de alta consulta el calendario de ese día
    Then ve el bloque de la tarde como ocupado
    And ve los bloques de la mañana y de la noche como libres
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| seguridad | El acceso es solo con un correo dado de alta por la administración; la identidad es el apartamento, no la persona | Un correo no dado de alta no obtiene sesión; dos personas del mismo apartamento operan como el mismo apartamento para la reserva |
| datos | Existen exactamente 3 bloques fijos por día (mañana 8:00–12:00, tarde 13:00–17:00, noche 18:00–22:00); se reserva el bloque entero | El calendario nunca ofrece medios bloques ni franjas partidas |
| datos | La franja tiene estado binario libre ↔ ocupada y la reserva persiste | Tras confirmar y recargar, la franja sigue ocupada y la reserva sigue presente |

## Notas / decisiones abiertas

- **Ventana de reserva a futuro (resuelta, no aplicada aquí):** la regla de horizonte temporal quedó definida en el gate (máximo 30 días de anticipación; mínimo el mismo día mientras el bloque no haya empezado) y se hace cumplir en `stab-01`. El tracer deliberadamente NO restringe el horizonte: solo cablea identidad → disponibilidad → reserva → persistencia. No hay hueco abierto; la validación de horizonte se cubre en `stab-01`.
- El tracer deliberadamente NO incluye validación de bloque/día, topes, concurrencia, aceptación de normas ni cancelación (cubiertos en stab-01..04 y mvp-01).
