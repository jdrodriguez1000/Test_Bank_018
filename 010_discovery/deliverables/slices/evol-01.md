# Slice `evol-01` — `Reservar recursos extra con la sala`

- **Tipo (banda):** `evolution` · **band_index:** `1`
- **Orden:** `7` · **Depende de:** `[mvp-01]`
- **Comportamiento:** (Diferido declarado) El vecino puede añadir recursos extra (proyector, sillas plegables, equipo de sonido) junto con su reserva de la sala.

## Escenarios BDD (Gherkin)

```gherkin
Feature: Reservar recursos extra junto con la sala

  Scenario: Añadir recursos extra a una reserva
    Given un vecino reservando un bloque libre y válido
    When marca el proyector y las sillas plegables como recursos extra y confirma
    Then la reserva queda registrada con los recursos extra seleccionados

  Scenario: Reservar sin recursos extra
    Given un vecino reservando un bloque libre y válido
    When confirma sin seleccionar ningún recurso extra
    Then la reserva queda registrada sin recursos extra asociados
```

## Restricciones no funcionales (ligadas a este comportamiento)

| Tipo | Restricción | Criterio verificable |
|------|-------------|----------------------|
| datos | Los recursos extra se asocian a la reserva como atributo opcional (proyector, sillas, sonido) | Una reserva puede consultarse con o sin recursos extra asociados |
| usabilidad | La selección de recursos no debe entorpecer el flujo base de reserva del MVP | El vecino puede reservar igual de simple ignorando los recursos extra |

## Notas / decisiones abiertas

- Feature diferida declarada en el scope. Detalle de inventario/conflictos por recurso (p. ej. un solo proyector compartido) sin definir; se afinará al planificar esta evolution.
