# Seguridad de la página — guía rápida

Esta página es **estática** (sin backend, sin formularios, sin login, sin recogida de
datos personales), por lo que su superficie de ataque es mínima. Aun así se aplicaron
los estándares habituales de endurecimiento.

## Lo aplicado en el propio HTML (ya activo)

1. **SRI (Subresource Integrity)** en los recursos de CDN (KaTeX). El navegador verifica
   con un hash criptográfico que el archivo no fue alterado; si no coincide, no lo ejecuta.
   KaTeX se fijó a la versión **0.16.10** (patch, sin cambios de comportamiento) porque es
   la versión con hash oficial publicado y verificable.
2. **Content-Security-Policy (meta)**: restringe desde qué orígenes se puede cargar
   script/estilo/fuente/imagen. Solo se permiten `self`, `cdn.jsdelivr.net` (KaTeX) y
   Google Fonts. `object-src 'none'` y `base-uri 'self'` cierran vectores comunes.
3. **Referrer-Policy** y `referrerpolicy="no-referrer"` en los recursos externos.

## Lo que debe configurarse en el SERVIDOR (no puede ir solo en el HTML)

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

## Opcional (máxima robustez): auto-alojar KaTeX y las fuentes

Hoy KaTeX y las tipografías DM Sans/DM Mono se cargan desde CDNs externos. Si quieres
**eliminar toda dependencia de terceros** (y que la página funcione 100% offline),
descarga esos archivos, colócalos en el proyecto y apunta las rutas a local. Con eso se
podría endurecer aún más la CSP (quitando `cdn.jsdelivr.net` y los dominios de Google).
