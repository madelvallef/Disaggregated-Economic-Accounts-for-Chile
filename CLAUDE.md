# Decisiones de Diseño Fijadas

## REGLA CRITICA - NO GENERAR MOJIBAKE

Este proyecto tiene mucho texto en espanol. Los problemas de encoding con tildes, eñes y signos de apertura pasan seguido y deben tratarse como regresiones serias.

- Mantener archivos de texto en `UTF-8`.
- No introducir secuencias rotas como `Ã¡`, `Ã©`, `Ã±`, `Â¿`, `Â¡`.
- Despues de editar copy, labels, traducciones o bloques HTML/JS largos, correr `npm.cmd run validate`.
- Si la validacion detecta mojibake, correr `npm.cmd run fix:mojibake` (script deterministico `scripts/fix-mojibake.js`) y re-validar antes de continuar.
- Reglas completas para agentes (incluye Codex): `AGENTS.md` en la raiz.


## 📸 VERIFICACIÓN VISUAL — SIEMPRE PEDIR IMÁGENES AL USUARIO

**Claude NUNCA puede capturar/ver esta página por sí mismo.** El dashboard es demasiado pesado para el capturador (html-to-image expira) y su CSP (`script-src` sin `'unsafe-eval'`) bloquea la inyección de JS para screenshots y `eval_js`.

- **NO intentar** `show_html(screenshot)`, `save_screenshot`, `multi_screenshot`, `eval_js`, ni copias de depuración con CSP relajado para verificar visualmente. No funcionan o no valen la pena.
- Para verificar cualquier cambio visual, **PEDIR al usuario que comparta una imagen** del módulo/estado correspondiente y trabajar a partir de ella.

## Dimensiones y Layout de Módulos

**TODOS LOS MÓDULOS DEBEN TENER EL MISMO ANCHO Y ALTO.**

### Módulos 2, 3, 4, 5 (Full-bleed):
- **Ancho:** 100% del viewport (full-bleed)
- **Alto:** `100vh` (altura completa de la pantalla)
- **Layout:** `display: flex; flex-direction: column;`
- **Topbar:** Fixed al top, resto scrolleable o dividido en paneles

Líneas CSS clave:
```css
#module-2, #module-3 { min-height: 100vh; height: 100vh; }
.module-two { min-height: 100vh; width: 100%; max-width: none; }
```

### Módulo 1 (Landing):
- **Ancho:** 100% (full-bleed), **Alto:** `100vh` exacto
- ✅ **RESUELTO:** Module-1 ya se adapta responsivamente como los módulos 2-5 (overrides en el último `<style>` de index.html): `height: 100vh`, contenido comprimido con `clamp()` basado en `vh`, `.landing-cite` y `.landing-hero` con `flex-shrink: 0` para que nunca se aplasten, y breakpoint de compresión en `@media (max-height: 760px)`.
- ✅ Módulo 5 también fijado a `100vh` sin scrollbar interno, con la misma lógica de compresión `clamp()`.

## Topbar
- **Lang-switch:** order: -1 (izquierda)
- **Header-title:** flex: 1 (centrado)
- **Header-actions:** order: 1 (centro-derecha)
- **Logo-wrap:** order: 2, margin-left: auto (derecha)
- **Responsive:** Font-size con `clamp()` para adaptarse a pantallas

Todos los módulos usan el mismo topbar flex layout con `display: flex !important`.

---

# Decisiones de Rediseño de Páginas (2026) — HISTÓRICO

> **NOTA (jul-2026): sección histórica.** El sitio migró a una sola página (`sitio.html`, publicada también como `index.html` en `dist/`). Las páginas multipágina (`index/explore/data/research.html`) y las exploraciones `*.dc.html` están archivadas en `_archivo/legacy_2026-07/`. Las decisiones de diseño de abajo (header, copy del landing, tarjetas) siguen vigentes como referencia de contenido, pero aplican a las secciones equivalentes dentro de `sitio.html`. Fuente de estilos: `web_materiales/css/design-system.css` (tokens `--ds-*`).

## Navegación común (las 4 páginas — herramienta principal de navegación)

Estructura del header (idéntico en `index`, `explore`, `data`, `research`):

```
[logo CORFO blanco] [Inicio]  ················  [Explorar] [Datos] [Research Paper]  [ES | EN]
```

- **Izquierda:** logo CORFO + enlace **Inicio** (separado por un borde vertical sutil).
- **Derecha:** secciones + selector de idioma.
- **Tratamiento:** header institucional **navy** (`--ds-color-brand` `#221e7c`), texto blanco; enlaces `rgba(255,255,255,.85)`, activo blanco.
- **Logo:** usar `web_materiales/logo_corfo2024/logo_corfo2024_blanco_trim.png` (versión recortada a su caja real, ~3:1; el original 1920×1080 tiene mucho transparente y el wordmark blanco es invisible sobre fondo claro → solo va sobre fondo oscuro).

**Etiquetas por idioma** (switch ES/EN con `localStorage` `ced-lang`):

| Ruta | ES | EN |
| --- | --- | --- |
| `index.html` | Inicio | Home |
| `explore.html` | Explorar | Explore |
| `data.html` | Datos | Data |
| `research.html` | **Research Paper** | **Research Paper** |

(La última sección se llama "Research Paper" en ambos idiomas.)

## Home / `index.html` — dirección elegida

Dirección aprobada: **editorial centrado, minimal, sobrio** (institucional pero SIN predominio de marca CORFO). Audiencia: investigadores/académicos y formuladores de política. Sin cifras inventadas, sin imágenes.

- **Header:** el navy institucional descrito arriba (no header claro).
- **Sin eyebrow** (se eliminó la línea "CORFO × BID · Cuentas Nacionales").
- **Fondo del landing:** gris claro `--ds-color-canvas` `#f3f3f3` (NO blanco), consistente con los módulos.
- **Título:** Sculpin (`--ds-font-display`), color marca navy, ~3.4rem, `max-width` ~17ch, centrado.
- **Párrafo aprobado (texto fijo, no cambiar sin pedir):**
  > Desagregación de la actividad económica a nivel sectorial y geográfico, consistentes con Cuentas Nacionales del Banco Central de Chile. Elaborado por Huneeus & Del Valle (2026) en una colaboración entre CORFO y el BID a partir de microdatos administrativos del SII, encuestas y fuentes globales de datos de comercio.
  
  (color `--ds-color-muted`, `max-width` ~66ch, centrado.)
- **Acciones:** 3 tarjetas centradas que **interpelan al lector con una pregunta** + acción, sobre el fondo gris. La de Explorar va **destacada en navy** (acción en `--ds-color-accent` naranja); las otras dos en blanco con borde `--ds-color-line`:
  1. **Explorar** (destacada): "¿Cómo se distribuye la economía por territorio y sector?" → **Explorar los datos →**
  2. **Datos** (blanca): "¿Quieres los datos para tu propio análisis?" → **Descarga los datos →**
  3. **Research Paper** (blanca): "¿Cómo se construyen y se aplican estas cuentas?" → **Leer el paper →**
- **Mensaje en 5 s:** qué son las cuentas desagregadas para Chile y que se pueden **explorar, descargar y leer el paper** donde se construyen y aplican.
- **Bilingüe** ES/EN con el mismo switch del sitio.

Exploración de referencia: `Home Alternativas.dc.html` (opción `2a`).
