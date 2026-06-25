# Slice `mvp-01` — `Reserva utilizable: normas + mis reservas`

- **Tipo (banda):** `mvp` · **band_index:** `null`
- **Orden:** `6` · **Depende de:** `[tracer-01, stab-01, stab-02, stab-03, stab-04]`
- **Comportamiento:** La columna endurecida lo mínimo para usarse de verdad: reservar aceptando obligatoriamente las normas ("acepto las normas") y poder ver las reservas propias, sobre el núcleo ya estabilizado.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Reserva utilizable con aceptación de normas y consulta de mis reservas

  Scenario: Confirmar una reserva aceptando las normas
    Given un vecino eligiendo un bloque libre y válido dentro de sus topes
    When acepta las normas ("acepto las normas") y confirma la reserva con un motivo corto
    Then la reserva queda activa con el consentimiento de las normas registrado
    And la franja queda ocupada

  Scenario: No se puede confirmar sin aceptar las normas
    Given un vecino eligiendo un bloque libre y válido
    When intenta confirmar sin aceptar las normas
    Then el sistema no crea la reserva
    And solicita la aceptación de las normas para continuar

  Scenario: Ver mis reservas propias
    Given un vecino con varias reservas (activas y pasadas) de su apartamento
    When consulta "mis reservas"
    Then ve únicamente las reservas de su propio apartamento con su día, bloque y estado
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| datos | La aceptación de normas es obligatoria al confirmar y queda registrada con la reserva | Ninguna reserva se crea sin consentimiento de normas registrado |
| seguridad | "Mis reservas" muestra solo las reservas del propio apartamento del vecino | Un vecino nunca ve las reservas de otro apartamento en esta vista |
| usabilidad | El conjunto es el mínimo realmente desplegable y útil para el vecino (reservar con normas + ver lo propio) | Un vecino puede completar el ciclo reservar → consultar sus reservas sin funciones adicionales |

## Notas / decisiones abiertas

- El sistema solo hace cumplir horario de bloques, no doble reserva y topes (heredados de stab-01..03); el resto de normas (limpieza, aforo, no fiestas tras las 10 pm, daños) es informativo/convivencia y no lo vigila la app.
