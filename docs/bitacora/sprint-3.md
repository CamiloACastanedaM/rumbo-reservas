# Bitácora del Sprint 3

**Proyecto:** Rumbo · **Estudiante:** Camilo Castañeda · **Fecha de cierre:** 25/11/2026
**Repositorio:** https://github.com/CamiloACastanedaM/rumbo-reservas (tag `sprint-3`)

## 1. Recordatorio del proyecto

**Problema.** Para encontrar una escapada en Colombia hoy toca saltar entre Instagram, WhatsApp y portales internacionales, y casi nunca se sabe si las fechas están libres hasta escribirle al dueño.

**Solución.** Rumbo es una web de reservas de alojamientos turísticos en Colombia: cabañas, glamping, hoteles boutique, fincas, apartamentos y hostales.

**Usuarios.** Viajeros de 22 a 45 años que planean escapadas cortas, y el equipo que administra el catálogo.

**Alcance.** Cuatro sprints: estructura y productos (hecho), cuentas y catálogo (hecho), búsqueda y disponibilidad (este sprint), y reservas.

## 2. Objetivo del sprint

Que el viajero encuentre un alojamiento libre en sus fechas, lo guarde, lo comparta, lea las normas y las reseñas de otros huéspedes, y pueda calificar su propia estadía. Del lado del administrador, que pueda eliminar categorías.

## 3. Historias de usuario

| HU | Título | Prioridad | Estado |
|---|---|---|---|
| #22 | Buscar por texto y fechas, con sugerencias y calendario doble | Alta | ✅ Terminada |
| #23 | Ver disponibilidad en el detalle | Alta | ✅ Terminada |
| #24 | Marcar favoritos | Media | ✅ Terminada |
| #25 | Ver la lista «Mis favoritos» | Media | ✅ Terminada |
| #26 | Bloque de políticas del alojamiento | Media | ✅ Terminada |
| #27 | Compartir en redes sociales | Baja | ✅ Terminada |
| #28 | Puntuar un alojamiento | Baja | ✅ Terminada |
| #29 | Eliminar categoría | Baja | ✅ Terminada |

El plan de QA tiene 26 casos y los 26 pasaron. Detalle y capturas en [`docs/qa/sprint-3-plan.md`](../qa/sprint-3-plan.md).

## 4. Decisiones técnicas

- **Búsqueda tolerante a tildes y mayúsculas.** «medellin» encuentra «Medellín». Cada palabra tiene que aparecer en algún campo, y el orden de los resultados premia dónde aparece: el nombre pesa más que la ciudad, la ciudad más que la categoría y la categoría más que la descripción. Con un catálogo de cientos de alojamientos se hace en memoria sobre una consulta liviana. Si el catálogo crece mucho, el paso siguiente es una búsqueda de texto completo en la base.
- **La búsqueda vive en la URL** (`?buscar=&llegada=&salida=`). Recargar, volver atrás o compartir el enlace repite la misma búsqueda. Si un enlace viejo trae fechas que ya pasaron, se busca solo el texto.
- **Una estadía ocupa desde el día de llegada hasta el día anterior a la salida.** El día de salida queda libre para el siguiente huésped. La misma regla se usa en la búsqueda, en el calendario de disponibilidad y en las pruebas.
- **Calendario doble hecho a mano.** El proyecto no instala dependencias nuevas, así que el calendario es un componente propio: dos meses, la semana empieza el lunes, los días ocupados aparecen tachados, se navega con el teclado y tiene leyenda.
- **«Hoy» es el de Colombia.** La API fija la zona horaria de Bogotá al arrancar. Así un servidor en otra zona no rechaza en la noche una llegada para hoy.
- **Favoritos con respuesta inmediata.** El corazón cambia apenas se toca y, si el servidor rechaza el cambio, vuelve a como estaba y muestra un aviso. Toda la app comparte una sola lista, así los corazones y la página «Mis favoritos» siempre coinciden.
- **Solo califica quien se hospedó.** La API acepta una reseña únicamente si la persona tiene una estadía terminada en ese alojamiento y todavía sin calificar: una reseña por estadía. Las reseñas muestran el nombre y la inicial del apellido, nunca el correo.
- **Políticas editables desde el formulario del producto.** Cada alojamiento tiene sus normas (casa, salud y seguridad, cancelación). Si una política tiene título pero no descripción, o al revés, la API la rechaza en vez de perderla sin avisar.
- **Compartir sin SDK de redes.** Facebook, X y WhatsApp abren su enlace de compartir con el mensaje ya escrito. Instagram no tiene enlace para compartir desde la web, así que el mensaje se copia al portapapeles y se abre Instagram. En el celular aparece además «Más opciones», con el menú de compartir del sistema.
- **Borrar una categoría no borra sus alojamientos.** Quedan sin categoría y la confirmación dice cuántos son. El conteo llega de un endpoint de administración nuevo (`GET /api/admin/categories`).
- **Datos de demostración.** Al arrancar con base vacía se cargan tres usuarios de demostración con estadías pasadas y futuras y doce reseñas, para que la disponibilidad y las calificaciones se vean con datos reales. En producción hay que arrancar con `app.seed=false`.

## 5. Problemas y soluciones

| Problema | Causa | Solución |
|---|---|---|
| El diálogo de compartir se veía siempre, aun cerrado | Un `display: grid` en la clase del diálogo anulaba el oculto del navegador | El estilo de grilla solo se aplica con el diálogo abierto |
| El mes del calendario decía «Noviembre De 2026» | La mayúscula de CSS se aplicaba a cada palabra | Solo se pone en mayúscula la primera letra, desde el código |
| En tablet el texto de las fechas elegidas se cortaba | La columna de fechas era muy angosta | Se ensanchó la grilla del buscador |
| Conteos como «1284 reseñas» | Los números se mostraban sin separador | Todos los conteos usan el formato colombiano: «1.284 reseñas» |
| Una política larga estiraba las demás tarjetas | La grilla igualaba la altura de todas | Cada tarjeta toma la altura de su contenido |
| «2 productos» se partía en dos líneas en la tabla de categorías | La columna era angosta | El conteo no se parte |
| Una sugerencia muy larga quedaba cortada sin forma de leerla | Se recortaba con «…» | El texto completo aparece al pasar el cursor |
| Un servidor en otra zona horaria rechazaba fechas válidas en la noche | Cada lado calculaba «hoy» en su propia zona | La API usa siempre la hora de Colombia |
| Guardar dos veces lo mismo al mismo tiempo devolvía un error 500 | El choque con la restricción única no tenía manejo | Se responde 409 con un mensaje claro |
| Tocar un corazón mientras cargaba la lista de favoritos lo desmarcaba | La carga inicial pisaba el cambio | La carga ya no pisa un cambio hecho mientras llegaba |

## 6. Retrospectiva

**Mantener**
- El guion de navegador que recorre todo el plan de QA. Encontró el defecto del diálogo de compartir, que las pruebas automáticas no veían.
- Probar con datos extremos (nombres y textos largos, miles de reseñas) antes de cerrar. Salieron cuatro defectos de presentación.
- Revisar el código ya terminado en tres pasadas separadas: limpieza, defectos y seguridad. Cada una encontró cosas distintas.

**Mejorar**
- Definir desde el primer día del sprint qué zona horaria manda en las fechas. Se descubrió tarde, en la revisión.
- Extraer antes las piezas repetidas. La carga de datos con reintento y el cierre de menús al tocar afuera se copiaron en varios componentes hasta la limpieza final.

## 7. Próximo sprint

Sprint 4, reservas:
- elegir fechas desde el detalle con «Reservar», pidiendo iniciar sesión si hace falta;
- página de reserva con los datos del alojamiento y del huésped;
- confirmar la reserva, con mensajes claros cuando las fechas ya no están libres;
- historial «Mis reservas», con «Calificar» en las estadías terminadas;
- botón flotante de WhatsApp en el detalle;
- correo de confirmación de la reserva.
