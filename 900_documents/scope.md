# scope.md — Descripción de alto nivel del proyecto

> Insumo del Arnés 010 (Discovery) para el **banco de prueba E9**. Copia este contenido tal cual a
> `900_documents/scope.md` de la carpeta-cliente antes de `/caden-discovery`. Describe comportamiento y
> datos, **no** tecnología (a propósito incluye una ambigüedad para ejercitar el bucle de aclaración).

## Producto

Una app web para que los vecinos de un edificio gestionen las **reservas de la sala comunitaria**
(la sala de eventos del primer piso). Hoy se apuntan en una hoja de papel en portería y hay líos:
dos familias reservan el mismo sábado, nadie sabe si está libre, y siempre reservan los mismos.

## Qué hace el usuario (recorrido principal)

Un vecino entra, mira si la sala está libre para el día y la franja que quiere, y **reserva** esa
franja (por ejemplo, "sábado 5 de julio, de 18:00 a 22:00, cumpleaños de mi hija"). Después puede
**ver sus reservas** y **cancelar** una si le cambian los planes. Quiero que las reservas sean
**justas para todos los vecinos**, que no se pueda reservar una franja ya ocupada, y que se respeten
las normas de uso de la sala.

## Datos

- De cada **reserva**: quién reserva (vecino + apartamento), día y franja horaria, y un motivo corto.
- De la **sala**: su horario permitido y la duración máxima de una reserva.
- Estado de cada franja: **libre** u **ocupada**.

## Reglas o límites que importan

- **No** se puede reservar una franja que **ya está ocupada** (nada de dobles reservas).
- Solo se reserva **dentro del horario permitido** de la sala y respetando la **duración máxima**.
- Las reservas deben ser **justas entre vecinos** (no quiero que siempre reserve la misma familia).
- Un vecino solo puede **cancelar sus propias** reservas.

## Más adelante me gustaría (no es para la primera versión)

- Poder reservar **recursos extra** junto con la sala (el proyector, sillas plegables, el equipo de
  sonido).
- Que algunas reservas (las de fechas señaladas) necesiten el **visto bueno del administrador**.
- Que me llegue un **recordatorio** un par de días antes de mi reserva.
- Ver un **historial** de uso de la sala.
