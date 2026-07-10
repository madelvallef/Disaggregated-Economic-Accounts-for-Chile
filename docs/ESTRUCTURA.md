# Estructura del proyecto

## Fuente editable y paquete generado

La raiz del proyecto es la unica fuente editable. `sitio.html`, las paginas multipagina y las carpetas `web_materiales/`, `vendor/`, `downloads/`, `uploads/` y `security/` se mantienen ahi.

`dist/` no es una segunda version del sitio: es el paquete de despliegue generado por `scripts/build.js`. El comando `npm.cmd run build` elimina el contenido anterior de `dist/` y lo reconstruye desde una lista explicita de fuentes publicables. Por lo tanto, cualquier cambio manual hecho dentro de `dist/` se perdera en el siguiente build.

El flujo es:

```text
fuentes en la raiz -> npm run build -> dist/ -> hosting
```

## Frontend

La nueva experiencia integrada vive en:

- `sitio.html`: flujo Home -> landing de Explore -> modulos verde, teal y morado -> Datos -> Citacion -> Research Paper -> Research Team -> Agradecimientos.

La version multipagina anterior se conserva temporalmente en cuatro rutas HTML:

- `index.html`: Home institucional liviano con enlaces a Explore, Data y Research.
- `explore.html`: aplicacion interactiva heredada, con modulos 2, 3 y 4 para mapas, barras, heatmaps, rankings y exportacion desktop.
- `data.html`: descargas disponibles, Research Team y Acknowledgements.
- `research.html`: pagina provisional del paper, cita BibTeX, Research Team y Acknowledgements.

Todas las paginas cargan `web_materiales/css/design-system.css`. Este archivo es la fuente de verdad para identidad, colores, tipografias, espaciado y componentes compartidos. Los estilos inline de cada HTML deben limitarse a su layout y componentes particulares. Ver `docs/DESIGN_SYSTEM.md`.

En `sitio.html`, los modulos Explore reutilizan los motores y datos de `explore.html`, pero se presentan como secciones del flujo largo. Sus headers internos estan ocultos; cada modulo usa un titulo editorial centrado, una altura comun y paneles de control con scroll interno.

Dependencias locales usadas por `explore.html`:

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

`index.html`, `data.html` y `research.html` solo cargan CSS local, tipografias y logos; no cargan los scripts pesados de visualizacion.

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

- `sitio.html`
- `index.html`
- `explore.html`
- `data.html`
- `research.html`
- assets locales
- archivos de datos
- archivos descargables
- cabeceras HTTP de seguridad

Las cabeceras sugeridas estan en `security/`.

Durante el build, `_headers`, `.htaccess` y `nginx-security-headers.conf` se copian desde `security/` hasta la raiz de `dist/`. En el hosting se debe activar o conservar solamente la configuracion que corresponda a su servidor.

## Archivo de exploraciones

`_archivo/` conserva prototipos y materiales de trabajo que no son necesarios para publicar el sitio. No debe formar parte del paquete de preproduccion.
