# Despliegue en producción

La API (Spring Boot) y la base de datos MySQL van en **Railway**; el frontend (React + Vite) va en **Vercel**. Las imágenes que suben los administradores se guardan en un volumen de Railway.

Orden recomendado: primero Railway (para tener la URL de la API), luego Vercel (para tener la URL del sitio) y por último volver a Railway a completar `CORS_ORIGINS` y `FRONTEND_URL`.

---

## 1. API en Railway

### 1.1 Proyecto y servicio

1. Entra a [railway.com](https://railway.com) e inicia sesión con GitHub.
2. **New Project → Deploy from GitHub repo** y elige `CamiloACastanedaM/rumbo-reservas`.
3. Abre el servicio creado → **Settings → Source → Root Directory**: `backend`.
   Railway detecta el `Dockerfile` de esa carpeta y construye la imagen con él.

### 1.2 Base de datos MySQL

1. En el mismo proyecto: **+ Create → Database → MySQL**.
2. Deja el nombre del servicio como `MySQL`; las variables de abajo lo usan con ese nombre.

### 1.3 Volumen para las imágenes

1. Clic derecho sobre el servicio de la API (o **+ Create → Volume**) y adjunta un volumen al servicio de la API.
2. **Mount path**: `/app/uploads`.

Sin volumen, las fotos que suba el administrador se pierden en cada despliegue. Las imágenes de los alojamientos de ejemplo son enlaces externos y no dependen del volumen.

### 1.4 Variables de entorno de la API

En el servicio de la API → **Variables → Raw Editor**, pega y ajusta:

```env
DB_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
JWT_SECRET=pega-aqui-una-clave-aleatoria-de-64-caracteres
ADMIN_EMAIL=tu-correo-de-administrador
ADMIN_PASSWORD=una-contrasena-fuerte
CORS_ORIGINS=https://tu-sitio.vercel.app
FRONTEND_URL=https://tu-sitio.vercel.app
BREVO_API_KEY=clave-api-de-brevo
MAIL_FROM=Rumbo <correo-verificado-en-brevo>
APP_SEED=true
```

| Variable | Qué poner |
|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | Tal cual: Railway reemplaza `${{MySQL.…}}` con los datos del servicio MySQL. |
| `JWT_SECRET` | Clave aleatoria de 32 caracteres o más. Genérala con `openssl rand -base64 48` o con un generador de contraseñas. Si la dejas vacía, las sesiones se cierran cada vez que la API se reinicia. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Primer administrador; se crea al arrancar si no existe. |
| `CORS_ORIGINS`, `FRONTEND_URL` | La URL de Vercel, sin `/` al final. Mientras no la tengas, déjalas vacías y complétalas en el paso 3. |
| `BREVO_API_KEY`, `MAIL_FROM` | Railway bloquea el SMTP saliente (puertos 25, 465 y 587) en los planes Trial y Hobby, así que en producción los correos salen por la API HTTPS de Brevo (plan gratis, 300 correos al día). Crea la clave en Brevo → *SMTP & API* → *API Keys*. `MAIL_FROM` debe ser un remitente verificado en Brevo (el correo con el que creaste la cuenta ya lo está). Sin `BREVO_API_KEY` la API usa SMTP (`MAIL_HOST`, `MAIL_PORT`…), como en local con Mailpit. |
| `APP_SEED` | `true` carga los 20 alojamientos de demostración y usuarios de prueba con la contraseña pública `Viajes2026`. Úsalo **solo para una demo**; para uso real pon `false`. |

> **Correo:** si la clave de Brevo falta o el proveedor bloquea el envío, los correos (bienvenida, confirmación de reserva) fallan en silencio: solo quedan registrados en los logs de Railway y la aplicación sigue funcionando.

`PORT` no hace falta: Railway lo inyecta y la API lo usa. `UPLOAD_DIR` ya viene fijado en la imagen como `/app/uploads`.

### 1.5 Dominio público

1. Servicio de la API → **Settings → Networking → Generate Domain**.
2. Copia la URL, por ejemplo `https://rumbo-api-production.up.railway.app`. Es el valor de `VITE_API_URL` en Vercel.
3. Espera a que el despliegue termine (**Deployments** en verde) y abre `https://<tu-api>/swagger-ui/index.html` para confirmar que responde.

---

## 2. Frontend en Vercel

1. Entra a [vercel.com](https://vercel.com) e inicia sesión con GitHub.
2. **Add New… → Project** e importa `CamiloACastanedaM/rumbo-reservas`.
3. **Root Directory**: `frontend`. **Framework Preset**: Vite (lo detecta solo; build `npm run build`, salida `dist`).
4. **Environment Variables**: `VITE_API_URL` = la URL de Railway del paso 1.5, sin `/` al final.
5. **Deploy**. Copia la URL que entrega Vercel, por ejemplo `https://rumbo-reservas.vercel.app`.

El archivo `frontend/vercel.json` redirige todas las rutas a `index.html`, así una recarga en `/producto/3` o `/mis-reservas` no da 404.

> `VITE_API_URL` se incrusta al construir. Si la cambias, vuelve a desplegar en Vercel (**Deployments → Redeploy**).

---

## 3. Conectar los dos

1. En Railway, servicio de la API → **Variables**: pon la URL de Vercel en `CORS_ORIGINS` y `FRONTEND_URL`.
2. Railway vuelve a desplegar la API sola al guardar las variables.

Si más adelante usas un dominio propio, agrégalo también a `CORS_ORIGINS` (varias URL separadas por coma).

---

## 4. Lista de verificación

- [ ] `https://<tu-api>/swagger-ui/index.html` abre la documentación de la API.
- [ ] La página de inicio de Vercel carga y muestra alojamientos (si usaste `APP_SEED=true`) o la lista vacía.
- [ ] Registro de una cuenta nueva y entrada con ella.
- [ ] Una reserva completa: elegir fechas en el detalle, confirmar y verla en «Mis reservas».
- [ ] Recargar el navegador en una ruta profunda (por ejemplo el detalle de un alojamiento) sigue mostrando la página.
- [ ] Entrar como administrador y subir una imagen a un alojamiento; tras un nuevo despliegue la imagen sigue ahí (volumen activo).
- [ ] Con `BREVO_API_KEY`, llegan los correos de bienvenida y de reserva; si no, revisa los logs de Railway.

---

## 5. Antes de abrirlo al público

- El número de WhatsApp de demostración `573000000000` está en todos los alojamientos de ejemplo. Cámbialo por el real de cada anfitrión desde el formulario de producto del panel de administración.
- Con `APP_SEED=true` existen usuarios de prueba con la contraseña pública `Viajes2026`. Para uso real, despliega con `APP_SEED=false` sobre una base de datos vacía.
- Cambia `ADMIN_PASSWORD` por una contraseña que solo tú conozcas.
