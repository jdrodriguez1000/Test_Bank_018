# Lessons Learned — Aprendizajes del motor al fabricar el producto

> Conocimiento TRANSVERSAL (los 6 arneses) que el motor aprende **operando** sobre este producto
> (Reservas Sala Comunitaria).

## Índice

| ID | Fase | Lección (1 línea) | Regla para el futuro (1 línea) |
|----|------|-------------------|--------------------------------|
| LL-001 | `010_discovery` | La ambigüedad "reservas justas" no bloqueó el slicing; afloró como huecos UNRESOLVED resueltos en el gate | Distinguir ambigüedad que impide estructurar (bucle de aclaración) de la que solo afina escenarios (supuesto abierto → gate) |
| LL-002 | `020_architecture` | Los vectores de seguridad sin código corriendo no se pueden demostrar; marcarlos verified:false en vez de fabricar verde | Solo las anclas D2/D4 se demuestran en el 020; los demás vectores se verifican en 030/050; nunca un true sin captura real (L-009) |

---

## LL-001 — Dónde se captura la ambigüedad del scope
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:48:05Z
**Contexto:** El scope traía una ambigüedad deliberada ("reservas justas entre vecinos") más 3 detalles no especificados (ventana a futuro, definición de "el mes", mudanzas). El epic-slicer reportó RESUELTO (no disparó el bucle de aclaración) porque esos huecos afinan escenarios dentro de slices ya identificadas, no la estructura de bandas. Quedaron como UNRESOLVED en el transcript/slices y el cliente los cerró en el gate vía `/caden-review`.
**Aprendizaje:** No toda ambigüedad bloquea el slicing. La "justicia" se concretó pronto (topes por apartamento) y los 3 huecos restantes eran refinamientos de regla, no incógnitas estructurales.
**Regla para el futuro:** Reservar el bucle de aclaración (epic-slicer PENDIENTE) para ambigüedad que **impide** trazar bandas/dependencias; los detalles que solo precisan un valor de regla se dejan como supuesto abierto explícito (`UNRESOLVED`) y se resuelven en el gate, sin fabricar datos del cliente.

## LL-002 — Qué seguridad se puede demostrar en el 020 (y qué no)
**Fase:** `020_architecture` · **Fecha:** 2026-06-25T19:09:01Z
**Contexto:** El `governance-weaver` materializó los 6 vectores de seguridad, pero el scaffold está vacío de lógica. Solo las anclas D2 (violación de capa) y D4 (anti-SQLi por S608) se demostraron con corridas reales; 4 vectores (validación Pydantic/Zod, authz `Depends()`, headers/CORS, ejecución de gitleaks) quedaron **configurados-no-verificados** → `verified:false`, y C topó D4 a 0.8 por ello (sin penalizar el veredicto: APPROVED 0.97).
**Aprendizaje:** Un vector de seguridad que requiere código corriendo (rutas, app factory, esquemas) no es demostrable en el 020; declararlo `true` sería fabricar un verde (L-009). La honestidad del `verified:false` es lo correcto y C la premia re-verificando solo lo demostrable (D-032).
**Regla para el futuro:** En el 020, demostrar **solo** las dos anclas (D2/D4); los otros 4 vectores se dejan configurados con `verified:false` y se materializan/verifican con captura real en los arneses 030 (contratos) y 050 (ejecución). No inflar el manifest con verificaciones que el laboratorio vacío no puede sostener.
