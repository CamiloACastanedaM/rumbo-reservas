# Bitácora del Sprint 2

**Proyecto:** Rumbo · **Estudiante:** Camilo Castañeda · **Fecha de cierre:** 25/11/2026
**Repositorio:** https://github.com/CamiloACastanedaM/rumbo-reservas (tag `sprint-2`)

## 1. Recordatorio del proyecto

**Problema.** Para encontrar una escapada en Colombia hoy toca saltar entre Instagram, WhatsApp y portales internacionales, y casi nunca se sabe si las fechas están libres hasta escribirle al dueño.

**Solución.** Rumbo es una web de reservas de alojamientos turísticos en Colombia: cabañas, glamping, hoteles boutique, fincas, apartamentos y hostales.

**Usuarios.** Viajeros de 22 a 45 años que planean escapadas cortas, y el equipo que administra el catálogo.

**Alcance.** Cuatro sprints: estructura y productos (hecho), cuentas y catálogo (este sprint), búsqueda y disponibilidad, y reservas.

## 2. Objetivo del sprint

Que los viajeros puedan crear una cuenta, iniciar y cerrar sesión, y que el administrador organice el catálogo con categorías y características y decida quién más administra.

## 3. Historias de usuario

| HU | Título | Prioridad | Estado |
|---|---|---|---|
| #12 | Categorizar productos | Alta | ✅ Terminada |
| #13 | Registrar usuario | Alta | ✅ Terminada |
| #14 | Iniciar sesión | Alta | ✅ Terminada |
| #15 | Cerrar sesión | Alta | ✅ Terminada |
| #16 | Identificar administrador (dar y quitar el rol) | Alta | ✅ Terminada |
| #17 | Administrar características | Media | ✅ Terminada |
| #18 | Ver características del producto | Media | ✅ Terminada |
| #19 | Correo de confirmación de registro (opcional) | Baja | ✅ Terminada |
| #20 | Filtrar productos por categoría | Baja | ✅ Terminada |
| #21 | Agregar categoría | Baja | ✅ Terminada |
| Extra | Botón «Administración» en el header solo para administradores | — | ✅ Terminada |

Los 32 casos del plan de QA pasaron. Detalle en [`docs/qa/sprint-2-plan.md`](../qa/sprint-2-plan.md).

## 4. Decisiones técnicas

- **Sesión con JWT, sin estado en el servidor.** Al iniciar sesión, la API entrega un token firmado (HS256, 12 horas) que el frontend guarda y envía en el encabezado `Authorization`. La clave se lee de `JWT_SECRET`. Si no está configurada, el servidor crea una aleatoria en cada arranque: es más seguro que tener una clave por defecto en el código.
- **El rol se lee de la base de datos en cada petición, no del token.** Así, cuando un administrador le quita el permiso a alguien, la siguiente petición de esa persona ya es rechazada, sin esperar a que el token venza.
- **Permisos en el backend, no solo en la interfaz.** Todo `/api/admin/**` exige rol ADMIN en Spring Security. El frontend oculta el botón «Administración» y bloquea el panel, pero la protección real es la del servidor (401 sin sesión, 403 sin permiso).
- **Contraseñas con BCrypt.** Nunca se devuelven en ninguna respuesta. El error de inicio de sesión no dice si lo que falla es el correo o la contraseña.
- **Las mismas reglas de validación en los dos lados.** Nombre y apellido solo con letras (incluye tildes, ñ, espacios, guion y apóstrofe), correo con formato válido y contraseña de 8 a 72 caracteres con al menos una letra y un número. El formulario muestra cada error mientras se escribe; la API vuelve a validar y responde con el error de cada campo.
- **Primer administrador desde variables de entorno.** `ADMIN_EMAIL` y `ADMIN_PASSWORD` crean la cuenta al arrancar, si no existe. Desde ahí, ese administrador da el rol a otros. Nadie puede quitarse su propio rol, para que el sistema no se quede sin administradores por accidente.
- **Correo en segundo plano con Mailpit en local.** El correo de bienvenida se envía de forma asíncrona: si el servidor de correo falla, el registro igual se completa y el problema queda en el log. La plantilla HTML es de una columna, con estilos en línea, para verse bien en celular.
- **Características con ícono de una lista cerrada.** El administrador elige entre 17 íconos de `lucide-react`. La API guarda solo la clave del ícono y la valida con una expresión regular.
- **Filtro de categorías en la URL** (`?categorias=1,4`). Recargar la página o compartir el enlace conserva el filtro. La API devuelve el total filtrado y el total del catálogo para mostrar «X de Y productos».
- **Edición de productos con fotos conservadas.** El formulario envía las fotos que se quedan (en orden) y las nuevas. El servidor borra las que se quitaron y no deja guardar un producto sin fotos.

## 5. Problemas y soluciones

| Problema | Causa | Solución |
|---|---|---|
| Al editar un producto las fotos aparecían duplicadas | Cargar fotos y características en la misma consulta multiplicaba las filas de la lista de fotos | Las características se cargan aparte |
| `GET /api/users/me` respondía sin sesión | La regla pública cubría todo `GET /api/**` | Solo son públicos productos, categorías, características e imágenes |
| El correo de bienvenida no salía | Un mensaje con texto y HTML necesita ser de varias partes | Se creó como mensaje *multipart* |
| «Andrés» llegaba como `Andr&eacute;s` en el correo | El escape de HTML convertía también las tildes | Se escapan solo los caracteres especiales de HTML |
| Spring creaba un usuario por defecto e imprimía su contraseña en el log | Faltaba un `UserDetailsService` propio | Se declaró uno que no acepta usuarios, porque el acceso va por JWT |
| Un error del registro desaparecía al escribir en otro campo | Al limpiar el error del servidor quedaba un valor vacío que tapaba la validación | El error se elimina del objeto en vez de dejarlo vacío |
| En celular, un nombre largo sacaba el botón del usuario de la pantalla | El botón se medía por su contenido | El nombre se recorta con «…» y el nombre completo se ve en el menú |
| La insignia «Usuario» se partía en dos líneas | Heredaba el corte de palabras de la tabla | La insignia no se parte |
| Las fotos quitadas al editar un producto seguían en la carpeta de imágenes | La edición borraba el registro pero no el archivo | Después de guardar se borran los archivos de las fotos quitadas |
| Un enlace con `?categorias=abc` mostraba error en el catálogo | El valor llegaba sin revisar a la API | Solo se usan identificadores numéricos |

## 6. Retrospectiva

**Mantener**
- Probar con datos reales contra la base y el correo de verdad, no solo con pruebas automáticas. Tres de los defectos de arriba solo aparecieron así.
- Un guion de navegador que repite el plan de QA completo en minutos. Sirvió para volver a correr todo después de cada corrección.
- Pasar datos extremos antes de cerrar el sprint.

**Mejorar**
- Escribir una prueba para cada regla de seguridad nueva en el mismo momento en que se agrega.
- Sacar a componentes compartidos las piezas que se repiten entre formularios (subida de imágenes, errores por campo).

## 7. Próximo sprint

Sprint 3:
- búsqueda por texto con sugerencias y calendario doble de fechas;
- disponibilidad en el detalle;
- favoritos y la página «Mis favoritos»;
- bloque de políticas;
- compartir en redes;
- valoraciones con estrellas;
- eliminar categorías.
