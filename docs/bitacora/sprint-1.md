# Bitácora del Sprint 1

**Proyecto:** Rumbo · **Estudiante:** Camilo Castañeda · **Fecha de cierre:** 25/11/2026
**Repositorio:** https://github.com/CamiloACastanedaM/rumbo-reservas (tag `sprint-1`)

## 1. Definición del proyecto

**Problema.** Quien quiere escaparse un fin de semana en Colombia termina saltando entre Instagram, WhatsApp y portales internacionales para encontrar una cabaña o un glamping, y casi nunca sabe si las fechas están libres hasta que escribe al dueño.

**Solución.** Rumbo es una web de reservas de alojamientos turísticos en Colombia: cabañas, glamping, hoteles boutique, fincas, apartamentos y hostales. El viajero ve recomendaciones, busca por destino y fechas, revisa fotos, características y políticas, y reserva solo fechas disponibles. El administrador mantiene el catálogo desde un panel.

**Usuarios.**
- Viajeros de 22 a 45 años que planean escapadas cortas desde el celular o el computador.
- Administrador del sitio, que carga y mantiene los alojamientos desde un escritorio.

**Alcance del producto (4 sprints).**
1. Estructura del sitio y gestión básica de productos (este sprint).
2. Registro, inicio de sesión, roles, categorías y características.
3. Búsqueda con fechas, disponibilidad, favoritos, políticas, compartir y valoraciones.
4. Reservas, historial, correo de confirmación y contacto por WhatsApp.

**Tecnologías.** Spring Boot 4.2 (Java 21) con API REST, MySQL 8.4 en Docker, React 19 con Vite 8, CSS propio con tokens de diseño.

## 2. Objetivo del sprint

Tener la estructura básica del sitio y poder registrar, ver y eliminar productos.

## 3. Historias de usuario

| HU | Título | Prioridad | Estado |
|---|---|---|---|
| #1 | Header | Alta | ✅ Terminada |
| #2 | Cuerpo del sitio | Alta | ✅ Terminada |
| #3 | Registrar producto | Alta | ✅ Terminada |
| #4 | Productos aleatorios en el inicio | Alta | ✅ Terminada |
| #5 | Detalle de producto | Alta | ✅ Terminada |
| #6 | Galería de imágenes | Alta | ✅ Terminada |
| #7 | Footer | Baja | ✅ Terminada |
| #8 | Paginación | Baja | ✅ Terminada |
| #9 | Panel de administración | Media | ✅ Terminada |
| #10 | Listar productos | Media | ✅ Terminada |
| #11 | Eliminar producto | Baja | ✅ Terminada |
| Extra | Identidad de marca (logo y paleta) | Entregable | ✅ Terminada |

Las 27 pruebas del plan de QA pasaron. Detalle en [`docs/qa/sprint-1-plan.md`](../qa/sprint-1-plan.md).

## 4. Decisiones técnicas

- Orden aleatorio estable por semilla. El frontend genera una semilla al cargar la página y la API baraja los ids con esa semilla. Así cada visita ve un orden distinto, pero al pasar de página no se repiten ni se saltan productos. Para un catálogo pequeño se baraja en memoria; si crece mucho, se puede pasar a un orden con semilla en SQL.
- Datos de ejemplo solo en una base vacía. `data.sql` se carga solo si no hay categorías ni productos. Así un producto que el administrador borra no reaparece al reiniciar el servidor.
- DTOs en todas las respuestas y un `@RestControllerAdvice` que devuelve mensajes claros en español (409 para nombre repetido, 400 con el error de cada campo, 413 si una imagen pesa más de 10 MB).
- Imágenes subidas como multipart y guardadas en `backend/uploads/`, servidas en `/uploads/**`. Las de ejemplo usan URLs de Unsplash, verificadas una por una.
- **Nombre único sin distinguir mayúsculas**, para que «Casa del Árbol» y «casa del árbol» no convivan.
- Diálogos nativos `<dialog>` para confirmar el borrado y para el visor de fotos: el navegador resuelve el foco, la tecla Escape y el fondo.
- **Panel de administración en `/administración` y `/administracion`**, porque escribir la tilde en la barra de direcciones no siempre es cómodo. Bajo 1024 px se oculta con una media query y se muestra el mensaje pedido.
- **Pruebas de backend con H2 en modo MySQL**, para no depender de Docker al correr `./mvnw test`.

## 5. Identidad visual

La marca toma los mapas topográficos de Colombia: fondo verde frailejón con curvas de nivel, rótulos de lugares en mayúsculas espaciadas y un magenta «Ruta» reservado para la acción principal. El isotipo combina tres curvas de nivel con una aguja de brújula. Paleta de 6 colores, tipografías Archivo y Archivo Narrow. Detalle en [`docs/brand/brand.md`](../brand/brand.md) y tokens en [`DESIGN.md`](../../DESIGN.md).

## 6. Problemas y soluciones

| Problema | Causa | Solución |
|---|---|---|
| La página quedaba en blanco al cargar | El efecto de «volver arriba» devolvía el resultado de `window.scrollTo`, que en este navegador es una promesa, y React lo trataba como función de limpieza | El efecto ya no devuelve nada |
| En 375 px el lema del header se cortaba | No cabían logo, lema y dos botones en una fila | En pantallas angostas el header pasa a dos filas |
| El panel de administración se veía bajo 1024 px | La regla que lo oculta estaba antes que la que lo muestra en la hoja de estilos | Se movió la media query después de la regla base |
| La flecha de volver se veía como un círculo blanco | El botón heredaba el fondo por defecto del navegador | Fondo transparente explícito |
| Galería con una sola foto dejaba media galería vacía | La grilla asumía siempre 5 fotos | La grilla se adapta a 1, 2, 3 o 4 fotos extra |
| «1 alojamientos» | Plural fijo | Singular y plural según la cantidad |
| Un nombre igual a otro salvo por una tilde daba error 500 | MySQL compara sin tildes en el índice único, pero la validación previa sí las distinguía | El servicio traduce ese error a 409 con el mensaje «nombre ya en uso» y borra las fotos que alcanzó a guardar |

## 7. Retrospectiva

**Mantener**
- Probar cada criterio en el navegador a 375, 768 y 1440 px antes de darlo por cerrado. Así aparecieron cuatro de los defectos de arriba.
- Pasar datos extremos (nombres largos, una sola foto, imagen rota) antes de cerrar el sprint.
- Commits pequeños, uno por historia o grupo de historias.

**Mejorar**
- Escribir las pruebas del frontend junto con cada componente y no al final.
- Revisar el orden de las reglas CSS cuando una media query oculta algo.
- Probar los nombres con y sin tildes contra MySQL real, no solo contra H2.

## 8. Próximo sprint

Sprint 2: registro e inicio de sesión de usuarios, cierre de sesión, roles de administrador, categorías (asignar, agregar y filtrar), características de los productos y edición de productos. El header mostrará el nombre y el avatar del usuario y el botón «Administración» solo para administradores.
