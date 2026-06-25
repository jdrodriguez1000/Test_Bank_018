# Slice `final-01` — `Gestión administrativa de altas y cierre de alcance`

- **Tipo (banda):** `final` · **band_index:** `null`
- **Orden:** `11` · **Depende de:** `[mvp-01]`
- **Comportamiento:** La administración da de alta a los vecinos sobre el padrón fijo de 48 apartamentos (torres A/B, 101–802) por correo + apartamento, donde varias personas cuentan como el mismo apartamento y no hay auto-registro; gestiona también bajas/mudanzas (cancelan reservas a futuro y liberan franjas, conservando las COMPLETADAS) y cambios de apartamento (las reservas a futuro no se arrastran). El alta nueva entra con topes en cero para el mes en curso.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Gestión administrativa de altas sobre el padrón fijo de apartamentos

  Scenario: La administración da de alta a un vecino
    Given el padrón fijo de 48 apartamentos (torres A/B, 101–802)
    When la administración da de alta una persona con su correo y un apartamento del padrón
    Then esa persona queda asociada a ese apartamento y puede entrar con su correo

  Scenario: Varias personas comparten el mismo apartamento
    Given un apartamento con una persona ya dada de alta
    When la administración da de alta una segunda persona en el mismo apartamento
    Then ambas personas operan como el mismo apartamento para efectos de reservas y topes

  Scenario: No hay auto-registro
    Given una persona con un correo no dado de alta por la administración
    When intenta acceder
    Then el sistema no le concede acceso

  Scenario: No se permite un apartamento fuera del padrón
    Given el padrón fijo de 48 apartamentos
    When la administración intenta dar de alta un apartamento que no está en el padrón
    Then el sistema rechaza el alta

  Scenario: Baja de un vecino cancela sus reservas a futuro y libera las franjas
    Given un apartamento con reservas activas a futuro y reservas ya COMPLETADAS
    When la administración da de baja a la persona o al apartamento
    Then todas sus reservas activas a futuro quedan canceladas
    And esas franjas vuelven a estar libres de inmediato
    And las reservas ya COMPLETADAS se conservan en el historial sin cambios

  Scenario: Cambio de apartamento no arrastra las reservas a futuro
    Given un vecino con reservas activas a futuro atadas a su apartamento actual
    When la administración cambia a ese vecino al apartamento nuevo
    Then las reservas a futuro quedan atadas al apartamento anterior y se cancelan, liberando sus franjas
    And no se arrastran al apartamento nuevo
    And el vecino puede volver a reservar desde el apartamento nuevo

  Scenario: Alta nueva entra con topes en cero para el mes en curso
    Given un apartamento sin personas dadas de alta
    When la administración da de alta a una persona en ese apartamento
    Then ese apartamento tiene cero reservas activas a futuro y cero reservas contadas para el mes en curso
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| seguridad | Solo la administración da de alta; no existe auto-registro de vecinos | Ningún correo no dado de alta obtiene acceso |
| datos | El padrón es fijo: exactamente 48 apartamentos (torres A y B, 101–802) | No se aceptan apartamentos fuera de ese listado |
| datos | La identidad de reserva es el apartamento; varias personas = el mismo apartamento | Los topes y reservas se cuentan por apartamento, no por persona |
| datos | Baja/mudanza cancela las reservas activas a futuro y libera sus franjas de inmediato; las reservas COMPLETADAS se conservan en el historial | Tras una baja, ninguna franja a futuro de ese apartamento queda ocupada y las COMPLETADAS siguen presentes sin alteración |
| datos | El cambio de apartamento no arrastra reservas: las activas a futuro se cancelan en el apartamento anterior y liberan sus franjas | Tras un cambio de apartamento, las reservas a futuro previas no aparecen bajo el apartamento nuevo ni alteran su conteo de topes |
| datos | El alta nueva entra con topes en cero (0 activas a futuro y 0 del mes en curso) | Un apartamento recién dado de alta puede reservar hasta sus topes completos sin arrastre histórico |

## Notas / decisiones abiertas

- **Altas/bajas/mudanzas (RESUELTO en el gate):**
  - **Baja/mudanza:** dar de baja a la persona o al apartamento **cancela** sus reservas activas a futuro y **libera** esas franjas de inmediato; las reservas ya **COMPLETADAS** se conservan en el historial.
  - **Cambio de apartamento:** las reservas a futuro quedan atadas al apartamento **anterior** y se cancelan/liberan; **no se arrastran** entre apartamentos. El vecino re-reserva desde el apartamento nuevo.
  - **Alta nueva:** entra con **topes en cero** para el mes en curso.
  Reglas aterrizadas en los escenarios y los no-funcionales de esta slice. No quedan supuestos abiertos.
