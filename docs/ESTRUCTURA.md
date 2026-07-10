# Estructura del proyecto

## Fuente editable y paquete generado

La raiz del proyecto es la unica fuente editable. `sitio.html` (la unica pagina del sitio) y las carpetas `web_materiales/`, `vendor/`, `downloads/`, `uploads/` y `security/` se mantienen ahi.

`dist/` no es una segunda version del sitio: es el paquete de despliegue generado por `scripts/build.js`. El comando `npm.cmd run build` elimina el contenido anterior de `dist/` y lo reconstruye desde una lista explicita de fuentes publicables. Por lo tanto, cualquier cambio manual hecho dentro de `dist/` se perdera en el siguiente build.

El flujo es:

```text
fuentes en la raiz -> npm run build -> dist/ -> hosting
```

## Frontend

Todo el sitio vive en una sola pagina:

- `sitio.html`: flujo Home -> landing de Explore -> modulos verde, teal y morado -> Datos -> Citacion -> Research Paper -> Research Team -> Agradecimientos. En `dist/` se publica ademas como `index.html`.

La version multipagina anterior (`index.html`, `explore.html`, `data.html`, `research.html`, exploraciones `*.dc.html` y su runtime `support.js`) fue migrada por completo a `sitio.html` y esta archivada en `_archivo/legacy_2026-07/`.

La pagina carga `web_materiales/css/design-system.css`. Este archivo es la fuente de verdad para identidad, colores, tipografias, espaciado y componentes compartidos. Los estilos inline deben limitarse a layout y componentes particulares. Ver `docs/DESIGN_SYSTEM.md`.

Los modulos Explore se presentan como secciones del flujo largo. Sus headers internos estan ocultos; cada modulo usa un titulo editorial centrado, una altura comun y paneles de control con scroll interno.

Dependencias locales usadas por `sitio.html`:

- `vendor/d3.min.js`
- `vendor/html2canvas.min.js`
- `vendor/jspdf.umd.min.js`
- `vendor/katex/katex.min.css`
- `vendor/katex/katex.min.js`
- `vendor/dm-fonts.css`
- `web_materiales/fonts/Sculpin_Regular.otf`
- `web_materiales/fonts/Sculpin_Bold.otf`
- `web_materiales/logo_corfo2024/logo_corfo2024_blanco.png`
- `web_materiales/logo_iadb/idb_logo.svg`

## Datos e insumos

`web_materiales/data/` contiene los archivos JavaScript que alimentan las visualizaciones:

- `module2_distribution.js`
- `module3_app.js`
- `module4_app.js`
- `module4_engine.js`
- `spatial_io_flows_data.js`
- `spatial_io_network_data.js`

`downloads/` contiene los archivos descargables para usuarios:

- `es_chile_2022_dea_descripcion.docx`
- `es_chile_2022_dea_cuentas_economicas.csv`
- `es_chile_2022_dea_tabla_correspondencia.xlsx`
- `en_chile_2022_dea_description.docx`
- `en_chile_2022_dea_economic_accounts.csv`
- `en_chile_2022_dea_concordance_table.xlsx`

Pendiente: la base de transacciones no se publica como descarga hasta que el archivo definitivo este presente en `downloads/`.

## Backend y hosting

No hay backend de aplicacion. El sitio no usa base de datos, autenticacion, formularios propios ni endpoints dinamicos.

Para efectos de preproduccion, el "backend" corresponde al hosting estatico que sirve:

- `sitio.html` (servida tambien como `index.html`)
- assets locales
- archivos de datos
- archivos descargables
- cabeceras HTTP de seguridad

Las cabeceras sugeridas estan en `security/`.

Durante el build, `_headers`, `.htaccess` y `nginx-security-headers.conf` se copian desde `security/` hasta la raiz de `dist/`. En el hosting se debe activar o conservar solamente la configuracion que corresponda a su servidor.

## Archivo de exploraciones

`_archivo/` conserva prototipos y materiales de trabajo que no son necesarios para publicar el sitio. No debe formar parte del paquete de preproduccion.
