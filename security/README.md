# Seguridad de la página — guía rápida

Esta página es **estática** (sin backend, sin base de datos, sin login). Los cálculos
corren en el navegador con datos locales. Superficie de ataque mínima, con dos
salvedades que hay que conocer:

## Estado real (jul-2026)

1. **La página SÍ contiene formularios que piden datos personales** (nombre, apellido,
   institución, correo) en las secciones de descargas y contacto. Hoy **no envían nada**:
   sus endpoints están vacíos (`form-registry-config.js`) y `DOWNLOADS_ENABLED=false`.
   ⚠️ **Antes de configurar cualquier endpoint** debe publicarse una política de
   privacidad enlazada, un checkbox de consentimiento y el responsable del tratamiento.
2. **No hay `<meta http-equiv>` de CSP en el HTML** (0 ocurrencias). Las protecciones de
   cabeceras dependen del servidor (ver abajo). En GitHub Pages no se pueden configurar
   cabeceras; `github.io` está en la lista de precarga HSTS del navegador.
3. **Sin dependencias externas en runtime**: KaTeX, D3, jsPDF, html2canvas y las fuentes
   DM están vendorizadas localmente. No se carga nada desde CDNs, por lo que las CSP de
   los archivos de servidor pueden restringirse a `self` (sin jsdelivr ni Google Fonts).
4. Cero analytics de terceros, cero credenciales en el código, datos solo agregados
   (provincia × sector, sin microdatos identificables).

## Lo que debe configurarse en el SERVIDOR

Algunas cabeceras solo tienen efecto si las envía el servidor. Elige el archivo según
tu hosting y colócalo donde corresponda:

| Hosting | Archivo | Dónde |
|---|---|---|
| Netlify / Cloudflare Pages | `_headers` | raíz del sitio publicado |
| Apache | `.htaccess` | raíz del sitio (requiere `mod_headers`) |
| Nginx | `nginx-security-headers.conf` | `include` dentro del bloque `server { }` |

Incluyen: **HSTS** (fuerza HTTPS), **X-Content-Type-Options: nosniff**,
**X-Frame-Options / frame-ancestors** (anti-clickjacking), **Referrer-Policy**,
**Permissions-Policy** (desactiva cámara, micrófono, geolocalización, etc. que la
página no usa) y **Cross-Origin-Opener-Policy**.

> `frame-ancestors` solo funciona como cabecera de servidor (no en el `<meta>`), por eso
> está en estos archivos y no en el HTML.

> Nota: si esos archivos de cabeceras aún permiten `cdn.jsdelivr.net` o dominios de
> Google Fonts, pueden endurecerse quitándolos: el sitio ya no los usa (punto 3).
