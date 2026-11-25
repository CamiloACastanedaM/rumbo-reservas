# Plan de pruebas QA — Sprint 2

**Proyecto:** Rumbo · **Sprint:** 2 · **Responsable QA:** Camilo Castañeda · **Fecha de ejecución:** 25/11/2026

## Alcance

Historias #12 a #21 del Sprint 2 y el botón «Administración» del header, visible solo para administradores. Cada criterio de aceptación tiene al menos un caso de prueba. También se repite el caso del panel de administración bajo 1024 px del Sprint 1, porque el panel cambió.

## Entorno

| Elemento | Valor |
|---|---|
| Frontend | React 19 + Vite 8, `http://localhost:5173` |
| Backend | Spring Boot 4.2 (Java 21) con Spring Security + JWT, `http://localhost:8080` |
| Base de datos | MySQL 8.4 en Docker, con los datos de ejemplo del Sprint 1 más 10 características |
| Correo | Mailpit en Docker (SMTP `localhost:1025`, bandeja `http://localhost:8025`) |
| Navegador | Microsoft Edge (Chromium) automatizado, anchos 375, 768 y 1440 px |
| Cuentas | Administrador inicial (`ADMIN_EMAIL` del `.env`) y usuaria de prueba Laura Restrepo (rol usuario) |

Las capturas están en [`evidence/sprint-2/`](evidence/sprint-2/). Los casos se ejecutaron con un guion de navegador que hace los mismos clics que una persona y además consulta la API y la bandeja de Mailpit para confirmar el resultado.

## Casos de prueba

| ID | HU | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| CP-01 | #13 Registrar usuario | Página «Crear cuenta» | Enviar el formulario vacío | Error en línea bajo cada campo obligatorio, sin llamar a la API | «Escribe tu nombre.», «Escribe tu apellido.», «Escribe tu correo electrónico.», «Crea una contraseña.» | ✅ | [registro-errores-1440](evidence/sprint-2/registro-errores-1440.jpg) |
| CP-02 | #13 Registrar usuario | Página «Crear cuenta» | Escribir nombre «Ana3», correo «ana@correo», contraseña «solotexto» | Cada regla se explica al lado del campo: solo letras, formato de correo, mínimo 8 con letra y número | Los tres mensajes aparecen en 375, 768 y 1440 px; el campo queda marcado en rojo | ✅ | [375](evidence/sprint-2/registro-errores-375.jpg), [768](evidence/sprint-2/registro-errores-768.jpg), [1440](evidence/sprint-2/registro-errores-1440.jpg) |
| CP-03 | #13 Registrar usuario | Correo nuevo | Completar nombre, apellido, correo y contraseña válidos y enviar | Cuenta creada con rol usuario y pantalla de confirmación | «¡Listo, Andrés!» y aviso del correo enviado | ✅ | [registro-exito-1440](evidence/sprint-2/registro-exito-1440.jpg) |
| CP-04 | #13 Registrar usuario | Correo ya registrado | Registrar de nuevo el mismo correo | Mensaje claro en el campo correo, sin crear otra cuenta | «Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.» (409) | ✅ | [registro-duplicado-1440](evidence/sprint-2/registro-duplicado-1440.jpg) |
| CP-05 | #19 Correo de registro | Registro del CP-03 | Revisar la bandeja de Mailpit | Correo enviado justo después del registro | «Bienvenido a Rumbo, Andrés» llega al correo registrado | ✅ | [correo-bienvenida-1440](evidence/sprint-2/correo-bienvenida-1440.jpg) |
| CP-06 | #19 Correo de registro | Correo del CP-05 | Abrir el correo en 1440 y 375 px | Mensaje claro con nombre, correo y enlace a «Iniciar sesión»; se adapta al celular | Contiene «Andrés», el correo y el botón a `/iniciar-sesion`; plantilla de una columna | ✅ | [1440](evidence/sprint-2/correo-bienvenida-1440.jpg), [375](evidence/sprint-2/correo-bienvenida-375.jpg) |
| CP-07 | #19 Correo de registro | Pantalla de confirmación | Clic en «Reenviar correo» | Se envía otra copia | La API responde 202 y llega una segunda copia a Mailpit (verificado contra la API real); el botón envía la petición correcta (prueba automática del frontend) | ✅ | [registro-exito-1440](evidence/sprint-2/registro-exito-1440.jpg) |
| CP-08 | #14 Iniciar sesión | Usuaria registrada | Correo correcto y contraseña errada | Error claro, sin entrar | «El correo o la contraseña no son correctos…» en 375, 768 y 1440 px | ✅ | [375](evidence/sprint-2/login-error-375.jpg), [768](evidence/sprint-2/login-error-768.jpg), [1440](evidence/sprint-2/login-error-1440.jpg) |
| CP-09 | #14 Iniciar sesión | CP-08 | Escribir la contraseña correcta y entrar | El header muestra el nombre y un avatar con las iniciales | «Laura Restrepo» con avatar «LR» en los tres anchos | ✅ | [375](evidence/sprint-2/header-usuario-375.jpg), [768](evidence/sprint-2/header-usuario-768.jpg), [1440](evidence/sprint-2/header-usuario-1440.jpg) |
| CP-10 | #14 Iniciar sesión | Sesión iniciada | Recargar la página | La sesión se mantiene | El token se guarda en el navegador y la API lo valida en cada petición | ✅ | [header-usuario-1440](evidence/sprint-2/header-usuario-1440.jpg) |
| CP-11 | #15 Cerrar sesión | Sesión iniciada | Clic en el avatar | Menú desplegable con «Cerrar sesión» bajo el avatar | Menú con nombre, correo y «Cerrar sesión» | ✅ | [375](evidence/sprint-2/menu-usuario-375.jpg), [768](evidence/sprint-2/menu-usuario-768.jpg), [1440](evidence/sprint-2/menu-usuario-1440.jpg) |
| CP-12 | #15 Cerrar sesión | Menú abierto | Clic en «Cerrar sesión» | Se borra el token y se sigue navegando como anónimo | Token eliminado del navegador; vuelven «Crear cuenta» e «Iniciar sesión» | ✅ | [logout-anonimo-1440](evidence/sprint-2/logout-anonimo-1440.jpg) |
| CP-13 | #15 Cerrar sesión | Sesión cerrada | Abrir `/administracion/productos` y llamar a la API sin token válido | Rutas protegidas bloqueadas | La página lleva a «Iniciar sesión»; la API responde 401 | ✅ | [ruta-protegida-1440](evidence/sprint-2/ruta-protegida-1440.jpg) |
| CP-14 | #16 Rol administrador | Sesión de usuario normal | Abrir `/administracion` | Sin acceso a funciones de administrador | «No tienes permisos de administrador»; sin botón «Administración» | ✅ | [admin-sin-permisos-1440](evidence/sprint-2/admin-sin-permisos-1440.jpg) |
| CP-15 | #16 Rol administrador | Token de usuario normal | `GET /api/admin/users` y `DELETE /api/admin/products/1` | El backend lo impide | 403 en ambos | ✅ | Prueba automática `adminEndpointsNeedTheAdminRole` |
| CP-16 | #16 Rol administrador | Sesión de administrador | «Usuarios y permisos» → «Hacer administrador» en Laura | Laura pasa a administradora | Insignia «Administrador»; con su mismo token la API ya responde 200 | ✅ | [admin-usuarios-1440](evidence/sprint-2/admin-usuarios-1440.jpg), [admin-usuarios-otorgado-1440](evidence/sprint-2/admin-usuarios-otorgado-1440.jpg) |
| CP-17 | #16 Rol administrador | CP-16 | «Quitar administrador» a Laura | Pierde el permiso de inmediato | Con el mismo token la API vuelve a responder 403 | ✅ | [admin-usuarios-1440](evidence/sprint-2/admin-usuarios-1440.jpg) |
| CP-18 | #16 Rol administrador | Sesión de administrador | Buscar su propia fila | No puede quitarse su propio rol | La fila muestra «Tú» sin botón; la API responde 400 si se intenta | ✅ | [admin-usuarios-1440](evidence/sprint-2/admin-usuarios-1440.jpg) |
| CP-19 | Header «Administración» | Sesión de administrador | Ver el header y hacer clic en «Administración» | El botón solo aparece a administradores y abre el panel | Botón visible solo para el admin; abre el panel con todo el menú | ✅ | [header-admin-1440](evidence/sprint-2/header-admin-1440.jpg), [admin-panel-1440](evidence/sprint-2/admin-panel-1440.jpg) |
| CP-20 | #17 Características | Panel de administración | Abrir «Administrar características» | Lista con ícono, nombre y acciones editar/eliminar | 10 características con «Editar» y «Eliminar» | ✅ | [admin-caracteristicas-1440](evidence/sprint-2/admin-caracteristicas-1440.jpg) |
| CP-21 | #17 Características | CP-20 | «Añadir nueva» → nombre «Bicicletas» + ícono bicicleta → Guardar | Se crea con nombre e ícono | Aparece en la lista | ✅ | [admin-caracteristica-nueva-1440](evidence/sprint-2/admin-caracteristica-nueva-1440.jpg) |
| CP-22 | #17 Características | CP-21 | Editar a «Bicicletas de montaña» y luego eliminarla con confirmación | Cambia el nombre; al confirmar desaparece | Nombre actualizado; tras confirmar ya no está en la lista ni en los productos | ✅ | [editada](evidence/sprint-2/admin-caracteristica-editada-1440.jpg), [eliminar](evidence/sprint-2/admin-caracteristica-eliminar-1440.jpg) |
| CP-23 | #17 + #12 | Lista de productos | «Editar» en Cabaña El Mirador del Cocora → categoría Glamping y marcar «Jacuzzi» → Guardar cambios | El producto queda con la nueva categoría y la característica asociada | La lista muestra «Glamping» y el detalle incluye «Jacuzzi» (luego se restauró) | ✅ | [admin-editar-producto-1440](evidence/sprint-2/admin-editar-producto-1440.jpg), [admin-lista-categoria-1440](evidence/sprint-2/admin-lista-categoria-1440.jpg) |
| CP-24 | #12 Categorizar | Panel de administración | Abrir «Agregar producto» | El formulario permite elegir categoría y características | Selector con las 7 categorías y «Sin categoría»; casillas de características | ✅ | [admin-agregar-producto-categoria-1440](evidence/sprint-2/admin-agregar-producto-categoria-1440.jpg) |
| CP-25 | #18 Ver características | Producto con características | Abrir el detalle en 375, 768 y 1440 px | Bloque «Características» con cada una y su ícono, adaptado al ancho | Lista en columnas que se ajustan; cada ítem con su ícono | ✅ | [375](evidence/sprint-2/detalle-caracteristicas-375.jpg), [768](evidence/sprint-2/detalle-caracteristicas-768.jpg), [1440](evidence/sprint-2/detalle-caracteristicas-1440.jpg) |
| CP-26 | #20 Filtrar por categoría | Home | Ver el bloque de recomendaciones | Lista de categorías en una sección de filtro junto a los resultados, con «X de Y productos» | «Filtrar por categoría» con un chip por categoría y «20 de 20 productos» | ✅ | [filtro-categorias-1440](evidence/sprint-2/filtro-categorias-1440.jpg) |
| CP-27 | #20 Filtrar por categoría | CP-26 | Elegir «Cabañas» y luego «Fincas» | Se pueden elegir una o varias; el contador se actualiza | «8 de 20 productos»; solo cabañas y fincas en los resultados, en los tres anchos | ✅ | [375](evidence/sprint-2/filtro-categorias-375.jpg), [768](evidence/sprint-2/filtro-categorias-768.jpg), [1440](evidence/sprint-2/filtro-categorias-1440.jpg) |
| CP-28 | #20 Filtrar por categoría | Filtros activos | Clic en «Limpiar filtros» | Vuelve la lista original | «20 de 20 productos» y el filtro desaparece de la URL | ✅ | [filtro-categorias-1440](evidence/sprint-2/filtro-categorias-1440.jpg) |
| CP-29 | #21 Agregar categoría | Panel de administración | «Agregar categoría» → Guardar sin datos | Errores en título, descripción e imagen | Tres mensajes en línea | ✅ | [admin-categoria-errores-1440](evidence/sprint-2/admin-categoria-errores-1440.jpg) |
| CP-30 | #21 Agregar categoría | CP-29 | Título «Casas en el árbol», descripción e imagen representativa → Guardar | Se crea y aparece en el inicio y en el filtro | Guardada con su imagen en `/uploads/`; aparece como chip y tarjeta | ✅ | [admin-categoria-lista-1440](evidence/sprint-2/admin-categoria-lista-1440.jpg), [filtro-categorias-375](evidence/sprint-2/filtro-categorias-375.jpg) |
| CP-31 | #9 (regresión) | Sesión de administrador | Abrir el panel a 768 px | Sigue apareciendo el aviso para móviles | «El panel de administración no está disponible en dispositivos móviles» | ✅ | [admin-768](evidence/sprint-2/admin-768.jpg) |
| CP-32 | Calidad | Todas las páginas probadas | Revisar la consola del navegador | Sin errores de la aplicación | Ninguno; solo se registran las respuestas 401 y 409 que las pruebas negativas provocan a propósito | ✅ | — |

## Pruebas automáticas

| Suite | Comando | Resultado |
|---|---|---|
| Backend (JUnit 5 + MockMvc + Spring Security Test, H2 en modo MySQL) | `cd backend && ./mvnw test` | 16 pruebas, 0 fallas |
| Frontend (Vitest + Testing Library) | `cd frontend && npm test` | 14 pruebas, 0 fallas |
| Build de producción | `cd frontend && npm run build` | Correcto |

Backend, nuevas en este sprint:
- validación de cada campo del registro;
- registro con correo en minúsculas, envío del correo de bienvenida y correo duplicado (409);
- reenvío del correo;
- inicio de sesión correcto y errado, y token inválido (401);
- endpoints de administración: 401 sin sesión y 403 con rol usuario;
- dar y quitar el rol de administrador con efecto inmediato, sin poder cambiar el propio;
- crear, editar y eliminar características, con nombre duplicado y validación;
- producto con categoría y características, edición que conserva y agrega fotos, y rechazo si se queda sin fotos;
- nombre de otro producto rechazado al editar;
- filtro por una y varias categorías con el total del catálogo;
- alta de categoría con imagen, título duplicado y validaciones.

Frontend, nuevas en este sprint:
- errores en línea del registro;
- registro exitoso y «Reenviar correo»;
- error de credenciales;
- inicio de sesión con avatar de iniciales y cierre de sesión;
- botón y panel de administración solo para administradores;
- bloque «Características» con íconos;
- filtro por varias categorías con «X de Y productos» y «Limpiar filtros».

## Prueba de datos extremos

Se cargaron, a través de la API, los valores más largos que esta acepta: un nombre de 30 caracteres con un apellido de 46, un correo de 90 caracteres, una característica de 60 y una categoría de 78. Se revisaron a 320, 375 y 1440 px. Se corrigieron cuatro defectos:

- el botón del usuario se salía de la pantalla en celulares;
- la insignia de rol se partía a mitad de palabra;
- el ícono de una característica larga se aplastaba en el formulario;
- una categoría muy larga deformaba su chip del filtro.

Después se borraron esos datos.

## Resumen

32 casos ejecutados, 32 aprobados. Durante el sprint se encontraron y corrigieron estos defectos:

- el correo de bienvenida no salía porque el mensaje no era de varias partes (texto y HTML);
- las tildes del nombre llegaban como entidades HTML en el correo;
- al editar un producto, las fotos se duplicaban por la forma de cargar fotos y características a la vez;
- un error del registro se ocultaba al escribir en otro campo;
- la regla de seguridad que dejaba públicas las consultas `GET` era demasiado amplia;
- los cuatro defectos de la prueba de datos extremos.

La revisión de seguridad no encontró vulnerabilidades.
