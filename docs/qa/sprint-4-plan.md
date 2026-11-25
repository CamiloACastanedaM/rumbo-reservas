# Plan de pruebas QA — Sprint 4

**Proyecto:** Rumbo · **Sprint:** 4 · **Responsable QA:** Camilo Castañeda · **Fecha de ejecución:** 25/11/2026

## Alcance

Historias #30 a #35 del Sprint 4: seleccionar fechas, página de reserva, realizar la reserva, historial de reservas, botón de WhatsApp y correo de confirmación. Cada criterio de aceptación tiene al menos un caso de prueba.

## Entorno

| Elemento | Valor |
|---|---|
| Frontend | React 19 + Vite 8, `http://localhost:5173` |
| Backend | Spring Boot 4.2 (Java 21) con Spring Security + JWT, `http://localhost:8080` |
| Base de datos | MySQL 8.4 en Docker, con los datos de ejemplo, estadías de ejemplo y un WhatsApp de demostración en cada alojamiento |
| Correo | Mailpit en Docker (`http://localhost:8025`), que recibe todo lo que envía la API |
| Navegador | Microsoft Edge (Chromium) automatizado, anchos 375, 768 y 1440 px |
| Cuentas | Laura Restrepo (usuaria que reserva en las pruebas) y Valentina Gómez (usuaria de ejemplo con estadías terminadas y próximas) |

Las capturas están en [`evidence/sprint-4/`](evidence/sprint-4/). Los casos se ejecutaron con un guion de navegador que hace los mismos clics que una persona y además consulta la API, la base de datos y el buzón de Mailpit para confirmar el resultado. Al terminar, el guion borra las reservas que creó.

## Casos de prueba

| ID | HU | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| CP-01 | #30 Seleccionar fechas | Sin sesión, detalle de «Refugio Alto de Minca» | Tocar «Reservar» | Solo se reserva con sesión; mensaje que pide iniciar sesión o registrarse | El login muestra «Debes iniciar sesión para reservar. Si no tienes cuenta, regístrate: toma menos de un minuto.» | ✅ | [375](evidence/sprint-4/reserva-login-obligatorio-375.jpg), [1440](evidence/sprint-4/reserva-login-obligatorio-1440.jpg) |
| CP-02 | #30 Seleccionar fechas | Login abierto desde «Reservar» | Iniciar sesión con Laura | Se vuelve a la reserva sin perder el camino | Tras el login se abre `/producto/3/reservar` | ✅ | — |
| CP-03 | #30 Seleccionar fechas | API | Buscar con un rango de fechas | La búsqueda por fechas devuelve solo alojamientos libres | 19 alojamientos libres del 28 al 30 de noviembre | ✅ | — |
| CP-04 | #30 Seleccionar fechas | Página de reserva de un alojamiento con estadías | Elegir una llegada antes de una estadía ocupada y una salida después | No se puede elegir un rango con días ocupados; mensaje claro | «Ese rango incluye días ocupados (tachados). Elige una salida antes del primer día ocupado o cambia la llegada.» y el campo queda en «… – elige la salida» | ✅ | [375](evidence/sprint-4/reserva-rango-ocupado-375.jpg), [768](evidence/sprint-4/reserva-rango-ocupado-768.jpg), [1440](evidence/sprint-4/reserva-rango-ocupado-1440.jpg) |
| CP-05 | #30 Seleccionar fechas | Llegada elegida | Elegir como salida el primer día ocupado | El rango elegido se ve en el campo de fechas | «28 de nov – 30 de nov · 2 noches»; el día ocupado sirve como salida porque ese día el huésped se va | ✅ | [375](evidence/sprint-4/reserva-fechas-elegidas-375.jpg), [768](evidence/sprint-4/reserva-fechas-elegidas-768.jpg), [1440](evidence/sprint-4/reserva-fechas-elegidas-1440.jpg) |
| CP-06 | #31 Página de reserva | Sesión de Laura | Abrir «Reservar» | Datos del producto, datos del usuario (nombre, apellido y correo) y botón para confirmar | Galería, dirección, categoría, descripción, lo más destacado y políticas; «Laura», «Restrepo» y su correo en campos de solo lectura; botón «Confirmar reserva» | ✅ | [375](evidence/sprint-4/reserva-pagina-375.jpg), [768](evidence/sprint-4/reserva-pagina-768.jpg), [1440](evidence/sprint-4/reserva-pagina-1440.jpg) |
| CP-07 | #32 Realizar reserva | Página de reserva sin fechas | Tocar «Confirmar reserva» | Mensaje específico | «Elige en el calendario el día de llegada y el de salida.» y el foco va al campo de fechas | ✅ | — |
| CP-08 | #32 Realizar reserva | Fechas elegidas; otra persona reserva esas fechas antes | Tocar «Confirmar reserva» | Mensaje específico que explica cómo corregirlo | «Alguien reservó parte de esas fechas. Elige otro rango: los días tachados del calendario ya están ocupados.»; el calendario se actualiza con esos días tachados | ✅ | [1440](evidence/sprint-4/reserva-error-fechas-tomadas-1440.jpg) |
| CP-09 | #32 Realizar reserva | Fechas libres | Llenar huéspedes (3), hora de llegada (15:30), teléfono y notas, y confirmar | Se pueden agregar datos opcionales y se confirma el éxito | Página «¡Reserva confirmada!» con todos los datos; en la base quedan 3 huéspedes, `300 555 1234`, 15:30 y la nota | ✅ | [formulario 375](evidence/sprint-4/reserva-formulario-lleno-375.jpg), [formulario 1440](evidence/sprint-4/reserva-formulario-lleno-1440.jpg), [confirmada 375](evidence/sprint-4/reserva-confirmada-375.jpg), [768](evidence/sprint-4/reserva-confirmada-768.jpg), [1440](evidence/sprint-4/reserva-confirmada-1440.jpg) |
| CP-10 | #33 Historial | Sesión de Valentina | Menú de la cuenta → «Mis reservas» | Lista de reservas desde la cuenta | El menú tiene «Mis reservas»; la página lista 8 reservas | ✅ | [375](evidence/sprint-4/mis-reservas-375.jpg), [768](evidence/sprint-4/mis-reservas-768.jpg), [1440](evidence/sprint-4/mis-reservas-1440.jpg) |
| CP-11 | #33 Historial | En «Mis reservas» | Revisar cada tarjeta y el orden | Producto, fecha de la reserva y fechas de la estadía, de la más reciente a la más antigua | Cada tarjeta muestra foto, nombre, ciudad, estado (Próxima, En curso o Finalizada), estadía, huéspedes, total y «Reservada el»; orden por llegada descendente | ✅ | — |
| CP-12 | #33 Historial | Estadía terminada sin reseña | Tocar «Calificar» | Opción de calificar desde el historial | Lleva a la sección de reseñas del alojamiento | ✅ | [1440](evidence/sprint-4/mis-reservas-1440.jpg) |
| CP-13 | #34 WhatsApp | Detalle, sin sesión | Mirar la esquina inferior derecha | Botón flotante siempre visible abajo a la derecha | Botón verde «WhatsApp» fijo en la esquina, en 375, 768 y 1440 px | ✅ | [375](evidence/sprint-4/whatsapp-375.jpg), [768](evidence/sprint-4/whatsapp-768.jpg), [1440](evidence/sprint-4/whatsapp-1440.jpg) |
| CP-14 | #34 WhatsApp | Detalle | Tocar el botón | Abre WhatsApp con el anfitrión y confirma el envío | Se abre `wa.me/573000000000` con el mensaje «Hola, vi «Refugio Alto de Minca» en Rumbo…» y aparece «Abrimos WhatsApp con tu mensaje listo…» | ✅ | — |
| CP-15 | #34 WhatsApp | Sin conexión / número inválido | Tocar el botón | Mensajes de error claros | «No tienes conexión a internet. Conéctate y vuelve a intentarlo.» y «Este alojamiento todavía no tiene un WhatsApp válido…» | ✅ | [sin conexión](evidence/sprint-4/whatsapp-sin-conexion-1440.jpg) |
| CP-16 | #34 WhatsApp | Detalle | Bajar a las políticas | Aviso de privacidad sobre los datos compartidos por WhatsApp | Tarjeta «Privacidad en WhatsApp» dentro de las políticas | ✅ | [1440](evidence/sprint-4/whatsapp-privacidad-1440.jpg) |
| CP-17 | #35 Correo | Reserva confirmada (CP-09) | Abrir el buzón de Mailpit | Correo con los detalles, fecha y hora de la reserva y datos de contacto del proveedor, legible en cualquier dispositivo | «Reserva confirmada: Refugio Alto de Minca» con alojamiento, dirección, llegada, salida, estadía, total, «Reservada el» con hora y el WhatsApp del anfitrión; se lee bien a 375 y 1440 px | ✅ | [375](evidence/sprint-4/correo-reserva-375.jpg), [1440](evidence/sprint-4/correo-reserva-1440.jpg) |
| CP-18 | General | Todas las páginas probadas | Revisar la consola del navegador | Sin errores | Sin errores en consola | ✅ | — |

## Pruebas automáticas

| Suite | Comando | Resultado |
|---|---|---|
| Backend (JUnit 5 + MockMvc + Spring Security Test, H2 en modo MySQL) | `cd backend && ./mvnw test` | 27 pruebas, 0 fallas |
| Frontend (Vitest + Testing Library) | `cd frontend && npm test` | 32 pruebas, 0 fallas |
| Build de producción | `cd frontend && npm run build` | Correcto |

Backend, nuevas en este sprint:
- reservar exige sesión; la reserva guarda los datos opcionales y dispara el correo con los datos del anfitrión;
- dos reservas que se cruzan responden 409, y el día de salida queda libre para la siguiente;
- fechas pasadas, salida igual a la llegada, más de 30 noches, huéspedes fuera de 1 a 20, teléfonos sin dígitos o demasiado largos y alojamiento inexistente responden con su mensaje;
- el historial va de la más reciente a la más antigua, con estado y «Calificar»;
- el detalle incluye el WhatsApp del anfitrión.

Frontend, nuevas en este sprint:
- «Reservar» sin sesión lleva al login con el aviso y el camino de vuelta;
- el rango elegido se ve en el campo de fechas y un rango con días ocupados se rechaza;
- la página de reserva muestra el alojamiento y al usuario, envía los datos opcionales y termina en la confirmación;
- el error 409 se explica;
- historial con estados y «Calificar», y aviso de iniciar sesión;
- WhatsApp: apertura con mensaje, número inválido y ventana bloqueada.

## Prueba de datos extremos

Se cargaron, en la frontera de la API, una reserva con un nombre de alojamiento de 82 caracteres, una ciudad larga, 30 noches, 20 huéspedes, un total de $ 375.000.000, un teléfono con espacios, guiones y paréntesis, notas de 500 caracteres y un alojamiento sin foto. También se probó una estadía de una noche y un huésped. Se revisaron a 320, 375 y 1440 px. Se corrigieron dos defectos:

- una tarjeta de reserva sin foto dejaba todo el texto en la columna angosta de la imagen;
- los campos de solo lectura, el de hora y el de teléfono se veían con el estilo del navegador y no con el de Rumbo, y el ícono del campo de fechas tapaba el texto.

## Resumen

18 casos ejecutados, 18 aprobados (el guion de navegador hizo 50 comprobaciones). La revisión de código final encontró y corrigió tres defectos más, cada uno con su prueba o verificación:

- un teléfono de 21 caracteres pasaba la validación pero no cabía en la base, y terminaba en un error confuso (ahora la API lo rechaza con un mensaje, igual que un teléfono sin dígitos);
- el formulario de administración aceptaba un WhatsApp que el botón luego rechazaba (ahora los dos usan la misma regla);
- la dirección del alojamiento no aparecía en la reserva si el alojamiento no tenía ciudad.

La revisión de seguridad no encontró vulnerabilidades: cada persona solo ve y crea sus propias reservas, el correo escapa todos los datos y el enlace de WhatsApp solo admite números.
