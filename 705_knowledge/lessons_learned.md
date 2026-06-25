# Lessons Learned — Aprendizajes del motor al fabricar el producto

> Conocimiento TRANSVERSAL (los 6 arneses) que el motor aprende **operando** sobre este producto
> (Reservas Sala Comunitaria).

## Índice

| ID | Fase | Lección (1 línea) | Regla para el futuro (1 línea) |
|----|------|-------------------|--------------------------------|
| LL-001 | `010_discovery` | La ambigüedad "reservas justas" no bloqueó el slicing; afloró como huecos UNRESOLVED resueltos en el gate | Distinguir ambigüedad que impide estructurar (bucle de aclaración) de la que solo afina escenarios (supuesto abierto → gate) |

---

## LL-001 — Dónde se captura la ambigüedad del scope
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:48:05Z
**Contexto:** El scope traía una ambigüedad deliberada ("reservas justas entre vecinos") más 3 detalles no especificados (ventana a futuro, definición de "el mes", mudanzas). El epic-slicer reportó RESUELTO (no disparó el bucle de aclaración) porque esos huecos afinan escenarios dentro de slices ya identificadas, no la estructura de bandas. Quedaron como UNRESOLVED en el transcript/slices y el cliente los cerró en el gate vía `/caden-review`.
**Aprendizaje:** No toda ambigüedad bloquea el slicing. La "justicia" se concretó pronto (topes por apartamento) y los 3 huecos restantes eran refinamientos de regla, no incógnitas estructurales.
**Regla para el futuro:** Reservar el bucle de aclaración (epic-slicer PENDIENTE) para ambigüedad que **impide** trazar bandas/dependencias; los detalles que solo precisan un valor de regla se dejan como supuesto abierto explícito (`UNRESOLVED`) y se resuelven en el gate, sin fabricar datos del cliente.
