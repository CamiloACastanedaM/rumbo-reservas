# Bitácora del Sprint 4

**Proyecto:** Rumbo · **Estudiante:** Camilo Castañeda · **Fecha de cierre:** 25/11/2026
**Repositorio:** https://github.com/CamiloACastanedaM/rumbo-reservas (tag `sprint-4`)

## 1. Recordatorio del proyecto

**Problema.** Para encontrar una escapada en Colombia hoy toca saltar entre Instagram, WhatsApp y portales internacionales, y casi nunca se sabe si las fechas están libres hasta escribirle al dueño.

**Solución.** Rumbo es una web de reservas de alojamientos turísticos en Colombia: cabañas, glamping, hoteles boutique, fincas, apartamentos y hostales.

**Usuarios.** Viajeros de 22 a 45 años que planean escapadas cortas, y el equipo que administra el catálogo.

**Alcance.** Cuatro sprints: estructura y productos, cuentas y catálogo, búsqueda y disponibilidad, y reservas (este sprint, el último).

## 2. Objetivo del sprint

Cerrar el ciclo del viajero: que elija sus fechas, confirme la reserva, reciba el correo con los detalles, la encuentre después en su historial y pueda escribirle al anfitrión por WhatsApp.

## 3. Historias de usuario

| HU | Título | Prioridad | Estado |
|---|---|---|---|
| #30 | Seleccionar fechas para reservar | Alta | ✅ Terminada |
| #31 | Página de reserva | Alta | ✅ Terminada |
| #32 | Realizar la reserva | Alta | ✅ Terminada |
| #33 | Historial «Mis reservas» | Media | ✅ Terminada |
| #34 | Botón de WhatsApp | Media | ✅ Terminada |
| #35 | Correo de confirmación de la reserva | Baja | ✅ Terminada |

El plan de QA tiene 18 casos y los 18 pasaron. Detalle y capturas en [`docs/qa/sprint-4-plan.md`](../qa/sprint-4-plan.md).

## 4. Decisiones técnicas

- **Reservar pide sesión, pero no hace perder el camino.** «Reservar» siempre está en el detalle. Sin sesión lleva al login con un aviso, y después del login (o del registro) se vuelve a la página de reserva, con las fechas si venían en el enlace.
- **Dos personas no pueden reservar las mismas fechas.** Al confirmar, la API bloquea la fila del alojamiento hasta terminar, revisa que nadie haya reservado parte del rango y recién ahí guarda. Si otra persona ganó, responde 409 y la página vuelve a pedir el calendario, que ya muestra esos días tachados.
- **El calendario no deja elegir un rango con días ocupados.** El primer día ocupado sí se puede elegir como salida, porque ese día el huésped se va y el siguiente llega. Es la misma regla de la búsqueda y la disponibilidad del Sprint 3.
- **Límites razonables en la API.** La llegada no puede ser anterior a hoy ni estar a más de un año, la estadía va de 1 a 30 noches y los huéspedes de 1 a 20. El teléfono acepta espacios, guiones y paréntesis, pero tiene que tener entre 7 y 15 dígitos.
- **El estado de cada reserva se calcula, no se guarda.** «Próxima», «En curso» o «Finalizada» salen de comparar las fechas con hoy (hora de Colombia). Así no hace falta ninguna tarea programada que las actualice. «Calificar» aparece solo en las finalizadas que todavía no tienen reseña.
- **El correo sale después de guardar.** Se envía solo si la reserva quedó guardada y en segundo plano, así un servidor de correo lento no demora la confirmación. Es HTML simple en tablas, que se lee bien en el celular y en clientes de correo viejos, con una versión en texto plano. Todos los datos van escapados.
- **WhatsApp sin SDK.** El botón abre `wa.me` con el número del anfitrión y un primer mensaje que nombra el alojamiento. Se valida el número (formato internacional), la conexión y si el navegador bloqueó la ventana, y cada caso tiene su mensaje. El administrador carga el número en el formulario del producto y la API lo guarda solo con dígitos. Los datos de ejemplo traen un número de demostración.
- **Privacidad.** Las políticas del detalle incluyen siempre «Privacidad en WhatsApp», que explica que la conversación ocurre en WhatsApp y que Rumbo no ve esos mensajes. Las notas y el teléfono de una reserva solo los ve quien la hizo.

## 5. Problemas y soluciones

| Problema | Causa | Solución |
|---|---|---|
| El día en que empezaba otra estadía no se podía elegir como salida | El calendario deshabilitaba todos los días ocupados | El primer día ocupado después de la llegada queda disponible como salida |
| Un enlace con fechas ya tomadas dejaba el rango marcado | Las fechas del enlace se tomaban sin revisar la disponibilidad | Si al llegar el calendario esas fechas están ocupadas, se descartan |
| Una tarjeta de reserva sin foto metía todo el texto en una columna angosta | La grilla mantenía la columna de la imagen | Sin foto, la tarjeta usa una sola columna |
| Los campos de hora, teléfono y los de solo lectura no tenían el estilo de Rumbo | El estilo de los campos no incluía esos tipos | Se agregaron, y el ícono del campo de fechas ya no tapa el texto |
| Un teléfono de 21 caracteres terminaba en un error confuso | La validación permitía un carácter más que la columna | La API valida el largo y que haya dígitos de verdad |
| Un WhatsApp aceptado por el formulario lo rechazaba el botón | Cada lado tenía su propia regla | Los dos usan el formato internacional: 8 a 15 dígitos |

## 6. Retrospectiva

**Mantener**
- El guion de navegador del plan de QA, ahora con el buzón de Mailpit: confirmó el correo de verdad, no solo que se llamó al envío.
- Probar el caso de dos personas reservando lo mismo con una reserva hecha por la API mientras la página estaba abierta. Así se vio el mensaje 409 real.
- Los datos extremos al final del sprint. Salió el defecto de la tarjeta sin foto, que con los datos de ejemplo nunca aparece.

**Mejorar**
- Definir una sola regla de validación por dato desde el principio (como el WhatsApp) y usarla en la API y en la página.
- Revisar el estilo de cada tipo de campo nuevo apenas se agrega, no en las capturas finales.

## 7. Cierre del proyecto

Con este sprint Rumbo cubre el recorrido completo: buscar por destino y fechas, ver disponibilidad, guardar favoritos, compartir, reservar, recibir la confirmación por correo, consultar el historial, calificar la estadía y escribirle al anfitrión. El README del repositorio explica cómo instalarlo desde cero, la configuración, los endpoints y el diagrama de la base de datos.
