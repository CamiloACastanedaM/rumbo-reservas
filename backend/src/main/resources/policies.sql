-- Políticas de ejemplo para cada alojamiento. Se cargan una sola vez, cuando la tabla policies está vacía.
INSERT INTO policies (product_id, title, description)
SELECT id, 'Normas de la casa', 'Llegada desde las 3:00 p. m. y salida hasta las 11:00 a. m. No se permiten fiestas ni ruido después de las 10:00 p. m. Mascotas solo con aviso previo al anfitrión.' FROM products;
INSERT INTO policies (product_id, title, description)
SELECT id, 'Salud y seguridad', 'El alojamiento cuenta con botiquín, extintor y detector de humo. Los números de emergencia están a la vista. En piscinas, ríos y senderos los niños deben estar siempre acompañados.' FROM products;
INSERT INTO policies (product_id, title, description)
SELECT id, 'Política de cancelación', 'Cancelación gratuita hasta 7 días antes de la llegada. Después se cobra la primera noche. Si no llegas y no avisas, se cobra el total de la estadía.' FROM products;
