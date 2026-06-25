# Decisions Library — Conocimiento del motor sobre el producto del cliente

> Conocimiento TRANSVERSAL (los 6 arneses) que el motor acumula sobre **este producto**
> (Reservas Sala Comunitaria). Lo consolida A (Governor) a lo largo de las fases.

## Índice

| ID | Fase | Decisión (1 línea) | Estado |
|----|------|--------------------|--------|
| DL-001 | `010_discovery` | "El mes" del tope de 4 = mes calendario, contado por la fecha del bloque reservado | FIRME |
| DL-002 | `010_discovery` | Ventana de reserva a futuro = máx. 30 días de anticipación; mín. el mismo día si el bloque no empezó | FIRME |
| DL-003 | `010_discovery` | Baja/mudanza/cambio de apartamento cancela las reservas a futuro y libera franjas; nunca se arrastran entre apartamentos | FIRME |
| DL-004 | `010_discovery` | La identidad de reserva y de topes es el **apartamento**, no la persona | FIRME |
| DL-005 | `010_discovery` | Cancelación y transición a COMPLETADA se modelan como una sola slice (stab-04) por compartir ciclo de vida | FIRME |
| DL-006 | `020_architecture` | Estilo efectivo = ESTRICTO + PLANO (Clean/Hexagonal 4 capas); ORM relaxed rechazado por checklist | FIRME |
| DL-007 | `020_architecture` | AuthN/Z = jwt_backend propio (passlib/bcrypt), roles vecino/admin; sin proveedor externo | FIRME |
| DL-008 | `020_architecture` | Atomicidad de "sin doble reserva" (stab-03) = constraint único en PostgreSQL + transacción; sin Redis | FIRME |
| DL-009 | `020_architecture` | Stack mínimo (E4): 0 adiciones; descartados pagos, Redis, pgvector/FTS, correo/ARQ (diferidos a evol-03), Sentry, Biome, pyright | FIRME |
| DL-010 | `020_architecture` | Transición a COMPLETADA (stab-04) = derivada en lectura; sin scheduler andamiado en el 020 | FIRME |

---

## DL-001 — Definición de "el mes" para el tope mensual
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:42:29Z · **Estado:** FIRME
**Contexto:** El scope fijaba "no más de 4 reservas en el mes" sin definir "el mes" (hueco UNRESOLVED levantado por el behavior-questioner). Resuelto por el cliente en el gate vía `/caden-review`.
**Decisión:** "El mes" = **mes calendario** (día 1 al último del mes). El tope se cuenta por la **fecha del bloque reservado**, no por la fecha en que se hace la reserva. Se descartó explícitamente la ventana móvil de 30 días por ser difícil de entender para los vecinos.
**Consecuencias:** Regla aterrizada en `stab-02` (topes por apartamento). El modelo de datos (Arnés 020+) debe contar reservas agrupando por mes calendario de la fecha del bloque.

## DL-002 — Ventana de reserva a futuro
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:42:29Z · **Estado:** FIRME
**Contexto:** El scope no acotaba el horizonte temporal de reserva (hueco UNRESOLVED). Resuelto en el gate.
**Decisión:** Máximo **30 días** de anticipación (de hoy a hoy+30 inclusive); mínimo el **mismo día** mientras el bloque no haya empezado. Razón del cliente: evitar que los mismos "aparten" todo el calendario (refuerza la justicia, ver [[DL-001]]).
**Consecuencias:** Regla aterrizada en `stab-01` (validar bloque y día). La disponibilidad del calendario nunca ofrece días > hoy+30.

## DL-003 — Altas, bajas y mudanzas de vecinos
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:42:29Z · **Estado:** FIRME
**Contexto:** No estaba definido qué pasa con las reservas activas ante baja o cambio de apartamento (hueco UNRESOLVED). Resuelto en el gate.
**Decisión:** Baja/mudanza → cancela las reservas activas a futuro y libera sus franjas de inmediato; las COMPLETADAS se conservan en historial. Cambio de apartamento → las reservas a futuro quedan atadas al apto anterior y se cancelan/liberan (no se arrastran, para no enredar el conteo de topes); el vecino re-reserva desde el nuevo. Alta nueva → topes en cero para el mes en curso.
**Consecuencias:** Reglas aterrizadas en `final-01` (gestión administrativa). Acopla la gestión de padrón con el ciclo de vida de reservas ([[DL-004]]).

## DL-004 — La identidad de reserva es el apartamento, no la persona
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:28:07Z · **Estado:** FIRME
**Contexto:** Varias personas pueden compartir un apartamento (pareja, padre/hijo). El cliente fue explícito en el cuestionario.
**Decisión:** Lo que cuenta para reservas y topes es el **apartamento**. Varias personas del mismo apartamento comparten contador de topes y operan como la misma unidad. Padrón fijo de 48 apartamentos (torres A/B, 101–802); sin auto-registro (alta solo por administración).
**Consecuencias:** Constraint transversal al modelo de datos y a la autenticación (Arnés 020+). Atraviesa `stab-02` (topes por apartamento) y `final-01` (altas).

## DL-005 — Cancelación + COMPLETADA como una sola slice
**Fase:** `010_discovery` · **Fecha:** 2026-06-25T12:30:25Z · **Estado:** FIRME
**Contexto:** Decisión de slicing del epic-slicer al triturar la Épica "reglas de reserva".
**Decisión:** La cancelación (hasta el día anterior; mismo día no) y la transición automática a COMPLETADA al pasar el bloque se modelan juntas en `stab-04` por compartir el mismo ciclo de vida de la reserva (MECE: un solo concern de "ciclo de vida").
**Consecuencias:** `stab-04` cubre ambos disparadores; `evol-04` (historial) depende de las COMPLETADAS persistidas aquí.

## DL-006 — Estilo arquitectónico efectivo: ESTRICTO + PLANO
**Fase:** `020_architecture` · **Fecha:** 2026-06-25T18:00:29Z · **Estado:** FIRME
**Contexto:** El gate de decisión (CP-01g) debía cerrar D-G (modo ORM) y D-N (topología) con criterio determinista, no a ojo.
**Decisión:** **ORM estricto** (mapper ORM↔dominio, dataclasses puras en `domain`): la checklist §5.1 falló 4 de 6 casillas — el dominio tiene reglas no-CRUD (topes [[DL-001]], ventana [[DL-002]]), invariantes/máquina de estados ([[DL-005]]), workflows multi-paso ([[DL-003]]) e integración externa diferida (evol-03). **Topología plana** (monolito en capas): ningún criterio §2.5 de multi-dominio se cumple (~5-6 entidades, 1 bounded context).
**Consecuencias:** Scaffold `backend/src/{domain,application,infrastructure,interface}` sin módulos; policía import-linter con 4 contratos de capa (sin contratos inter-módulo). Guía a los arneses 030–050.

## DL-007 — Autenticación: JWT propio del backend
**Fase:** `020_architecture` · **Fecha:** 2026-06-25T18:00:29Z · **Estado:** FIRME
**Contexto:** D-A abierta en el gate; default adaptable jwt_backend.
**Decisión:** **jwt_backend** (passlib/bcrypt; access+refresh; autorización por rol/scope vía `Depends()` en la capa de aplicación). Se descartaron Auth.js y proveedor gestionado: el acceso es solo por correo dado de alta por la administración, sin auto-registro, con roles **vecino** y **admin** ([[DL-004]], evol-02, final-01). No se piden proveedores sociales.
**Consecuencias:** El puerto de identidad vive en `application`; condiciona contratos (030) y pruebas de abuso (060).

## DL-008 — Atomicidad de "sin doble reserva" sin Redis
**Fase:** `020_architecture` · **Fecha:** 2026-06-25T18:00:29Z · **Estado:** FIRME
**Contexto:** stab-03 exige que ante dos confirmaciones concurrentes gane el primero; el stack base ofrecía Redis.
**Decisión:** La integridad/atomicidad se resuelve con **constraint único en PostgreSQL** (apartamento/bloque/día activos) + **transacción (Unit of Work)**, no con Redis. Redis se descarta (no hay necesidad de caché/sesiones/cola en este alcance).
**Consecuencias:** El repositorio de Reservas (infraestructura) lleva el constraint; sin servicio extra que operar. Ver [[DL-009]].

## DL-009 — Stack mínimo: 0 adiciones, varios descartes (E4)
**Fase:** `020_architecture` · **Fecha:** 2026-06-25T18:00:29Z · **Estado:** FIRME
**Contexto:** Base adaptable (D-027): el adapter verifica aplicabilidad pieza por pieza contra el roadmap.
**Decisión:** **0 adiciones** sobre la base. **Descartados** por no aportar al roadmap (E4): pagos+webhook, pgvector/FTS, Redis ([[DL-008]]), ARQ/Celery, correo transaccional, Sentry, Biome, pyright. Correo y background quedan **condicionales** a `evol-03` (no andamiados hoy).
**Consecuencias:** Laboratorio liviano; el puerto de notificación/correo se provisiona al construir evol-03 (Modo Ajuste). Ver [[DL-010]].

## DL-010 — Transición a COMPLETADA derivada en lectura
**Fase:** `020_architecture` · **Fecha:** 2026-06-25T18:00:29Z · **Estado:** FIRME
**Contexto:** stab-04 exige que al pasar el bloque la reserva pase a COMPLETADA; se debatió scheduler vs estado derivado.
**Decisión:** **Derivada en lectura** (estado calculado al consultar) en el 020; reconciliación periódica (job/ARQ) queda como opción futura. Evita andamiar un scheduler ahora (E4, [[DL-009]]).
**Consecuencias:** Sin infraestructura de jobs en el scaffold; la lógica de derivación se implementa en `application` (050). evol-04 (historial) lee las COMPLETADAS ([[DL-005]]).
