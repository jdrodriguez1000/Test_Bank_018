# Slicing Report — Reservas de la sala comunitaria

## Estado
RESUELTO

Los 3 `UNRESOLVED` del transcript se dejan como **supuestos abiertos**: ninguno bloquea la decisión de
slicing (qué slices existen, de qué tipo, en qué orden, con qué dependencias). Son refinamientos de regla
que afinan escenarios *dentro* de slices ya identificadas, no la estructura de bandas:
- **Ventana de reserva a futuro:** afina la validación de fecha permitida → escenario adicional dentro de
  `stab-01` (validación de bloque/día). No crea ni reordena slices.
- **Definición exacta de "reservas del mes":** afina el cálculo del tope mensual → escenario dentro de
  `stab-02` (topes por apartamento). No crea ni reordena slices.
- **Alta/baja de vecinos (mudanzas) y sus reservas activas:** afina un borde de la gestión de identidad
  (`tracer-01`/`final-01`). No introduce un comportamiento independiente nuevo en el scope firmado.

Los tres se trasladan al `bdd-synthesizer` como notas no-funcionales / supuestos a marcar, sin fabricar
dato. Si el gate humano quisiera cerrarlos antes, se haría vía `/caden-review`, no bloquea el draft.

## Comportamientos detectados (MECE)
| ID | Comportamiento | Actor | Datos que mueve | Slice asignada |
|----|----------------|-------|-----------------|----------------|
| B1 | Acceso del vecino con correo dado de alta (identidad = apartamento) | Vecino | entra correo dado de alta → sale sesión/identidad de apartamento | tracer-01 |
| B2 | Consultar calendario y ver bloques disponibles/ocupados de un día | Vecino | entra día → sale estado libre/ocupada de los 3 bloques | tracer-01 |
| B3 | Reservar un bloque libre (elegir bloque + motivo corto, marcar franja ocupada) | Vecino | entra día+bloque+motivo → sale reserva activa, franja ocupada | tracer-01 / mvp-01 |
| B4 | Aceptar las normas al reservar ("acepto las normas") | Vecino | entra aceptación de normas → sale reserva válida con consentimiento | mvp-01 |
| B5 | Validar bloque/día permitidos (solo 3 bloques, día permitido; bloquear inexistentes, no ajustar) | Vecino | entra intento de bloque/día → sale aceptación u oferta solo de disponibles | stab-01 |
| B6 | Hacer cumplir topes por apartamento (2 activas a futuro, 4 en el mes) | Vecino | entra intento de reserva → sale aceptación o rechazo por tope | stab-02 |
| B7 | Evitar doble reserva del mismo bloque/día (concurrencia: gana el primero que confirma) | Vecino | entra confirmación concurrente → sale 1 reserva + aviso al perdedor + calendario actualizado | stab-03 |
| B8 | Ver mis reservas propias | Vecino | entra identidad de apartamento → sale lista de reservas propias | mvp-01 |
| B9 | Cancelar una reserva propia hasta el día anterior (mismo día no); franja vuelve a libre | Vecino | entra cancelación → sale reserva cancelada, franja libre | stab-04 |
| B10 | Ciclo de vida de reserva: transición a COMPLETADA al pasar el bloque (persiste) | Sistema (sobre datos del vecino) | entra paso del tiempo del bloque → sale reserva COMPLETADA persistida | stab-04 |
| B11 | Gestión administrativa de altas (correo + apartamento) sobre el padrón fijo de 48 aptos | Administración | entra correo+apartamento → sale padrón actualizado | final-01 |
| B12 | (Diferido) Reservar recursos extra junto con la sala (proyector, sillas, sonido) | Vecino | entra recursos elegidos → sale reserva con recursos | evol-01 |
| B13 | (Diferido) Visto bueno del administrador para reservas de fechas señaladas | Administración | entra reserva pendiente → sale aprobada/rechazada | evol-02 |
| B14 | (Diferido) Recordatorio un par de días antes de la reserva | Sistema → Vecino | entra reserva próxima → sale notificación | evol-03 |
| B15 | (Diferido) Vista dedicada de historial de uso de la sala | Vecino/Admin | entra rango/mes → sale historial de uso (completadas) | evol-04 |

**Nota MECE:** cobertura total del scope vivo (B1–B11) más el alcance diferido declarado (B12–B15) ruteado
a Evolution. Cada comportamiento cae en exactamente una slice. La persistencia de COMPLETADAS (B10) es el
sustrato del que se nutre la futura vista de historial (B15); el "historial como dato persistente" vive en
`stab-04` (scope vivo), la "vista dedicada" se difiere a `evol-04` — sin solape.

**Excluido (NO sliceado, fuera del roadmap, L-017):** pagos/fianzas; otras salas/zonas comunes; reservas
por portería; ranking de uso / "quién usó más"; prioridades o puntajes. No portan `Bk`, no se difieren.

## Columna vertebral
La columna vertebral es **reservar un bloque libre de la sala (B3)**: la acción de extremo a extremo más
valiosa del recorrido feliz (el vecino mira disponibilidad y toma una franja). Sus dos comportamientos
soporte inseparables para que el cableado tenga sentido son el **acceso por apartamento (B1)** y el **ver
disponibilidad (B2)**: sin identidad no hay quién reserve y sin calendario no hay qué reservar.

- **Tracer Bullet (`tracer-01`):** versión más delgada — 1 vecino dado de alta (sin gestión admin), ve el
  calendario de un día con los 3 bloques, elige uno libre y la franja queda ocupada. **Sin** validaciones
  de bloque/día, **sin** topes, **sin** concurrencia, **sin** aceptación de normas, **sin** cancelación.
  Solo prueba que identidad → disponibilidad → reserva → persistencia están cableados de punta a punta.
- **MVP (`mvp-01`):** la columna endurecida lo mínimo para usarse de verdad: reservar con **aceptación de
  normas (B4)** y poder **ver mis reservas (B8)**, sobre el núcleo ya estabilizado (validación, topes,
  no-doble-reserva, cancelación). Es el conjunto mínimo realmente desplegable y útil para el vecino.

## Épicas detectadas y trituración
Una Épica candidata: **"gestión de reglas de reserva"** (juntar en una sola slice validación de bloque/día
+ topes + concurrencia + ciclo de vida/cancelación). Falla el test de "una rebanada":
- viola **(b)** (no es un conjunto pequeño con un happy path dominante: son 4 reglas con rutas de error
  propias) y **(d)** (introduce más de un concepto: bloque permitido, contador de topes, resolución de
  concurrencia, estado de ciclo de vida).

Triturada en cuatro hijos, cada uno endurece **un** concern del flujo central y pasa el test de forma
independiente y demostrable:
- `stab-01` — validación de bloque/día permitidos (B5).
- `stab-02` — topes por apartamento (B6).
- `stab-03` — sin doble reserva / concurrencia "primero que confirma gana" (B7).
- `stab-04` — cancelación a tiempo + ciclo de vida a COMPLETADA (B9, B10).

(B9 y B10 se **fusionan** en `stab-04`: comparten el mismo ciclo de vida de la reserva y su estado; no se
demuestran de forma separada sin solapar escenarios → MECE pide fusión, no corte artificial.)

Sin más Épicas: las 4 features diferidas (B12–B15) ya son comportamientos independientes que pasan el
test cada uno como una Evolution.

## Slices (orden global)
| order | id | name | type | band_index | depends_on | comportamientos | nota no-funcional |
|-------|----|------|------|------------|------------|-----------------|-------------------|
| 1 | tracer-01 | Reservar un bloque libre (cableado punta a punta) | tracer_bullet | null | [] | B1, B2, B3 | Identidad = apartamento (no persona); 3 bloques fijos mañana/tarde/noche; franja libre↔ocupada; supuesto abierto: horizonte de reserva a futuro sin definir (UNRESOLVED) |
| 2 | stab-01 | Validar bloque y día permitidos | stabilization | 1 | [tracer-01] | B5 | Solo los 3 bloques predefinidos, bloque entero; bloquear/no ofrecer inexistentes o días no permitidos, nunca "ajustar"; aquí aterriza el UNRESOLVED de ventana a futuro |
| 3 | stab-02 | Topes por apartamento | stabilization | 2 | [tracer-01, stab-01] | B6 | Máx 2 activas a futuro + máx 4 en el mes; sin prioridades ni puntajes; UNRESOLVED: definición exacta de "el mes" (calendario / 30 días / mes de la reserva) |
| 4 | stab-03 | Sin doble reserva (concurrencia) | stabilization | 3 | [tracer-01, stab-01] | B7 | "Primero que confirma gana"; al perdedor aviso claro ("ese bloque ya fue tomado, elige otro") + calendario actualizado; nunca dos reservas pisadas (integridad/atomicidad) |
| 5 | stab-04 | Cancelación y ciclo de vida de la reserva | stabilization | 4 | [tracer-01, stab-02] | B9, B10 | Cancelar solo el dueño y solo hasta el día anterior (mismo día no); al cancelar a tiempo la franja vuelve a libre de inmediato; al pasar el bloque → COMPLETADA persistente (no desaparece) |
| 6 | mvp-01 | Reserva utilizable: normas + mis reservas | mvp | null | [tracer-01, stab-01, stab-02, stab-03, stab-04] | B3, B4, B8 | Aceptación de normas obligatoria al confirmar ("acepto las normas"); vista de "mis reservas" propias; mínimo desplegable y útil para el vecino |
| 7 | evol-01 | Reservar recursos extra con la sala | evolution | 1 | [mvp-01] | B12 | Diferido declarado: proyector, sillas plegables, equipo de sonido junto a la reserva |
| 8 | evol-02 | Visto bueno del administrador | evolution | 2 | [mvp-01] | B13 | Diferido declarado: aprobación admin para reservas de fechas señaladas (nuevo estado pendiente-de-aprobación) |
| 9 | evol-03 | Recordatorio previo a la reserva | evolution | 3 | [mvp-01] | B14 | Diferido declarado: notificación un par de días antes |
| 10 | evol-04 | Vista dedicada de historial de uso | evolution | 4 | [mvp-01, stab-04] | B15 | Diferido declarado: vista de "quién usó la sala" sobre las COMPLETADAS persistidas en stab-04 |
| 11 | final-01 | Gestión administrativa de altas y cierre de alcance | final | null | [mvp-01] | B11 | Padrón fijo 48 aptos (torres A/B, 101–802), alta por correo+apartamento, varias personas = mismo apartamento, sin auto-registro; UNRESOLVED: baja/cambio de apartamento (mudanzas) y reservas activas |

## Conteo
- n_stab = 4 · n_evol = 4 · n_total = 3 + n_stab + n_evol = 11
- Justificación: las 4 stabilization salen de triturar la Épica de reglas del flujo central (un concern de
  robustez/corrección por slice: validación de bloque/día, topes, no-doble-reserva, cancelación+ciclo de
  vida — Paso 5). Las 4 evolution son exactamente las 4 features de "## Alcance diferido" declaradas, cada
  una un comportamiento independiente que pasa el test de "una rebanada" (no se infla ni se amputa scope).
  Las 3 anclas obligatorias: `tracer-01` (columna adelgazada), `mvp-01` (columna usable), `final-01`
  (gestión admin + cierre de alcance).
