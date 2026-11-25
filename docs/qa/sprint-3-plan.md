# Plan de pruebas QA — Sprint 3

**Proyecto:** Rumbo · **Sprint:** 3 · **Responsable QA:** Camilo Castañeda · **Fecha de ejecución:** 25/11/2026

## Alcance

Historias #22 a #29 del Sprint 3: búsqueda, disponibilidad, favoritos, lista de favoritos, bloque de políticas, compartir en redes, puntuar producto y eliminar categoría. Cada criterio de aceptación tiene al menos un caso de prueba.

## Entorno

| Elemento | Valor |
|---|---|
| Frontend | React 19 + Vite 8, `http://localhost:5173` |
| Backend | Spring Boot 4.2 (Java 21) con Spring Security + JWT, `http://localhost:8080` |
| Base de datos | MySQL 8.4 en Docker, con los datos de ejemplo más 3 políticas por alojamiento y estadías y reseñas de ejemplo (fechas relativas al día de arranque) |
| Navegador | Microsoft Edge (Chromium) automatizado, anchos 375, 768 y 1440 px |
| Cuentas | Administrador inicial (`ADMIN_EMAIL` del `.env`), Laura Restrepo (usuaria sin estadías) y Valentina Gómez (usuaria de ejemplo con estadías terminadas y próximas) |

Las capturas están en [`evidence/sprint-3/`](evidence/sprint-3/). Los casos se ejecutaron con un guion de navegador que hace los mismos clics que una persona y además consulta la API y la base de datos para confirmar el resultado.

## Casos de prueba

| ID | HU | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| CP-01 | #22 Realizar búsqueda | Inicio | Mirar el bloque buscador | Título visible y párrafo descriptivo | «Encuentra tu próximo rumbo» y un párrafo que explica qué buscar, a 375, 768 y 1440 px | ✅ | [1440](evidence/sprint-3/busqueda-sugerencias-1440.jpg) |
| CP-02 | #22 Realizar búsqueda | Inicio | Escribir «sal» en «Destino o alojamiento» | Sugerencias que autocompletan | Aparecen «Salento, Quindío» y «Hotel Plaza de Salento»; con flecha abajo y Enter se completa el campo | ✅ | [375](evidence/sprint-3/busqueda-sugerencias-375.jpg), [768](evidence/sprint-3/busqueda-sugerencias-768.jpg), [1440](evidence/sprint-3/busqueda-sugerencias-1440.jpg) |
| CP-03 | #22 Realizar búsqueda | Inicio | Tocar «Fechas» y elegir llegada y salida | Calendario doble para elegir un rango | Se abren dos meses (uno debajo del otro en celular), los días pasados están tachados y el rango queda marcado; el campo muestra «27 de nov – 1 de dic» | ✅ | [375](evidence/sprint-3/busqueda-calendario-375.jpg), [768](evidence/sprint-3/busqueda-calendario-768.jpg), [1440](evidence/sprint-3/busqueda-calendario-1440.jpg) |
| CP-04 | #22 Realizar búsqueda | Texto y fechas elegidos | Tocar «Realizar búsqueda» | Resultados relevantes, claros y ordenados, y las secciones de categorías y recomendaciones siguen en el inicio | Sección «Resultados de tu búsqueda» con el resumen (cantidad, texto y fechas), solo alojamientos de Salento libres en esas fechas; debajo siguen «Categorías» y «Recomendaciones» | ✅ | [375](evidence/sprint-3/busqueda-resultados-375.jpg), [768](evidence/sprint-3/busqueda-resultados-768.jpg), [1440](evidence/sprint-3/busqueda-resultados-1440.jpg) |
| CP-05 | #22 Realizar búsqueda | Inicio | Buscar «medellin» (sin tilde) | La búsqueda ignora tildes y mayúsculas y ordena por relevancia | El primer resultado es de Medellín; también aparece un alojamiento cuya descripción menciona Medellín | ✅ | — |
| CP-06 | #22 Realizar búsqueda | Un alojamiento con una reserva | Buscar con las fechas de esa reserva (API y página) | El alojamiento ocupado no aparece | 18 de 20 alojamientos; el ocupado queda fuera | ✅ | — |
| CP-07 | #22 Realizar búsqueda | Inicio | Buscar «zzzz» y luego «Limpiar búsqueda» | Mensaje claro sin resultados y forma de volver | «No encontramos alojamientos para «zzzz».» con sugerencias; al limpiar desaparece la sección y la URL queda sin búsqueda | ✅ | [sin resultados](evidence/sprint-3/busqueda-sin-resultados-1440.jpg) |
| CP-08 | #23 Visualizar disponibilidad | Detalle de un alojamiento con reservas | Bajar al bloque «Disponibilidad» | Calendario doble que distingue las fechas ocupadas | Dos meses; los días reservados aparecen tachados, en rojo y con rayas; leyenda «Disponible / Ocupado» | ✅ | [375](evidence/sprint-3/disponibilidad-375.jpg), [768](evidence/sprint-3/disponibilidad-768.jpg), [1440](evidence/sprint-3/disponibilidad-1440.jpg) |
| CP-09 | #23 Visualizar disponibilidad | La consulta de fechas falla (red cortada) | Abrir el detalle, luego tocar «Reintentar» con la red de vuelta | Mensaje claro y opción de intentar de nuevo | «No pudimos obtener las fechas disponibles en este momento.» y botón «Reintentar»; al reintentar aparece el calendario | ✅ | [error](evidence/sprint-3/disponibilidad-error-1440.jpg) |
| CP-10 | #24 Marcar como favorito | Sin sesión | Tocar el corazón de una tarjeta del inicio | Invitación a iniciar sesión | Aviso «Inicia sesión para guardar alojamientos en tus favoritos.» con botón «Iniciar sesión», que lleva al login con un mensaje y regresa al inicio | ✅ | [anónimo](evidence/sprint-3/favorito-anonimo-1440.jpg) |
| CP-11 | #24 Marcar como favorito | Sesión de Laura | Tocar el corazón de una tarjeta | Se marca con un solo clic, en cualquier dispositivo | El corazón se rellena al instante y la API guarda el favorito, en 375, 768 y 1440 px | ✅ | [375](evidence/sprint-3/favorito-marcado-375.jpg), [768](evidence/sprint-3/favorito-marcado-768.jpg), [1440](evidence/sprint-3/favorito-marcado-1440.jpg) |
| CP-12 | #25 Listar favoritos | Sesión de Laura con favoritos | Menú de la cuenta → «Mis favoritos» | Lista accesible desde la cuenta | Página «Mis favoritos» con las tarjetas guardadas, en 375, 768 y 1440 px | ✅ | [375](evidence/sprint-3/mis-favoritos-375.jpg), [768](evidence/sprint-3/mis-favoritos-768.jpg), [1440](evidence/sprint-3/mis-favoritos-1440.jpg) |
| CP-13 | #25 Listar favoritos | En «Mis favoritos» | Tocar el corazón de una tarjeta | Se quita de la lista directamente | La tarjeta sale de la lista y de la base de datos | ✅ | [quitado](evidence/sprint-3/mis-favoritos-quitado-1440.jpg) |
| CP-14 | #25 Listar favoritos | En «Mis favoritos» | Ir al inicio, marcar otro favorito y volver | La lista se actualiza sola | El nuevo favorito aparece sin recargar la página | ✅ | — |
| CP-15 | #26 Bloque de políticas | Detalle de un alojamiento | Bajar al bloque de políticas | Bloque al 100 % del contenedor, título subrayado, políticas en columnas con título y descripción | «Políticas del alojamiento» subrayado; 3 políticas con título y descripción en 3 columnas (1440), 2 (768) y 1 (375) | ✅ | [375](evidence/sprint-3/politicas-375.jpg), [768](evidence/sprint-3/politicas-768.jpg), [1440](evidence/sprint-3/politicas-1440.jpg) |
| CP-16 | #26 Bloque de políticas | Administrador | Editar un producto | Las políticas se administran desde el producto | Sección «Políticas» con una fila por política (título y descripción), «Agregar política» y «Quitar» | ✅ | [editor](evidence/sprint-3/admin-politicas-1440.jpg) |
| CP-17 | #27 Compartir productos | Detalle | Tocar «Compartir» | Ventana con imagen, descripción breve y enlace directo | Ventana «Compartir alojamiento» con la foto principal, la descripción recortada, el enlace y botón «Copiar» | ✅ | [375](evidence/sprint-3/compartir-375.jpg), [1440](evidence/sprint-3/compartir-1440.jpg) |
| CP-18 | #27 Compartir productos | Ventana abierta | Editar el mensaje, elegir Facebook, X y WhatsApp y compartir | Elegir la red, mensaje personalizado y redirección a la red | Se abre el enlace de cada red (`facebook.com/sharer`, `x.com/intent/tweet`, `wa.me`) con el mensaje escrito y el enlace del alojamiento | ✅ | — |
| CP-19 | #27 Compartir productos | Ventana abierta | Elegir Instagram y compartir | Integración adecuada con la red | Aviso de que Instagram no permite publicar desde otra página; se copian el mensaje y el enlace y se abre Instagram | ✅ | [Instagram](evidence/sprint-3/compartir-instagram-1440.jpg) |
| CP-20 | #28 Puntuar producto | Sin sesión / Laura sin estadías | Abrir el detalle | Solo quien terminó una reserva puede puntuar | Sin sesión: «¿Te hospedaste aquí? Inicia sesión para calificar.»; Laura: «Podrás calificarlo cuando termines una estadía aquí.»; no se muestra el formulario | ✅ | — |
| CP-21 | #28 Puntuar producto | Valentina con una estadía terminada | Elegir 5 estrellas, escribir un comentario y «Publicar reseña» | La reseña se publica y el promedio se actualiza al instante | La reseña aparece primera con estrellas, «Valentina G.», fecha y comentario; el promedio y el total cambian en la sección y junto al título | ✅ | [formulario](evidence/sprint-3/resena-formulario-1440.jpg), [publicada](evidence/sprint-3/resenas-1440.jpg), [375](evidence/sprint-3/resenas-375.jpg) |
| CP-22 | #28 Puntuar producto | Inicio | Buscar «salento» | Promedio y total de valoraciones en los resultados | Cada tarjeta muestra «★ 4,0 · 1 reseña» o «Sin reseñas aún» | ✅ | [resultados](evidence/sprint-3/busqueda-resultados-768.jpg) |
| CP-23 | #29 Eliminar categoría | Administrador, categoría con 1 producto | Panel → «Lista de categorías» → «Eliminar categoría» | Opción clara y confirmación que nombra la categoría y sus consecuencias, con «Confirmar» y «Cancelar» | «¿Eliminar la categoría «Temporal QA …»?» y «1 producto quedará sin categoría: seguirá publicado…» | ✅ | [lista](evidence/sprint-3/admin-lista-categorias-1440.jpg), [confirmación](evidence/sprint-3/admin-eliminar-categoria-1440.jpg) |
| CP-24 | #29 Eliminar categoría | Ventana de confirmación | Tocar «Cancelar» | No cambia nada | La categoría sigue en la API | ✅ | — |
| CP-25 | #29 Eliminar categoría | Ventana de confirmación | Tocar «Confirmar» | Se elimina la categoría; sus productos quedan sin categoría | Aviso «Eliminaste la categoría…»; el producto sigue publicado, sin categoría | ✅ | [eliminada](evidence/sprint-3/admin-categoria-eliminada-1440.jpg) |
| CP-26 | General | Todas las páginas probadas | Revisar la consola del navegador | Sin errores | Sin errores en consola | ✅ | — |

## Pruebas automáticas

| Suite | Comando | Resultado |
|---|---|---|
| Backend (JUnit 5 + MockMvc + Spring Security Test, H2 en modo MySQL) | `cd backend && ./mvnw test` | 22 pruebas, 0 fallas (incluye la política incompleta) |
| Frontend (Vitest + Testing Library) | `cd frontend && npm test` | 24 pruebas, 0 fallas |
| Build de producción | `cd frontend && npm run build` | Correcto |

Backend, nuevas en este sprint:
- búsqueda por texto sin tildes, por categoría y por fechas libres (el día de salida queda libre para el siguiente huésped);
- fechas inválidas en la búsqueda: pasadas, salida igual a la llegada y formato erróneo (400);
- sugerencias desde 2 letras y disponibilidad solo con estadías futuras (404 si el alojamiento no existe);
- favoritos: 401 sin sesión, agregar dos veces sin duplicar, 404 con un producto inexistente, quitar, y borrar un producto que alguien tiene en favoritos;
- reseñas: 401 sin sesión, 403 sin estadía terminada, validación de 1 a 5 estrellas, promedio y total en el detalle y en la búsqueda, y una sola reseña por estadía;
- políticas en el detalle;
- eliminar categoría: 401, 403, 204 y 404, con los productos sin categoría.

Frontend, nuevas en este sprint:
- sugerencias con teclado y resultados con las secciones del inicio intactas;
- rango del calendario doble enviado a la búsqueda;
- días ocupados tachados y error de disponibilidad con «Reintentar»;
- favorito sin sesión (no llama a la API) y con sesión, más la página «Mis favoritos» que sigue la lista compartida;
- bloque de políticas, ventana de compartir y reseña que actualiza el promedio;
- confirmación al eliminar una categoría, con «Cancelar» y «Confirmar».

## Prueba de datos extremos

Se cargaron, en la frontera de la API, los valores más largos que esta acepta: un nombre de alojamiento de 116 caracteres, una ciudad de 80, una categoría de 74, una política de 1.000 caracteres, un comentario de 1.000, un enlace largo sin espacios, un nombre de usuario largo y 1.284 reseñas. Se revisaron a 375 y 1440 px. Se corrigieron cuatro defectos:

- los conteos grandes salían sin separador de miles («1284 reseñas»);
- una política larga estiraba todas las tarjetas de su fila a la misma altura;
- en la lista de categorías, «2 productos» se partía en dos líneas;
- las sugerencias largas se recortaban sin forma de leerlas completas.

## Resumen

26 casos ejecutados, 26 aprobados (el guion de navegador hizo 56 comprobaciones). Durante el sprint se encontraron y corrigieron estos defectos:

- la ventana de compartir se veía siempre al final del detalle, porque su estilo pisaba el ocultamiento de las ventanas cerradas;
- los meses del calendario salían como «Noviembre De 2026»;
- en tablet el rango de fechas se recortaba en el buscador;
- los cuatro defectos de la prueba de datos extremos.

La revisión de código final encontró y corrigió cuatro defectos más, cada uno con su prueba o verificación:

- con el servidor en otra zona horaria, una búsqueda que llegaba hoy podía rechazarse en la noche (ahora «hoy» es el de Colombia);
- dos peticiones iguales al mismo tiempo (un favorito o una reseña) devolvían un error 500 (ahora responden 409 con un mensaje claro);
- una política con título y sin descripción se perdía sin aviso (ahora la API la rechaza con un mensaje);
- un enlace compartido con fechas que ya pasaron terminaba en un error (ahora busca solo el texto).
