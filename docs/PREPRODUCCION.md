# Checklist de preproduccion

## Regla de fuente unica

Los HTML y assets editables viven en la raiz del proyecto. `dist/` es un resultado generado y no debe editarse manualmente, porque el siguiente build reemplaza todo su contenido.

Antes de revisar o publicar, ejecutar desde la raiz:

```powershell
npm.cmd run preproduction
```

El comando ejecuta primero `npm run build` y despues el QA intensivo de Playwright. Para reconstruir `dist/` sin lanzar QA:

```powershell
npm.cmd run build
```

## Carpeta publicable

Subir el contenido de `dist/` como raiz del sitio:

`https://dataterritorios.corfo.cl/`

La carpeta `dist/` debe contener:

- `sitio.html` e `index.html` (misma pagina; el build copia `sitio.html` como `index.html`)
- `web_materiales/`
- `vendor/`
- `downloads/`
- `_headers`, `.htaccess` o `nginx-security-headers.conf`, segun el hosting

No subir `_archivo/`, `docs/`, prototipos ni capturas.

## Validaciones antes de subir

- Confirmar que `npm.cmd run build` termina sin errores.
- Abrir `dist/index.html` (el sitio completo).
- Confirmar que todos los recursos locales referenciados existen (`npm.cmd run validate`).
- Revisar la consola del navegador y corregir errores criticos.
- Navegar las secciones: Home, Explorar (modulos), Datos, Research Paper.
- Probar los modulos de Explorar (mapas, barras, heatmaps, rankings).
- Probar cambio de idioma.
- Probar exportacion de figuras en PNG/PDF en desktop.
- Probar descargas disponibles en espanol e ingles.
- Confirmar que `npm.cmd run qa:intensive` termina con `QA OK`.

## Pendientes conocidos

- Configurar `CONTACT_FORM_URL` en `sitio.html` cuando exista la URL final del Google Form.
- Agregar a `downloads/` el archivo de transacciones si se decide publicarlo.
- Reemplazar los placeholders de fotos/afiliaciones del Research Team cuando esten aprobados.
- Revisar institucionalmente el uso del logo BID/IDB antes de preproduccion final.
- Si el hosting final no usa Netlify/Cloudflare Pages, elegir las cabeceras correctas desde `security/`.

## Seguridad

Las paginas incluyen una politica CSP. Las cabeceras que deben venir desde servidor estan preparadas en:

- `security/_headers` para Netlify o Cloudflare Pages.
- `security/.htaccess` para Apache.
- `security/nginx-security-headers.conf` para Nginx.

Copiar al hosting solo el archivo que corresponda.
