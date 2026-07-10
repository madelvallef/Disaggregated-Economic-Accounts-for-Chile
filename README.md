# Pagina web CORFO - Cuentas Economicas Territorialmente Desagregadas

Este proyecto contiene una pagina web estatica para publicar el dashboard de Cuentas Economicas Territorialmente Desagregadas de Chile.

## Estructura principal

- `sitio.html`: EL sitio (fuente editable). Una sola pagina con todo el contenido (home, explorar, datos, research). En `dist/` se publica UNICAMENTE como `index.html` (no hay `dist/sitio.html`).
- `web_materiales/`: datos JavaScript, logos CORFO/BID y tipografias Sculpin usadas por el sitio.
- `web_materiales/css/design-system.css`: fuente unica de colores, tipografias, espaciado y componentes compartidos.
- `vendor/`: librerias locales usadas por la pagina (`d3`, `html2canvas`, `jsPDF`, `KaTeX` y fuentes DM).
- `downloads/`: archivos descargables para usuarios finales.
- `uploads/`: imagenes publicables del paper y del Research Team usadas por `sitio.html`.
- `security/`: ejemplos de cabeceras de seguridad para distintos tipos de hosting.
- `scripts/build.js`: genera el paquete publicable desde una lista explicita de fuentes.
- `docs/`: documentacion tecnica y checklist de preproduccion.
- `dist/`: resultado generado y publicable; no se edita manualmente.
- `_archivo/`: exploraciones, prototipos, capturas y materiales no necesarios para preproduccion. Incluye `_archivo/legacy_2026-07/` con la antigua version multipagina (`index/explore/data/research.html`, `*.dc.html`, `support.js`), ya migrada a `sitio.html`.

## Fuente de trabajo y build

La unica fuente editable del sitio esta en la raiz del proyecto:

- editar `sitio.html` (unica pagina del sitio);
- editar assets en `web_materiales/`, librerias locales en `vendor/` y archivos publicos en `downloads/`;
- editar cabeceras en `security/`.

## Regla critica de encoding

Este proyecto usa mucho texto en espanol con tildes, eñes y signos de apertura. El mojibake debe tratarse como una regresion seria.

- Guardar HTML, JS, CSS y Markdown en `UTF-8`.
- No aceptar secuencias rotas como `Ã¡`, `Ã©`, `Ã±`, `Â¿`, `Â¡`.
- Despues de editar textos, labels o traducciones, correr `npm.cmd run validate`.
- Si aparece mojibake, correr `npm.cmd run fix:mojibake` y re-validar antes de seguir iterando.
- Reglas completas para agentes IA: `AGENTS.md` en la raiz.

No editar archivos dentro de `dist/`. Esa carpeta se elimina y reconstruye automaticamente con:

```powershell
npm.cmd run build
```

El build copia `sitio.html` como `dist/index.html` (unico archivo HTML publicado), `web_materiales/`, `vendor/`, `downloads/`, `uploads/` y los tres archivos de cabeceras preparados en `security/`.

## Publicacion

Para preproduccion o produccion, subir el contenido de `dist/` como raiz del sitio en:

`https://dataterritorios.corfo.cl/`

Flujo recomendado:

```powershell
npm.cmd run preproduction
```

Este comando reconstruye `dist/` y ejecuta el QA intensivo de Playwright. Si solo se necesita regenerar el paquete, usar `npm.cmd run build`.

No se debe subir `_archivo/`, `docs/`, `qa/`, `scripts/` ni `node_modules/` como parte del sitio publico.

## Estado funcional relevante

- El sitio es estatico: no requiere backend de aplicacion, base de datos, login ni servidor propio.
- Las visualizaciones se renderizan en el navegador a partir de archivos locales bajo `web_materiales/data/`.
- El boton flotante de contacto existe, pero `CONTACT_FORM_URL` esta pendiente de configuracion.
- La base de transacciones no se muestra como descarga publica hasta que el CSV definitivo exista en `downloads/`.

Ver detalles en `docs/ESTRUCTURA.md` y `docs/PREPRODUCCION.md`.

Las reglas visuales y de gobierno estan documentadas en `docs/DESIGN_SYSTEM.md`.
