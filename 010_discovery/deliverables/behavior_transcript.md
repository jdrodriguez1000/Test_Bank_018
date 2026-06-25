# Behavior Transcript — Reservas de la sala comunitaria

## Resumen del scope
App web para que los vecinos de un edificio reserven la sala comunitaria (sala de eventos del primer
piso), reemplazando la hoja de papel en portería. El vecino mira disponibilidad, reserva una franja,
ve sus reservas y puede cancelar. Las reservas deben ser justas entre vecinos, sin dobles reservas y
respetando las normas de uso.

## Cuestionario
1. **P:** ¿Cómo se identifica y accede el vecino? ¿Cualquiera se registra o lo controla la administración?
   **R:** La administración lleva el control; no se registra cualquiera solo. Listado fijo de
   apartamentos (48 en total: torres A y B, del 101 al 802). La administración da de alta a la persona
   con su correo y su apartamento; el vecino entra con ese correo. Puede haber más de una persona por
   apartamento (pareja, papá e hijo), pero todos cuentan como el MISMO apartamento para efectos de
   reservas — lo que importa es el apartamento, no la persona.
2. **P:** ¿Qué significa "reservas justas entre vecinos"? ¿Cómo debe comportarse el sistema para lograrlo?
   **R:** Tope por apartamento: máximo 2 reservas activas a futuro por apartamento al mismo tiempo, y no
   más de 4 reservas en el mes. Objetivo: que nadie acapare la sala. NO quiere prioridades ni puntajes
   complicados. Con el tope mensual y el de activas le basta. (Mostrar quién ha usado más sería un lujo,
   no necesario ahora.)
3. **P:** ¿Qué define una "franja"? ¿Horario libre o bloques fijos?
   **R:** Bloques fijos, no horario libre. Tres bloques: mañana (8:00–12:00), tarde (13:00–17:00) y
   noche (18:00–22:00). Se reserva el bloque entero. Puede haber dos reservas distintas el mismo día si
   son bloques diferentes y de apartamentos distintos (o incluso del mismo apartamento si no superó su
   tope). No quiere media sala ni bloques partidos.
4. **P:** ¿Qué pasa cuando dos vecinos intentan reservar el mismo bloque, o cuando se pide algo no permitido?
   **R:** Si dos van por el mismo bloque casi al tiempo, gana el primero que confirma; al segundo le sale
   un aviso claro ("ese bloque ya fue tomado, elige otro") y ve el calendario actualizado; nunca dos
   reservas pisadas. Si pide un bloque que no existe o un día fuera de lo permitido, el sistema no lo deja
   y muestra solo los bloques disponibles — se bloquea/no se ofrece, no "ajusta" por su cuenta.
5. **P:** ¿Cuál es el ciclo de vida de una reserva (qué pasa al pasar la franja, hasta cuándo se cancela)?
   **R:** Cuando pasa el bloque, la reserva queda COMPLETADA (no desaparece; necesita ver quién usó la
   sala el mes pasado). Cancelar: hasta el día anterior; el mismo día ya NO se puede cancelar (alguien
   pudo organizarse contando con que estaba ocupada; y evita liberar a último minuto para esquivar el
   tope). Al cancelar a tiempo, la franja vuelve a quedar libre de inmediato.
6. **P:** ¿Qué significan las "normas de uso de la sala"? ¿Cuáles hace cumplir el sistema?
   **R:** La mayoría informativas (dejar la sala limpia, no exceder aforo, no fiestas después de las 10
   pm, responder por daños) — el vecino las lee y acepta al reservar ("acepto las normas"). Lo único que
   el sistema SÍ hace cumplir: horario de los bloques, no doble reserva del mismo bloque, y los topes por
   apartamento. El resto es convivencia, no lo vigila la app.
7. **P:** ¿Qué queda explícitamente fuera de alcance de este producto?
   **R:** Pagos, fianzas o depósitos (la sala es gratis, no se cobra); otras salas o zonas comunes (BBQ,
   gimnasio, parqueadero de visitantes — solo la sala comunitaria); reservas hechas por portería en
   nombre del vecino (cada apartamento reserva lo suyo).

## Síntesis del comportamiento
- **Actores:**
  - **Vecino** (asociado a un apartamento): mira disponibilidad, reserva una franja, ve sus reservas,
    cancela, y acepta las normas al reservar.
  - **Administración**: da de alta a las personas (correo + apartamento). El vecino accede con ese
    correo; no hay auto-registro. Una persona = un apartamento; varias personas pueden compartir el
    mismo apartamento y todas cuentan como ese apartamento para efectos de reservas.
- **Recorrido principal (flujo feliz):** El vecino entra con su correo dado de alta → consulta el
  calendario y ve los bloques disponibles de un día → elige un bloque libre (mañana/tarde/noche) →
  acepta las normas → confirma la reserva (con motivo corto) → la franja queda ocupada → más tarde puede
  ver sus reservas y cancelar (hasta el día anterior).
- **Flujo de datos:**
  - **Entra:** alta administrativa (correo + apartamento del vecino); por reserva: día, bloque elegido,
    motivo corto, aceptación de normas.
  - **Se guarda/transforma:** listado fijo de 48 apartamentos (torres A y B, 101–802); reservas con
    apartamento, vecino, día, bloque, motivo y estado; estado de cada franja (libre/ocupada); conteo de
    topes por apartamento (activas a futuro y reservas del mes). El estado de la reserva transiciona a
    COMPLETADA al pasar el bloque y a cancelada al cancelar a tiempo.
  - **Sale:** calendario con bloques disponibles/ocupados por día; lista de reservas propias del vecino;
    historial de uso (reservas pasadas/completadas, p. ej. quién usó la sala el mes pasado); avisos de
    conflicto ("ese bloque ya fue tomado, elige otro").
- **Estados y disparadores:**
  - **Franja:** libre ↔ ocupada. Disparadores: confirmación de reserva (→ ocupada), cancelación a tiempo
    (→ libre de inmediato), baja/mudanza o cambio de apartamento del vecino (sus reservas a futuro se
    cancelan → libre de inmediato).
  - **Reserva:** activa (a futuro) → COMPLETADA (al pasar el bloque, persiste) | cancelada (cancelación
    hasta el día anterior). El mismo día del bloque ya no se puede cancelar.
  - El conflicto de concurrencia se resuelve por "primero que confirma gana"; el segundo recibe aviso y
    el calendario actualizado, sin reservas pisadas.
- **Reglas y límites:**
  - **Topes por apartamento:** máximo 2 reservas activas a futuro al mismo tiempo y no más de 4 reservas
    en el mes. Sin prioridades ni puntajes. **"El mes" = mes calendario** (del día 1 al último día del
    mes); el tope de 4 se cuenta por la **fecha del bloque reservado**, no por la fecha en que se hizo la
    reserva. (Se descartó explícitamente la ventana móvil de 30 días por ser difícil de entender.)
  - **Ventana de reserva a futuro:** se puede reservar como máximo con **30 días de anticipación** (desde
    hoy hasta +30 días, no más), para evitar que los mismos "aparten" todo el calendario. Mínimo: se puede
    reservar el **mismo día**, siempre que el bloque no haya empezado.
  - **Sin doble reserva:** nunca dos reservas sobre el mismo bloque/día.
  - **Bloques fijos:** solo los tres bloques predefinidos, bloque entero, sin medias salas ni bloques
    partidos. No se ofrecen ni aceptan bloques inexistentes o días fuera de lo permitido (se bloquean,
    no se ajustan).
  - **Mismo día:** puede haber varias reservas si son bloques distintos; de apartamentos distintos, o del
    mismo apartamento si no supera su tope.
  - **Cancelación:** solo el vecino sobre sus propias reservas, hasta el día anterior; el mismo día no.
  - **Identidad por apartamento:** lo que cuenta para topes y reservas es el apartamento, no la persona.
  - **Altas/bajas/mudanzas (administración):**
    - **Baja/mudanza** (la persona o el apartamento se da de baja): sus reservas activas a futuro se
      **cancelan** y esas franjas vuelven a **libres de inmediato**; las reservas ya **COMPLETADAS** se
      conservan en el historial tal cual.
    - **Cambio de apartamento** (mismo vecino, otro apto): las reservas a futuro quedan atadas al
      apartamento **anterior** y se cancelan/liberan; **no se arrastran** entre apartamentos (enredaría el
      conteo de topes). El vecino puede volver a reservar desde el nuevo apartamento.
    - **Alta nueva:** entra limpio, con sus topes en **cero** para el mes en curso.
  - **Normas:** el vecino acepta las normas al reservar ("acepto las normas"); el sistema solo hace
    cumplir horario de bloques, no doble reserva y topes por apartamento. El resto (limpieza, aforo, no
    fiestas tras las 10 pm, daños) es convivencia, no lo vigila la app.

## Alcance diferido (features futuras declaradas)
- **Reservar recursos extra** junto con la sala (proyector, sillas plegables, equipo de sonido).
- **Visto bueno del administrador** para algunas reservas (las de fechas señaladas).
- **Recordatorio** un par de días antes de la reserva.
- **Historial de uso de la sala** como vista dedicada (nota: el cliente sí necesita ver quién usó la sala
  el mes pasado vía reservas COMPLETADAS persistentes; la vista de "historial" como tal queda diferida).

## Fuera de alcance (excluido)
- Pagos, fianzas o depósitos — la sala es gratis, no se cobra.
- Otras salas o zonas comunes (BBQ, gimnasio, parqueadero de visitantes) — solo la sala comunitaria.
- Reservas hechas por portería en nombre del vecino — cada apartamento reserva lo suyo.
- Mostrar quién ha usado más la sala / ranking de uso para "justicia" — declarado como lujo, no necesario
  ahora (la justicia se logra solo con los topes).
- Prioridades o puntajes para repartir reservas — explícitamente no deseados.

## Huecos abiertos
Los 3 huecos previos se **resolvieron en el gate** (decisiones del cliente). **No quedan UNRESOLVED
pendientes.**
- **RESUELTO — Ventana de reserva a futuro:** máximo **30 días** de anticipación (desde hoy hasta +30
  días, no más) para evitar que los mismos aparten todo el calendario; mínimo, el **mismo día** mientras
  el bloque no haya empezado. (Ver "Reglas y límites" → Ventana de reserva a futuro.)
- **RESUELTO — Definición de "el mes" para el tope de 4:** **mes calendario** (día 1 al último del mes),
  contado por la **fecha del bloque reservado**, no por la fecha del clic; se descartó la ventana móvil de
  30 días. (Ver "Reglas y límites" → Topes por apartamento.)
- **RESUELTO — Alta/baja/mudanza de vecinos:** baja/mudanza cancela las reservas a futuro y libera las
  franjas (las COMPLETADAS se conservan); el cambio de apartamento no arrastra reservas (se cancelan en el
  apto anterior); el alta nueva entra con topes en cero. (Ver "Reglas y límites" → Altas/bajas/mudanzas.)
