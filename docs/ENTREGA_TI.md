# Publicación en dataterritorios.corfo.cl — documento para TI

**Proyecto:** Cuentas Económicas Desagregadas de Chile (CORFO × BID — Huneeus & Del Valle, 2026)
**Contacto técnico del proyecto:** Miguel Del Valle
**Objetivo:** publicar el sitio en una subruta de `https://dataterritorios.corfo.cl/`.

---

## 1. Descripción general

Se trata de un sitio **estático de una sola página** que permite explorar y descargar las
Cuentas Económicas Desagregadas de Chile. No es una aplicación: no contempla base de datos,
login, servidor de aplicación, ni conexión a ninguna fuente de datos en tiempo real.

El sitio tiene seis secciones, de arriba hacia abajo:

| Sección | Función | Requerimiento de servidor |
| --- | --- | --- |
| **Inicio** | Presenta la colaboración técnica CORFO–BID que dio origen al proyecto. | Ninguno, es texto. |
| **Explorar** | Visualizaciones interactivas (territorio y sector, cadenas de valor, impacto productivo). Los datos son **estáticos**, incorporados en el paquete; los cálculos se ejecutan en el navegador del usuario. | Ninguno, archivos estáticos. |
| **Descarga de datos** | El usuario completa un formulario obligatorio y descarga un `.zip` con los datos. | **Un endpoint para almacenar el registro** (ver §4). |
| **Citación** | Referencia bibliográfica. Texto fijo. | Ninguno. |
| **Trabajo de investigación / Equipo** | Fichas que enlazan a un PDF y a sitios externos. | Ninguno. |
| **Contacto** | Formulario de contacto. | **El mismo endpoint** (ver §4). |

**Actualización de los datos:** es **manual y anual**. No existe ningún proceso automático
que TI deba mantener en ejecución. Actualizar consiste en volver a subir el paquete.

---

## 2. Contenido del paquete entregado

El `.zip` adjunto contiene una sola carpeta, `CED-cuentas-desagregadas/`, cuyo contenido se
copia tal cual en la ruta de destino:

```text
CED-cuentas-desagregadas/
  index.html                 (~550 KB — la página completa)
  web_materiales/            (~31 MB — datos de las visualizaciones, CSS, logos, tipografías)
  vendor/                    (~1,6 MB — D3, KaTeX, html2canvas, jsPDF, fuentes DM)
  downloads/                 (~1 MB — los archivos que el usuario descarga)
  uploads/                   (~2,7 MB — imágenes del sitio)
  _headers | .htaccess | nginx-security-headers.conf   (cabeceras, según hosting)
```

**Todas las rutas internas son relativas.** No existe ninguna ruta absoluta del tipo
`/assets/...`. En consecuencia, el sitio funciona sin modificaciones en **cualquier
subruta**: basta con copiar el contenido de la carpeta dentro del directorio de destino.
Por ejemplo, si la ruta acordada fuera `https://dataterritorios.corfo.cl/cuentas-desagregadas/`,
`index.html` quedaría en `.../cuentas-desagregadas/index.html` y el sitio operaría sin ajustes.

### 2.1 El paquete es, a la vez, el código fuente

Conviene señalarlo porque evita confusiones: este sitio no se compila. `index.html` es un
archivo HTML legible y autocontenido, no el resultado minificado de un proceso de build.
Para modificar cualquier texto, estilo o sección del sitio se edita directamente ese
archivo. No existe un "proyecto fuente" aparte que sea necesario conservar: **lo que se
publica es lo mismo que se edita.**

Los archivos `.js` de `web_materiales/` y `vendor/` tampoco requieren compilación: se
sirven tal cual al navegador.

### 2.2 Publicación y actualizaciones

El paquete se entrega adjunto a este correo, de modo que no se requiere ningún otro
mecanismo de transferencia para la publicación inicial.

Queda por definir **quién ejecuta la publicación**: lo habitual sería que su equipo suba el
contenido de la carpeta a la ruta de destino. Si prefieren que lo realice el equipo del
proyecto, se requeriría el acceso correspondiente (SFTP, panel de administración o el
mecanismo que utilicen).

Para las actualizaciones anuales de los datos, es posible repetir este mismo procedimiento
—un paquete nuevo que reemplaza al anterior— o acordar el mecanismo que les resulte más
cómodo. No es necesario definirlo ahora.

---

## 3. Requisitos de servidor

### 3.1 Servir archivos estáticos

Es el único requisito indispensable. Cualquier servidor web es suficiente: Apache, Nginx,
IIS, S3/CloudFront, Cloudflare Pages o Netlify. No requiere PHP, Node, Python ni cron.

### 3.2 Compresión y caché

**Este es el principal punto de atención técnica de la entrega.** El sitio pesa
aproximadamente **20 MB comprimidos en la primera carga**, dado que las visualizaciones
cargan sus datos como archivos JavaScript:

| Archivo | Sin comprimir | Con gzip |
| --- | --- | --- |
| `web_materiales/data/spatial_io_network_data.js` | 19,7 MB | ~14,8 MB |
| `web_materiales/data/spatial_io_flows_data.js` | 5,9 MB | ~4,5 MB |
| `web_materiales/data/module2_distribution.js` | 5,6 MB | ~0,8 MB |
| `index.html` | 551 KB | ~108 KB |

Se solicitan dos configuraciones:

1. **Compresión activa** (gzip o, preferentemente, brotli) para `.js`, `.css`, `.html` y `.json`.
2. **Caché prolongada para los assets versionados** (`Cache-Control: public, max-age=31536000`)
   y **caché corta o revalidación para `index.html`** (`no-cache`), de modo que una
   actualización se propague sin requerir que el usuario limpie su caché.

Sin estas configuraciones la primera visita resulta lenta; con ellas, las visitas
posteriores son inmediatas. Si dicho peso representa una dificultad para la
infraestructura, se solicita informarlo: es posible reducir `spatial_io_network_data.js`
—que concentra el 60% del peso— a costa de cierto nivel de detalle en una de las
visualizaciones. **Se prefiere evaluar esa decisión en conjunto y no aplicarla por defecto.**

### 3.3 Cabeceras de seguridad

El paquete incluye las cabeceras recomendadas en tres formatos (`_headers` para
Netlify/Cloudflare, `.htaccess` para Apache y `nginx-security-headers.conf` para Nginx).
Comprenden CSP, HSTS, `nosniff`, protección anti-clickjacking, `Referrer-Policy` y
`Permissions-Policy`.

Si el portal ya define sus propias cabeceras a nivel de dominio, **prevalecen las de
ustedes**. Solo se requiere revisar en conjunto dos directivas (ver §4.3), dado que pueden
bloquear el formulario. El resto es compatible con cualquier política razonable.

---

## 4. Requerimiento único: el endpoint de registro

Todo lo anterior consiste en copiar archivos. Este es el único punto que requiere una
definición de su parte.

### 4.1 Funcionamiento del formulario

El sitio tiene dos formularios (descarga y contacto). Al enviarlos, el navegador ejecuta un
`POST` con un JSON hacia una URL configurable. **Actualmente esa URL está vacía** (en
`web_materiales/js/form-registry-config.js`), por lo que el formulario informa que "el
servicio de registro aún no está configurado". Es el último punto pendiente del proyecto.

Se requiere una URL que **reciba un JSON por POST y lo almacene**. Sin autenticación, sin
sesiones y sin devolver contenido: es suficiente con que responda `200 OK`.

Ejemplo del JSON enviado por el formulario de descarga:

```json
{
  "formulario": "descargas",
  "registro_id": "9c1e...-uuid",
  "fecha_hora_utc": "2026-07-15T14:03:22.101Z",
  "idioma": "es",
  "origen": "https://dataterritorios.corfo.cl/cuentas-desagregadas/",
  "nombre": "Ana",
  "apellido": "Pérez",
  "correo": "ana.perez@universidad.cl",
  "tipo_institucion": "Universidad",
  "institucion": "Universidad de Chile",
  "uso_datos": "Investigación"
}
```

El formulario de contacto envía la misma estructura con los campos de contacto.

### 4.2 Entrega de la descarga

El `.zip` se descarga **inmediatamente** después del registro, como archivo estático del
mismo servidor. Existe un `.zip` por idioma, y se entrega el correspondiente al idioma
activo del sitio:

| Idioma | Archivo entregado | Tamaño |
| --- | --- | --- |
| Español | `downloads/es_chile_2022_dea_cuentas_economicas.zip` | 238 KB |
| Inglés | `downloads/en_chile_2022_dea_economic_accounts.zip` | 223 KB |

Cada `.zip` contiene los tres archivos de su idioma: las cuentas económicas en CSV, la
descripción metodológica en DOCX y la tabla de correspondencia en XLSX. Son archivos
estáticos servidos por el propio servidor web y no requieren procesamiento alguno.

El registro tiene por objeto llevar estadísticas de uso y comunicar actualizaciones; **no
constituye un control de acceso**. Los datos son un bien público de libre acceso. Para su
equipo esto tiene una implicancia práctica relevante: **si el endpoint de registro falla o
no está disponible, la descarga se entrega igualmente**. Es un servicio no crítico y su
indisponibilidad no compromete el funcionamiento del sitio.

**Datos personales:** el formulario recolecta nombre, correo e institución. Se solicita
indicar si CORFO tiene algún requisito respecto del lugar de almacenamiento de esos
registros, aviso de privacidad o política de retención, a fin de cumplirlo.

### 4.3 Opciones para el endpoint

**Las columnas que debe escribir el endpoint ya están definidas** en las dos plantillas
adjuntas al correo: `registro-contactos.xlsx` y `registro-descargas.xlsx`. Cada campo del
JSON corresponde a una columna; el endpoint solo debe agregar una fila por registro.

Las opciones se presentan ordenadas según su conveniencia estimada. Cualquiera de ellas
resulta adecuada:

1. **Power Automate → tabla de Excel en OneDrive/SharePoint** (opción preferida si CORFO
   opera sobre Office 365). Un flujo con disparador *"When an HTTP request is received"*
   que reciba el JSON y ejecute *"Add a row into a table"* sobre el libro correspondiente.
   No requiere desarrollo ni infraestructura nueva, y los registros permanecen dentro del
   entorno CORFO. El flujo genera una URL, que es exactamente lo que se necesita configurar.
2. **Un endpoint en el mismo dominio** (por ejemplo,
   `https://dataterritorios.corfo.cl/api/registro`) que escriba a una planilla, una tabla o
   un archivo. Es la opción más limpia desde el punto de vista del navegador: al tratarse
   del mismo origen, **no requiere modificar CSP ni CORS**.
3. **Otro servicio ya en uso en CORFO** para captura de formularios (Forms, un CRM o un
   webhook). Si reside en otro dominio, aplica la advertencia siguiente.
4. **Un buzón de correo:** un endpoint que reenvíe cada registro a una casilla. Resulta
   suficiente para el volumen esperado (decenas de registros al mes, no miles).
5. **Si TI prefiere no proveer un endpoint**, es posible recurrir a un servicio externo de
   formularios. Se prefiere no hacerlo sin su visto bueno, dado que implicaría enviar datos
   personales de usuarios a un tercero fuera de la infraestructura CORFO.

> **Nota:** un archivo `.xlsx` no puede ser el destino directo del formulario. Las
> plantillas definen la estructura de destino, no la URL: siempre se requiere un
> componente que reciba el POST y escriba la fila (de ahí la opción 1).

> ⚠️ **Si el endpoint reside en otro dominio** —lo que incluye a Power Automate, cuya URL
> es del tipo `https://prod-XX.<region>.logic.azure.com/...`— se requieren dos ajustes, sin
> los cuales el formulario falla silenciosamente:
> - **CSP:** la política actual establece `connect-src 'self'`, que **bloquea** cualquier
>   `POST` hacia otro origen. Debe agregarse ese dominio a `connect-src`.
> - **CORS:** el endpoint debe responder con `Access-Control-Allow-Origin` para
>   `dataterritorios.corfo.cl` y aceptar el preflight `OPTIONS`.
>
> El ajuste de CSP lo realiza el equipo del proyecto; se requiere que ustedes confirmen el
> dominio y la configuración de CORS.

Una vez recibida la URL, se configura en una línea y se reconstruye el paquete. Es un
cambio menor del lado del proyecto.

---

## 5. Elementos no requeridos

Para despejar dudas por adelantado, el sitio **no** requiere:

- Base de datos.
- Login, usuarios ni sesiones.
- Servidor de aplicación (PHP / Node / Java / .NET).
- Tareas programadas, cron, ETL ni conexión a fuentes de datos en vivo.
- Llamadas a servicios externos durante la navegación: todo se sirve desde el propio
  dominio. Las librerías (D3, KaTeX) están incluidas en el paquete y no provienen de un CDN.
- Cookies de seguimiento ni analítica de terceros. Si CORFO desea incorporar su analítica
  institucional, se solicita indicar cuál, a fin de integrarla.

Los únicos enlaces salientes corresponden a sitios externos que el usuario decide abrir
(el PDF del documento de trabajo y los sitios de los autores).

---

## 6. Consultas para TI

Con estas cinco respuestas es posible cerrar la entrega:

1. **Ruta:** ¿cuál es la ruta exacta bajo `dataterritorios.corfo.cl` donde se publicará el sitio?
2. **Publicación:** ¿la ejecuta su equipo a partir del paquete adjunto, o prefieren
   otorgar acceso al equipo del proyecto para realizarla?
3. **Endpoint de registro:** ¿cuál de las opciones de §4.3 resulta viable? ¿Es posible
   disponer de una URL?
4. **Compresión y caché:** ¿están activas gzip/brotli y es posible definir `Cache-Control`
   según §3.2? ¿El peso de ~20 MB representa una dificultad para la infraestructura?
5. **Cabeceras y privacidad:** ¿el portal impone su propia CSP? ¿Existe algún requisito
   CORFO sobre el almacenamiento de los datos personales del formulario?

---

## 7. Checklist de publicación

- [x] Los dos `.zip` por idioma generados, incluidos en `downloads/` y conectados al
      formulario (verificado en ES y EN).
- [ ] Ruta definida y confirmada.
- [ ] URL del endpoint de registro entregada por TI.
- [ ] Endpoint configurado en `form-registry-config.js` y paquete reconstruido.
- [ ] CSP ajustada, en caso de que el endpoint resida en otro dominio, y CORS confirmado.
- [ ] Contenido de `CED-cuentas-desagregadas/` copiado a la ruta de destino.
- [ ] Compresión y `Cache-Control` verificados en producción.
- [ ] Prueba de humo: la página abre, las visualizaciones cargan, el formulario registra y
      el `.zip` se descarga correctamente en ES y en EN.

---

## 8. Contacto

Cualquier duda sobre el contenido de este documento o sobre el paquete entregado puede
dirigirse al equipo del proyecto. La documentación técnica adicional (justificación de las
cabeceras de seguridad, estructura interna del sitio) está disponible a solicitud.
</content>
