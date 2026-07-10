# Design System

## Fuente de verdad

`web_materiales/css/design-system.css` gobierna la identidad visual del sitio (`sitio.html`, publicado unicamente como `index.html` en `dist/`).

La pagina debe incluir, despues de `vendor/dm-fonts.css`:

```html
<link rel="stylesheet" href="web_materiales/css/design-system.css" data-design-system>
```

El build falla si una pagina publica no contiene este enlace. Playwright tambien comprueba que la hoja cargue y que el token principal este disponible en el navegador.

## Que se define centralmente

Los tokens canonicos usan el prefijo `--ds-`:

- identidad: `--ds-color-brand`, `--ds-color-accent` y colores de los modulos;
- superficies y texto: `--ds-color-text`, `--ds-color-muted`, `--ds-color-line` y fondos;
- tipografia: `--ds-font-display`, `--ds-font-ui`, `--ds-font-data`, escala, pesos e interlineado;
- layout: escala de espacios, radios, sombras, alturas de header y gutter de pagina;
- componentes compartidos: header institucional, navegacion, selector de idioma, footer y botones.

Sculpin se usa para titulos institucionales. DM Sans se usa para interfaz y texto. DM Mono se reserva para cifras, indicadores y valores tabulares.

## Paleta funcional

| Uso | Token | Valor |
| --- | --- | --- |
| Marca CORFO | `--ds-color-brand` | `#221e7c` |
| Acento | `--ds-color-accent` | `#f19320` |
| Modulo 2 | `--ds-color-module-2` | `#1e5c3a` |
| Modulo 3 | `--ds-color-module-3` | `#0b4f55` |
| Modulo 4 | `--ds-color-module-4` | `#5c2d8a` |
| Texto principal | `--ds-color-text` | `#2d2f3a` |
| Lineas | `--ds-color-line` | `rgba(34, 30, 124, 0.14)` |

Los colores de modulos identifican secciones y estados de datos. No deben reemplazar el color de marca en el header institucional.

## Compatibilidad con Explore

Los modulos Explore de `sitio.html` conservan nombres historicos como `--corfo-blue`, `--m2-color` y `--font-ui`. Estos ya no contienen valores independientes: son alias definidos por el Design System y apuntan a tokens `--ds-*`.

Los estilos propios de mapas, barras, heatmaps, paneles y comportamiento responsive permanecen en el `<style>` de `sitio.html`. Pueden definir medidas locales, pero no deben volver a declarar colores, fuentes o escalas globales en `:root`.

## Reglas de cambio

1. Cambios de marca, tipografia, color, espacio, radio o componente compartido se hacen en `design-system.css`.
2. Estilos exclusivos de una pagina permanecen en el `<style>` de esa pagina y consumen tokens `--ds-*`.
3. No se agregan nuevos colores globales directamente en un HTML.
4. No se editan las copias de `dist/`; se ejecuta `npm.cmd run build`.
5. Antes de publicar se ejecuta `npm.cmd run preproduction`.

## Flujo recomendado

```text
design-system.css
        |
        +--> sitio.html
                    |
                    +--> npm run build --> dist/index.html
```

## Header / navegación común

El header es la herramienta de navegación principal y debe ser **idéntico** en todas las secciones de `sitio.html`.

Estructura:

```
[logo CORFO blanco] [Inicio]  ················  [Explorar] [Datos] [Research Paper]  [ES | EN]
```

- Izquierda: logo CORFO + enlace **Inicio** (borde vertical sutil de separación).
- Derecha: secciones + selector de idioma.
- Tratamiento institucional **navy** (`--ds-color-brand`), texto blanco; enlaces `rgba(255,255,255,.85)`, activo blanco.
- Logo: `web_materiales/logo_corfo2024/logo_corfo2024_blanco_trim.png` (recorte a caja real; solo sobre fondo oscuro).

Etiquetas por idioma (switch ES/EN, `localStorage` `ced-lang`):

| Sección | ES | EN |
| --- | --- | --- |
| `#home` | Inicio | Home |
| `#explorar` | Explorar | Explore |
| `#datos` | Datos | Data |
| `#research-paper` | Research Paper | Research Paper |

El detalle de las decisiones por sección se registra en `CLAUDE.md`.
