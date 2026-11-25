# Plan de pruebas QA — Sprint 1

**Proyecto:** Rumbo · **Sprint:** 1 · **Responsable QA:** Camilo Castañeda · **Fecha de ejecución:** 25/11/2026

## Alcance

Historias #1 a #11 del Sprint 1 y el entregable de identidad visual. Cada criterio de aceptación tiene al menos un caso de prueba.

## Entorno

| Elemento | Valor |
|---|---|
| Frontend | React 19 + Vite 8, `http://localhost:5173` |
| Backend | Spring Boot 4.2 (Java 21), `http://localhost:8080` |
| Base de datos | MySQL 8.4 en Docker (`docker compose up -d`), datos de ejemplo: 6 categorías, 20 productos con 5 fotos |
| Navegador | Chromium (panel de navegador integrado), anchos 375, 768, 1024 y 1440 px |

Las capturas están en [`evidence/sprint-1/`](evidence/sprint-1/).

## Casos de prueba

| ID | HU | Precondición | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| CP-01 | #1 Header | Home abierta | Hacer scroll hasta el final de la página | El header queda fijo arriba, ocupa el 100 % del ancho | `position: fixed`, `top = 0` tras 1500 px de scroll, ancho 1907/1907 px | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg) |
| CP-02 | #1 Header | Estar en un detalle | Clic en logo + lema | Vuelve a la home | Navega a `/` | ✅ | [detalle-1440](evidence/sprint-1/detalle-1440.jpg) |
| CP-03 | #1 Header | — | Ver el header en 375, 768 y 1440 px | Bloque izquierdo logo + lema; bloque derecho «Crear cuenta» e «Iniciar sesión»; nada se corta | En 375 px pasa a dos filas sin cortar el lema; en 768 y 1440 px una fila | ✅ | [home-375](evidence/sprint-1/home-375.jpg), [home-768](evidence/sprint-1/home-768.jpg) |
| CP-04 | #1 Header | — | Recorrer home, detalle y administración | Header idéntico en todas las páginas | Mismo componente en todas las rutas | ✅ | [admin-lista-1440](evidence/sprint-1/admin-lista-1440.jpg) |
| CP-05 | #2 Body | Home abierta | Medir fondo y altura del `main` | Fondo color de marca, alto mínimo 100 % del viewport | Fondo `#DCE8D3` (Frailejón) con curvas de nivel; `min-height` = 1257 px = alto del viewport | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg) |
| CP-06 | #2 Body | Home abierta | Revisar bloques en 375, 768 y 1440 px | Buscador, Categorías y Recomendaciones visibles y adaptados | Los tres bloques presentes en los tres anchos | ✅ | [home-375](evidence/sprint-1/home-375.jpg), [home-768](evidence/sprint-1/home-768.jpg), [home-1440](evidence/sprint-1/home-1440.jpg) |
| CP-07 | #4 Recomendaciones | 20 productos en BD | Contar tarjetas de la página 1 | Máximo 10, sin repetidos | 10 tarjetas, 10 nombres distintos | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg) |
| CP-08 | #4 Recomendaciones | — | Pedir la API con semillas 111, 222 y 333 | Orden distinto por semilla, sin patrón | Primeros ids: 12,6,15… / 14,13,16… / 1,18,17… | ✅ | Salida de consola en este documento (sección Datos) |
| CP-09 | #4 Recomendaciones | — | Recargar la home dos veces | Cambia el orden | Las capturas `home-1440` y `home-768` muestran órdenes distintos | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg), [home-768](evidence/sprint-1/home-768.jpg) |
| CP-10 | #4 Recomendaciones | Escritorio 1440 px | Revisar la grilla | 2 columnas × 5 filas como máximo | `grid-template-columns` con 2 columnas, 5 filas; 1 columna en móvil | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg) |
| CP-11 | #8 Paginación | 20 productos | Clic en «Siguiente» | Página 2 con 10 productos que no estaban en la 1; contador «Página 2 de 2» | 10 tarjetas, 0 repetidas, «Página 2 de 2», «Siguiente» deshabilitado | ✅ | [home-p2-1440](evidence/sprint-1/home-p2-1440.jpg) |
| CP-12 | #8 Paginación | En página 2 | Clic en «Anterior» y en «Primera página» | Vuelve a la página 1 con el mismo orden | «Página 1 de 2», mismo orden que antes | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg) |
| CP-13 | #5 Detalle | Home | Clic en una tarjeta | Abre el detalle: bloque de encabezado 100 % ancho, título a la izquierda, flecha a la derecha, descripción e imágenes en el cuerpo | Encabezado 1907/1907 px; título en x = 346; flecha alineada al borde derecho del contenedor (1562 = 1562) | ✅ | [detalle-1440](evidence/sprint-1/detalle-1440.jpg) |
| CP-14 | #5 Detalle | En un detalle | Clic en la flecha | Vuelve a la página anterior | Vuelve a `/` | ✅ | [detalle-375](evidence/sprint-1/detalle-375.jpg) |
| CP-15 | #6 Galería | Producto con 5 fotos | Revisar la galería en 1440 px | 100 % del contenedor; principal en la mitad izquierda; 2×2 a la derecha; «Ver más» abajo a la derecha | Galería 1216/1216 px; principal 604 px a la izquierda; grilla 604 px con 2 columnas; «Ver más» a 16 px de los bordes derecho e inferior | ✅ | [detalle-1440](evidence/sprint-1/detalle-1440.jpg) |
| CP-16 | #6 Galería | En el detalle | Clic en «Ver más», flechas del teclado, Escape | Se abre un visor con todas las fotos; se puede navegar y cerrar | Visor «Foto 2 de 5», miniaturas de las 5, cierra con Escape y con la X | ✅ | Prueba automática `Gallery (#6)` |
| CP-17 | #6 Galería | — | Ver el detalle en 375 y 768 px | Foto principal arriba y 4 miniaturas en fila | Correcto en ambos anchos | ✅ | [detalle-375](evidence/sprint-1/detalle-375.jpg), [detalle-768](evidence/sprint-1/detalle-768.jpg) |
| CP-18 | #7 Footer | — | Ver el pie de página en las tres resoluciones | 100 % ancho; isotipo + año + copyright a la izquierda | «© 2026 Rumbo. Todos los derechos reservados.» con isotipo | ✅ | [home-1440](evidence/sprint-1/home-1440.jpg), [home-375](evidence/sprint-1/home-375.jpg) |
| CP-19 | #9 Panel | — | Abrir `/administración` y `/administracion` en 1440 px | Panel con menú de funciones | Ambas URL abren el panel con «Agregar producto» y «Lista de productos» | ✅ | [admin-1440](evidence/sprint-1/admin-1440.jpg) |
| CP-20 | #9 Panel | — | Abrir el panel en 375, 768 y 1023 px | Mensaje «El panel de administración no está disponible en dispositivos móviles» | Mensaje visible y panel oculto por debajo de 1024 px; desde 1024 px se ve el panel | ✅ | [admin-375](evidence/sprint-1/admin-375.jpg), [admin-768](evidence/sprint-1/admin-768.jpg), [admin-limite-1023-vs-1024](evidence/sprint-1/admin-limite-1023-vs-1024.jpg) |
| CP-21 | #3 Registrar | En «Agregar producto» | Enviar el formulario vacío | Errores en nombre, descripción e imágenes; no se guarda | Tres mensajes de error en línea | ✅ | [cp16-validacion-formulario](evidence/sprint-1/cp16-validacion-formulario.jpg) |
| CP-22 | #3 Registrar | En «Agregar producto» | Cargar nombre, descripción y 2 fotos; «Guardar producto» | Se guarda en la BD y aparece en la lista | Aviso «ya está publicado», lista con 21 productos, la API devuelve 2 imágenes `/uploads/…` | ✅ | [cp14a](evidence/sprint-1/cp14a-formulario-con-imagenes.jpg), [cp14b](evidence/sprint-1/cp14b-producto-guardado.jpg) |
| CP-23 | #3 Registrar | Existe «Casa del Árbol San Gil» | Crear otro con nombre «casa del árbol san gil» | Error «nombre ya en uso» | «El nombre ya está en uso. Elige otro nombre para el producto.» (HTTP 409) | ✅ | [cp15-nombre-duplicado](evidence/sprint-1/cp15-nombre-duplicado.jpg) |
| CP-24 | #10 Listar | — | Clic en «Lista de productos» | Tabla con columnas Id, Nombre, Acciones | Tabla con las tres columnas y todos los productos | ✅ | [admin-lista-1440](evidence/sprint-1/admin-lista-1440.jpg) |
| CP-25 | #11 Eliminar | Producto en la lista | Clic en «Eliminar producto» → «Cancelar» | Se abre la confirmación; al cancelar no cambia nada | El diálogo nombra el producto; tras cancelar sigue en la lista | ✅ | [cp18-confirmacion-eliminar](evidence/sprint-1/cp18-confirmacion-eliminar.jpg) |
| CP-26 | #11 Eliminar | Producto en la lista | «Eliminar producto» → «Eliminar» | Se borra de la BD y de la lista | Lista con 20 productos; `GET /api/products/21` responde 404 | ✅ | [cp19-producto-eliminado](evidence/sprint-1/cp19-producto-eliminado.jpg) |
| CP-27 | Marca | — | Revisar `docs/brand/` | Logo y paleta de 3 a 7 colores | Logo, isotipo y paleta de 6 colores con HEX y rol | ✅ | [palette.png](../brand/palette.png) |

## Pruebas de casos extremos (break-ui)

Datos del peor caso inyectados en la respuesta de la API: nombre de 90 caracteres, ciudad «Archipiélago de San Andrés, Providencia y Santa Catalina», precio 12.500.000, imagen rota, producto sin foto, total de 1 producto, galería de 1 y de 3 fotos.

| Hallazgo | Antes | Corrección |
|---|---|---|
| Galería con 1 foto | La mitad derecha quedaba vacía | Con 1 foto la principal ocupa todo el ancho; con 2–4 la grilla se reparte sin huecos |
| Imagen rota en tarjeta | Ícono de imagen rota | Se oculta y queda el fondo de curvas de nivel |
| Total de 1 producto | «1 alojamientos», «1 productos registrados» | Singular y plural correctos |
| Descripción con párrafos | Los saltos de línea se perdían | `white-space: pre-line` |

Evidencia: [antes tarjetas](evidence/sprint-1/breakui-antes-tarjetas.jpg), [antes galería](evidence/sprint-1/breakui-antes-galeria-1-foto.jpg), [después 1 foto](evidence/sprint-1/breakui-despues-galeria-1-foto.jpg), [después 3 fotos](evidence/sprint-1/breakui-despues-galeria-3-fotos.jpg).

## Pruebas automáticas

| Suite | Comando | Resultado |
|---|---|---|
| Backend (JUnit 5 + MockMvc, H2 en modo MySQL) | `cd backend && ./mvnw test` | 6 pruebas, 0 fallas |
| Frontend (Vitest + Testing Library) | `cd frontend && npm test` | 7 pruebas, 0 fallas |
| Build de producción | `cd frontend && npm run build` | Correcto |

Backend: orden aleatorio estable por semilla que recorre todos los productos sin repetir, alta con imágenes, nombre duplicado (409, sin distinguir mayúsculas), validación de campos obligatorios y de al menos una imagen, borrado con 404 posterior, lista de administración ordenada por id.

Frontend: header (logo con enlace a inicio, lema y botones), footer (isotipo, año y copyright), paginación (contador y botones habilitados o no), galería (4 miniaturas y «Ver más» con todas las fotos), panel de administración (mensaje móvil y menú), eliminación con confirmación (cancelar no borra, aceptar borra).

## Datos de la prueba CP-08

```
semilla 111, página 1: 12,6,15,9,13,19,10,3,7,1
semilla 111, página 2: 8,18,17,5,16,11,4,2,20,14   (20 ids distintos de 20)
semilla 222, página 1: 14,13,16,18,17,10,6,11,4,1
semilla 333, página 1: 1,18,17,3,19,14,15,20,16,5
```

## Resumen

27 casos ejecutados, 27 aprobados. Durante la ejecución se encontraron y corrigieron 6 defectos: header cortado en 375 px, panel de administración visible bajo 1024 px, botón de volver sin ícono visible, «Ver más» sin relleno, errores del formulario que no se limpiaban al escribir y texto del diálogo de borrado que mencionaba fotos que no se borran. La revisión de código agregó uno más: un nombre igual a otro salvo por una tilde devolvía error 500; ahora responde 409 con el mensaje «nombre ya en uso» (verificado contra MySQL).
