# Disaggregated Economic Accounts for Chile

Sitio web interactivo de las **Cuentas Económicas Desagregadas de Chile**. Permite explorar la actividad económica por territorio y sector, las cadenas de valor y la propagación geográfica y sectorial de shocks de productividad.

**Sitio público:** [madelvallef.github.io/Disaggregated-Economic-Accounts-for-Chile](https://madelvallef.github.io/Disaggregated-Economic-Accounts-for-Chile/)

## Qué incluye

- **Explorar:** caracterización territorial y sectorial, geografía de cadenas de valor e impacto productivo.
- **Datos:** archivos CSV, XLSX y documentación técnica para descargar.
- **Trabajo de investigación:** cita, equipo de investigación y agradecimientos institucionales.
- Interfaz bilingüe en español e inglés, sin dependencias externas durante la navegación.

## Arquitectura

El sitio es estático: no requiere API, base de datos, login ni servidor de aplicación. Los cálculos y las visualizaciones se ejecutan en el navegador a partir de los insumos locales incluidos en el paquete público.

| Ruta | Propósito |
| --- | --- |
| `sitio.html` | Fuente editable única de la página. |
| `web_materiales/` | Datos de las visualizaciones, design system, logos, tipografías y scripts propios. |
| `vendor/` | Dependencias locales: D3, KaTeX, html2canvas, jsPDF y fuentes DM. |
| `downloads/` | Archivos disponibles para los usuarios. |
| `uploads/` | Sólo imágenes que el sitio referencia públicamente. |
| `security/` | Cabeceras de seguridad para Apache, Nginx y hosting estático. |
| `scripts/` | Validación, corrección de encoding y construcción del paquete. |
| `docs/` | Documentación de la estructura, diseño y preproducción. |
| `dist/` | Artefacto generado para publicar. Nunca se edita a mano ni se versiona. |

La fuente de verdad del sistema visual es [`web_materiales/css/design-system.css`](web_materiales/css/design-system.css). Sus principios y componentes están documentados en [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Desarrollo local

Requiere Node.js 22 o superior.

```powershell
npm.cmd install
npm.cmd run validate
npm.cmd run qa:intensive
```

Para abrir el sitio durante el desarrollo:

```powershell
py -3 -m http.server 8766
```

Luego visita `http://127.0.0.1:8766/sitio.html`.

## Build y publicación

```powershell
npm.cmd run preproduction
```

El comando valida las fuentes, reconstruye `dist/` y ejecuta el QA de Playwright. El build genera exactamente este paquete publicable:

```text
dist/
  index.html
  web_materiales/
  vendor/
  downloads/
  uploads/
  _headers
  .htaccess
  nginx-security-headers.conf
```

GitHub Pages ejecuta este build automáticamente al actualizar `main` y despliega **sólo `dist/`**. Para otro hosting, subir el contenido de `dist/` como raíz del sitio, por ejemplo a `https://dataterritorios.corfo.cl/`.

## Calidad y encoding

El proyecto usa texto bilingüe con tildes, eñes y signos de apertura. Todos los archivos de texto deben guardarse en UTF-8. Después de modificar contenido visible, ejecutar:

```powershell
npm.cmd run validate
```

La validación detecta mojibake y recursos locales faltantes. Si fuera necesario reparar encoding, usar `npm.cmd run fix:mojibake` y validar de nuevo.

## Política de repositorio

El repositorio mantiene sólo el código, los datos y los assets necesarios para reproducir el sitio. Prototipos, capturas de diseño, backups, instrucciones internas y material de iteración viven localmente en `_archivo/` o `qa/layout/` y están ignorados por Git.

La documentación técnica ampliada está en [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md) y el checklist operativo en [`docs/PREPRODUCCION.md`](docs/PREPRODUCCION.md).
