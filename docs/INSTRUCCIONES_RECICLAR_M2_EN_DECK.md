# Instrucciones para reutilizar el Modulo 2 en otro deck

## Objetivo

Incorpora al deck de destino el panel de control y las tres visualizaciones del Modulo 2, **La Economia a traves de sus sectores y sus territorios**:

1. Vista territorial: mapa de Chile.
2. Vista sectorial: grafico de barras por sector.
3. Vista territorial-sectorial: heatmap.

El resultado debe conservar las interacciones, los datos y la estructura analitica del Modulo 2, pero adoptar por completo el estilo visual modernista del deck de destino: sus tokens, tipografia, espacios, colores de superficie, bordes y componentes de navegacion.

## Regla no negociable

El proyecto de referencia es **solo lectura**. No modifiques, elimines, formatees ni generes archivos dentro de:

```text
C:\Users\fcarr\Dropbox\CORFO\CORFO_2026\7_Webpage\Disaggregated Economic Accounts for Chile v2
```

Trabaja exclusivamente en el directorio del deck de destino. Si necesitas codigo o datos del proyecto de referencia, copialos al proyecto de destino y adapta alli las rutas y nombres necesarios. Nunca enlaces el sitio publicado al directorio local de referencia.

## Fuente de referencia

Archivo principal:

```text
<SOURCE_DIR>\sitio.html
```

Donde `<SOURCE_DIR>` es el directorio del proyecto de referencia indicado arriba.

El Modulo 2 completo esta delimitado por:

```text
sitio.html, lineas aproximadas 5274 a 5541
```

Elementos que se deben reutilizar como referencia funcional:

| Pieza | Selector o ID en la fuente |
| --- | --- |
| Contenedor del modulo | `#module-2` |
| Panel de control | `#module-2-controls` |
| Variable | `#m2-metric` |
| Analisis | `#m2-analysis` y `.m2-analysis-cards` |
| Unidad | `#m2-unit` y `.m2-unit-cards` |
| Tabs de visualizacion | `.module-tabs` dentro de `#module-2` |
| Vista territorial | `[data-view-panel="geo"]`, `#map-chile`, `#geo-legend` |
| Vista sectorial | `[data-view-panel="sector"]`, `#sector-bars`, `#sector-bars-unit`, `#macro-legend` |
| Vista territorial-sectorial | `[data-view-panel="matrix"]`, `#matrix-svg`, `#matrix-legend` |

El codigo de render e interaccion del Modulo 2 esta en el script inline de `sitio.html`, principalmente entre las lineas aproximadas 6448 y 9930. Antes de copiarlo, leelo y separa solo lo necesario para M2; no copies logica de los Modulos 3 o 4.

## Datos y librerias que deben viajar al proyecto de destino

Como minimo, copia al proyecto de destino estos archivos, conservando una estructura de rutas estable:

```text
<SOURCE_DIR>\vendor\d3.min.js
<SOURCE_DIR>\web_materiales\data\module2_distribution.js
```

La pagina fuente los carga aproximadamente en las lineas 5882 y 5885 de `sitio.html`.

No copies ni cargues datos de los Modulos 3 o 4 para esta integracion. Si el codigo extraido revela otra dependencia estricta, copiala de forma explicita al directorio de datos del deck y documenta su proposito.

## Panel que debe implementar el deck

Mantiene estos seis grupos, en este orden. Respeta la jerarquia de informacion, pero redisenalos con los componentes propios del deck.

1. **Variable**
   - Selector de indicador, con `PIB` como estado inicial.
2. **Analisis**
   - `Distribucion`.
   - `Dependencia territorial`.
   - `Dependencia sectorial`.
   - Conserva las instrucciones contextuales asociadas a cada analisis.
3. **Seleccion**
   - Filtros de geografia y sectores.
   - Acciones `Todos` y `Limpiar`.
4. **Unidad de medida**
   - Monto en Billones de CLP.
   - Porcentaje.
   - Indice relativo, solo cuando sea conceptualmente valido para la combinacion seleccionada.
5. **Nivel de agregacion territorial**
   - Macrozona, Region, Provincia.
6. **Nivel de agregacion sectorial**
   - Industria, Sector, Actividad.

Los nombres, unidades y definiciones deben venir de una configuracion o diccionario comun del deck, no de texto repetido dentro de cada vista.

## Comportamiento requerido

- Los tres tabs comparten exactamente el mismo estado de variable, analisis, filtros, unidad y agregacion.
- Al cambiar entre `Territorios`, `Sectores` y `Territorios - Sectores`, no reinicies los filtros ni la seleccion del usuario.
- Conserva tooltips y hover cards para leer valores sin perder el contexto de variable, unidad y filtros activos.
- Mantiene las leyendas junto a cada figura y adapta solo su disposicion segun el ancho disponible.
- Incluye una accion de descarga y una accion de ampliar por figura, si el deck admite estas acciones. La ampliacion no debe eliminar hover cards ni alterar el tipo de leyenda.
- El panel puede abrirse y cerrarse en desktop; en movil comienza cerrado y se abre en un drawer claro, con foco manejado correctamente.

## Adaptacion visual al deck modernista

No copies el CSS del sitio fuente como una capa completa. Extrae la funcionalidad y reconstruye la presentacion con el sistema visual del deck:

- Usa la paleta, tipografia y escala de espacios del deck como fuente de verdad.
- Conserva el verde como senal semantica de este modulo, pero resuelvelo mediante los tokens del deck.
- Evita tarjetas decorativas, sombras excesivas y gradientes. El panel debe leerse como una herramienta de analisis, no como una landing page.
- Deja una jerarquia clara: titulo del modulo, tabs de vista, figura, leyenda, controles secundarios.
- En desktop, panel y figura deben formar una sola composicion alineada. En movil, la figura ocupa el area principal y el panel se abre como drawer.
- Mantiene el fondo claro incluso cuando el dispositivo use modo oscuro, salvo que el deck tenga un modo oscuro real y completamente diseñado.
- Asegura contraste suficiente, foco visible, etiquetas semanticas, objetivos tactiles de al menos 44 px y navegacion por teclado.

## Arquitectura recomendada en el proyecto destino

```text
deck-destino/
  components/
    module-2-panel.*
    module-2-tabs.*
    module-2-map.*
    module-2-sector-chart.*
    module-2-heatmap.*
  data/
    module2_distribution.js
  lib/
    d3.min.js
  styles/
    module-2.*
```

Mantiene un unico estado de M2 (variable, analisis, filtros, unidad, agregaciones y vista activa). Las tres visualizaciones deben consumir ese estado, no duplicar calculos o textos.

## Verificacion antes de entregar

1. Prueba los tres tabs en desktop y movil.
2. Prueba cada tipo de analisis, filtro, unidad y nivel de agregacion aplicable.
3. Confirma que el mapa, las barras y el heatmap conservan la misma unidad y filtros activos.
4. Confirma que las leyendas no se recortan y que los ejes del heatmap se leen sin requerir scroll horizontal o vertical en movil.
5. Revisa tooltips, foco de teclado, drawers y hover cards.
6. Verifica que ningun archivo del proyecto de referencia haya cambiado: debe permanecer limpio respecto de su estado inicial.

## Prompt breve para pegar en el otro proyecto

```text
Necesito reutilizar el Modulo 2 del proyecto de referencia ubicado en:
C:\\Users\\fcarr\\Dropbox\\CORFO\\CORFO_2026\\7_Webpage\\Disaggregated Economic Accounts for Chile v2

Ese proyecto es estrictamente de solo lectura: no edites, borres, formatees ni generes archivos alli. Trabaja solo en este proyecto (el deck). Lee <SOURCE_DIR>\\sitio.html, especialmente el bloque #module-2 (aprox. lineas 5274-5541), y reutiliza en este deck el panel #module-2-controls y sus tres visualizaciones: mapa territorial (#map-chile), barras sectoriales (#sector-bars) y heatmap territorial-sectorial (#matrix-svg). Copia al deck los datos y librerias estrictamente necesarios, como vendor\\d3.min.js y web_materiales\\data\\module2_distribution.js; no enlaces al directorio fuente ni copies logica de M3/M4.

Conserva las interacciones y el modelo analitico de M2, pero reconstruye el layout y estilos usando el design system modernista de este deck. Los seis bloques del panel son Variable, Analisis, Seleccion, Unidad de medida, Nivel de agregacion territorial y Nivel de agregacion sectorial. Usa un unico estado compartido por panel, tabs y las tres figuras; no dupliques contenido ni estado. Implementa una experiencia desktop y movil accesible, con panel como drawer en movil, leyendas legibles, hover cards, foco visible y fondo claro consistente.

Al terminar, valida los tres tabs en desktop y movil. Antes de entregar, confirma explicitamente que no modificaste ningun archivo del proyecto de referencia.
```
