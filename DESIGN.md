# DESIGN.md — Sistema visual de Rumbo

Fuente de verdad del diseño. Los tokens viven en `frontend/src/styles.css` (`:root`); este archivo explica cuándo usar cada uno. La marca completa está en [`docs/brand/brand.md`](docs/brand/brand.md).

## Idea

Un mapa topográfico puesto a trabajar: fondo verde de mapa con curvas de nivel, rótulos en mayúsculas espaciadas y un único color de ruta para la acción que lleva a reservar. La estructura (header, buscador, tarjetas, tablas, formularios) es la estándar de una app de reservas; el mundo del mapa solo aporta color, tipografía, densidad y la firma de las curvas de nivel.

## Tokens de color

```css
--paramo:    #17402f; /* marca, header, footer, texto */
--frailejon: #dce8d3; /* fondo principal (body) */
--papel:     #f6f8f2; /* superficies: tarjetas, paneles, inputs del buscador */
--curva:     #8a5a2b; /* rótulos tipo mapa, filetes, curvas de nivel */
--rio:       #1d6fa5; /* enlaces, foco, información */
--ruta:      #c0185e; /* SOLO la acción principal hacia reservar */
--danger:    #b3261e; /* acciones destructivas (eliminar) */
```

Derivados (con `color-mix`, no son colores nuevos): `--paramo-deep` (hover y footer), `--ruta-deep` (hover), `--text-muted`, `--text-on-dark`, `--text-on-dark-muted`, `--rule` (filete 38 %), `--rule-strong` (70 %).

## Tipografía

```css
--font-sans:  "Archivo", system-ui, sans-serif;        /* títulos y texto */
--font-label: "Archivo Narrow", "Archivo", sans-serif; /* rótulos de mapa */
--step--1: 0.8125rem;  --step-0: 1rem;  --step-1: 1.1875rem;  --step-2: 1.5rem;
--step-3: clamp(1.75rem, 1.3rem + 1.6vw, 2.5rem);
--step-4: clamp(2.125rem, 1.4rem + 2.8vw, 3.5rem);
```

- Títulos: peso 800, `letter-spacing: -0.015em` a `-0.03em`, `text-wrap: balance`.
- Rótulos (`.map-label`, encabezados de tabla, labels del buscador): Archivo Narrow 600, mayúsculas, `letter-spacing: 0.08em`, color `--curva`.
- Precios y contadores: `font-variant-numeric: tabular-nums`.

## Espaciado, radios y profundidad

```css
--space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem;
--space-5: 1.5rem; --space-6: 2rem;  --space-7: 3rem;   --space-8: 4.5rem;
--radius-sm: 4px; --radius-md: 8px;
--shadow-lift: 0 10px 24px -12px color-mix(in oklab, var(--paramo) 45%, transparent);
--header-h: 4.5rem (4rem ≤ 640 px, 6.75rem ≤ 480 px con dos filas);
--container: 76rem;
```

Los módulos se separan con filetes de 1 px (`--rule`), no con sombras. `--shadow-lift` solo aparece al pasar el mouse sobre una tarjeta y en el buscador.

## Componentes

| Componente | Clase | Notas |
|---|---|---|
| Botón principal de ruta | `.btn.btn-route` | Magenta. Uno por pantalla como máximo. |
| Botón sólido | `.btn.btn-solid` | Páramo. Acciones normales (guardar, reintentar). |
| Botón contorno | `.btn.btn-ghost` | Acciones secundarias, paginación, eliminar en tablas. |
| Botón peligro | `.btn.btn-danger` | Solo dentro del diálogo de confirmación. |
| Rótulo de mapa | `.map-label` | Pin + ciudad/departamento. |
| Tarjeta de producto | `.product-card` | Foto 44 % + cuerpo; grilla de 2 columnas (1 en móvil). |
| Galería | `.gallery` | Foto principal a la izquierda, 2×2 a la derecha, «Ver más» abajo a la derecha. |
| Diálogos | `<dialog>` nativo | `.confirm` y `.lightbox`; foco, Escape y fondo los maneja el navegador. |
| Estados | `.state`, `.skeleton` | Vacío, error con «Reintentar», carga. |

## Movimiento

- Curva única `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`.
- Entrada escalonada de las tarjetas del inicio (45 ms entre tarjetas), zoom suave de fotos al pasar el mouse, aparición de diálogos.
- Con `prefers-reduced-motion: reduce` todo movimiento se anula.

## Responsive

Se revisa en 375, 768 y 1440 px. El panel de administración no se muestra por debajo de 1024 px (mensaje fijo, por requisito).

## Accesibilidad

Contraste AA en todas las combinaciones de texto (ver `docs/brand/brand.md`), foco visible color `--rio`, textos alternativos en las fotos, diálogos con teclado, etiquetas en todos los campos.
