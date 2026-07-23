# Entrega para TI - Cuentas Economicas Desagregadas de Chile

**Version del paquete:** 22 de julio de 2026
**Proyecto:** Cuentas Economicas Desagregadas de Chile (CORFO - BID)
**Contacto tecnico:** Miguel Del Valle
**Destino previsto:** una subruta de `https://dataterritorios.corfo.cl/`

## 1. Que se entrega

El archivo `CED-cuentas-desagregadas_TI_2026-07-22.zip` contiene una carpeta unica,
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

El paquete comprimido pesa aproximadamente **137 MiB** (143,454,028 bytes). Una vez
descomprimido ocupa aproximadamente **479 MiB**. La mayor parte corresponde a los
flujos espaciales de insumo-producto incluidos en `downloads/`:

| Recurso | Tamano aproximado |
| --- | ---: |
| `downloads/es_chile_2022_dea_flujos_io_espaciales.csv` | 192 MiB |
| `downloads/en_chile_2022_dea_spatial_io_flows.csv` | 194 MiB |
| Paquete de descarga en espanol | 29 MiB |
| Paquete de descarga en ingles | 28 MiB |
| Visualizaciones, fuentes, logos y librerias | 35 MiB |

Los paquetes descargables por idioma contienen cuatro insumos: cuentas economicas en
CSV, flujos espaciales de insumo-producto en CSV, tabla de correspondencia en XLSX y
descripcion metodologica en DOCX. Los datos corresponden al **ano 2022**, cubren las
**56 provincias** de Chile y estan desagregados en **46 sectores**.

Los CSV grandes se descargan solamente cuando la persona solicita los datos; no se cargan
durante la navegacion normal de las visualizaciones. El servidor debe permitir servir
archivos estaticos de al menos 203 MB.

## 3. Publicacion

1. Descomprimir `CED-cuentas-desagregadas_TI_2026-07-22.zip`.
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

La navegacion y las visualizaciones no requieren backend. Los formularios pueden registrar
informacion mediante una URL configurable en
`web_materiales/js/form-registry-config.js`:

```js
window.CED_FORM_ENDPOINTS = {
  contact: "",
  downloads: ""
};
```

- **Descargas:** la descarga del ZIP correspondiente al idioma activo se inicia siempre,
  incluso sin endpoint. Configurar `downloads` es opcional y sirve solo para registrar el
  uso.
- **Contacto:** requiere configurar `contact` para almacenar las consultas. Si no existe
  endpoint, el sitio informa que el servicio de registro no esta configurado.
- Los formularios envian un `POST` con JSON. Incluyen identificador, fecha UTC, idioma,
  origen y los campos solicitados. Contacto admite multiples motivos: Datos,
  Visualizacion, Trabajo de Investigacion y Otros.

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

SHA-256 de `CED-cuentas-desagregadas_TI_2026-07-22.zip`:

```text
B8D88A6DB998C4336909C9DAF8B9FEF07BCC5BB9AEEF6FDDEAE14BB9A59FAEB9
```
