# Entrega para TI - Cuentas Economicas Desagregadas de Chile

**Version del paquete:** 26 de agosto de 2026
**Proyecto:** Cuentas Economicas Desagregadas de Chile (CORFO - BID)
**Contacto tecnico:** Miguel Del Valle
**Destino previsto:** `https://dataterritorios.corfo.cl/disaggregated-economic-accounts/`

## 1. Que se entrega

El archivo `CED-cuentas-desagregadas_TI_2026-08-26.zip` contiene una carpeta unica,
`CED-cuentas-desagregadas/`. Su contenido debe copiarse completo al directorio publico
que TI defina. El sitio es estatico: no requiere base de datos, login, servidor de
aplicacion, tareas programadas ni acceso a datos en tiempo real.

```text
CED-cuentas-desagregadas/
  index.html
  web_materiales/       Datos de visualizaciones, estilos, fuentes, logos y scripts locales
  vendor/               Librerias locales (D3, KaTeX, html2canvas y jsPDF)
  downloads/            Archivos de datos y paquetes de descarga por idioma
  uploads/              Imagenes del sitio
  _headers              Cabeceras para Netlify o Cloudflare Pages
  .htaccess             Cabeceras para Apache
  nginx-security-headers.conf  Cabeceras para Nginx
```

Todas las rutas del sitio son relativas. Por ejemplo, puede alojarse sin cambios en
`https://dataterritorios.corfo.cl/cuentas-desagregadas/`.

## 2. Tamano y contenido de datos

El paquete comprimido pesa **125.80 MiB** (131,910,824 bytes). Una vez
descomprimido ocupa **449.21 MiB** (471,037,130 bytes). La mayor parte corresponde a los
flujos espaciales de insumo-producto incluidos en `downloads/`:

| Recurso | Tamano aproximado |
| --- | ---: |
| `downloads/es_chile_2022_dea_flujos_io_espaciales.csv` | 172 MiB |
| `downloads/en_chile_2022_dea_spatial_io_flows.csv` | 194 MiB |
| Paquete de descarga en espanol | 25 MiB |
| Paquete de descarga en ingles | 28 MiB |
| Visualizaciones, fuentes, logos y librerias | 29 MiB |

Los paquetes descargables por idioma contienen cuatro insumos: cuentas economicas en
CSV, flujos espaciales de insumo-producto en CSV, tabla de correspondencia en XLSX y
descripcion metodologica en DOCX. Los datos corresponden al **ano 2022**, cubren las
**56 provincias** de Chile y estan desagregados en **46 sectores**.

Los CSV grandes se descargan solamente cuando la persona solicita los datos; no se cargan
durante la navegacion normal de las visualizaciones. Las visualizaciones si descargan en
segundo plano (~28 MB de datos JS con atributo `defer`; comprimen bien con gzip/brotli),
sin bloquear el primer render. El servidor debe permitir servir archivos estaticos de al
menos 203 MB.

## 3. Publicacion

1. Descomprimir `CED-cuentas-desagregadas_TI_2026-08-26.zip`.
2. Copiar el contenido de `CED-cuentas-desagregadas/` a la subruta publica definida.
3. Verificar que `index.html` abra y que las rutas relativas a `web_materiales/`,
   `vendor/`, `downloads/` y `uploads/` respondan correctamente.
4. Aplicar **solo uno** de los archivos de cabeceras segun el servidor usado:

| Hosting | Archivo a usar |
| --- | --- |
| Apache | `.htaccess` |
| Nginx | `nginx-security-headers.conf` como `include` dentro del bloque `server` |
| Netlify / Cloudflare Pages | `_headers` |

Se recomienda habilitar compresion gzip o brotli para HTML, CSS, JS y JSON. Para evitar
problemas de actualizacion, `index.html` debe usar cache corta o revalidacion; los assets
pueden usar cache larga.

## 4. Registros de descarga y contacto

La navegacion y las visualizaciones no requieren backend. Los formularios registran
informacion mediante el endpoint configurado en
`web_materiales/js/form-registry-config.js` (desde jul-2026 viene preconfigurado el
Google Apps Script definido por TI; puede sobrescribirse con `window.CED_FORM_ENDPOINTS`
antes de cargar ese archivo):

- **Registro obligatorio:** el envio del formulario requiere que el endpoint responda
  `{"status":"ok"}`. Sin registro exitoso no se inicia la descarga.
- **Descargas:** ademas del registro, la entrega del ZIP depende del interruptor
  `DOWNLOADS_ENABLED` en `web_materiales/js/form-registry.js` (hoy `false`: se registra
  el dato y se informa que las descargas estan temporalmente deshabilitadas).
- Los formularios envian un `POST` `application/x-www-form-urlencoded` (legible en Apps
  Script via `e.parameter`). Incluyen identificador, fecha UTC, idioma, origen y los
  campos solicitados. Contacto admite multiples motivos: Datos, Visualizacion, Trabajo
  de Investigacion y Otros.
- La CSP de los archivos de cabeceras ya permite `connect-src` hacia
  `https://script.google.com` y `https://script.googleusercontent.com`; si se cambia el
  endpoint a otro dominio, actualizar esa directiva.

Se entregan por separado las estructuras de destino:

- `operacion/registros/registro-contactos.xlsx`
- `operacion/registros/registro-descargas.xlsx`

Estos libros **no deben publicarse** ni enlazarse desde el sitio. Son plantillas para que
el servicio de TI agregue una fila por registro. La alternativa preferida es un flujo de
Power Automate que reciba el JSON y escriba en una tabla Excel de OneDrive o SharePoint.

Si el endpoint esta en otro dominio, debe aceptar CORS desde
`dataterritorios.corfo.cl`. Tambien se debe agregar su dominio a la directiva `connect-src`
de la Content-Security-Policy antes de publicar la URL.

## 5. No requerido

El sitio no requiere:

- Base de datos, usuarios, sesiones ni autenticacion.
- PHP, Node, Java, .NET, Python, cron o procesos ETL.
- Servicios de terceros para las visualizaciones.
- Cookies de seguimiento ni analitica de terceros.

## 6. Checklist para TI

- [ ] Definir la subruta de `dataterritorios.corfo.cl`.
- [ ] Copiar integramente el contenido de `CED-cuentas-desagregadas/`.
- [ ] Verificar la carga de las visualizaciones y los dos paquetes de descarga.
- [ ] Activar compresion y revisar la politica de cache.
- [ ] Aplicar las cabeceras adecuadas al servidor.
- [ ] Confirmar el limite de tamano para servir archivos de hasta 203 MB.
- [ ] Definir si se requiere registrar descargas y/o habilitar contacto.
- [ ] En caso de usar endpoint externo, confirmar CORS y actualizar CSP.

## 7. Integridad del paquete

SHA-256 de `CED-cuentas-desagregadas_TI_2026-08-26.zip`:

```text
C5B65957B6E68C102C4FF9931A51587001C3869AE65AAEC8C19C94F89691CE51
```
