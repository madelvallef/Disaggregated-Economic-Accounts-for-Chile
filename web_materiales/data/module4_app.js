/* ── Módulo 4 · App (Exposición territorial y sectorial ante un shock productivo) ──
   Diseño Opción D: panel de control a la izquierda + visualización a la derecha
   con 3 pestañas (territorial / sectorial / territorial-sectorial). Calcula la
   exposición en vivo para el productor seleccionado y la descompone en
   Total / Propio / Directo / Indirecto. */
(function () {
  const section = document.getElementById("module-4");
  if (!section) return;

  const M4_IND_COLORS = {
    "Agropecuario-silvícola y Pesca": "#f19320",
    "Minería": "#20a6f1",
    "Manufactura": "#72c7d5",
    "Infraestructura y Construcción": "#78d6bb",
    "Servicios Empresariales": "#c7f120",
    "Servicios Sociales": "#fd8983"
  };

  const T = {
    es: {
      title: "Impacto productivo nacional",
      intro: "Seleccione una ubicación y un sector para explorar cómo se distribuye territorial y sectorialmente su importancia dentro de la economía nacional.",
      producerTitle: "Elige el productor",
      producerInstr: "Selecciona la provincia y el sector del productor cuyo impacto en la economía nacional quieres rastrear.",
      profileTitle: "Perfil del productor",
      profileInstr: "Cuánto pesa este productor en el PIB nacional y de qué se compone su impacto.",
      componentInstr: "Decide qué parte del impacto observar en el mapa: el total, solo su producción propia, o los efectos que genera en su cadena.",
      qTotal: "¿Cuál es el impacto completo del productor?",
      qOwn: "¿Cuánto pesa por su propia producción?",
      qDir: "¿A quién afecta en el primer eslabón?",
      qInd: "¿Cómo se propaga por el resto de la economía?",
      detail: "Ajusta el detalle",
      detailInstr: "Escoge con qué nivel de agregación territorial y sectorial se muestra el impacto en el mapa.",
      aggGeoSub: "Territorio", aggSecSub: "Sector",
      unitNote: "Los valores se muestran como participación (%) en el impacto productivo nacional del productor. Suman 100%.",
      producer: "Productor de referencia", location: "Provincia", sector: "Sector",       locPh: "Escriba o elija una provincia…", secPh: "Escriba o elija un sector…",
      domar: "Domar weight", composition: "Composición del impacto",
      own: "Propio", direct: "Directo", indirect: "Indirecto", total: "Total",
      viz: "Visualización", aggGeo: "Nivel de agregación · Territorio", aggSec: "Nivel de agregación · Sector",
      macrozone: "Macrozona", region: "Región", province: "Provincia",
      industry: "Industria", pibr13: "Sector", activity: "Actividad",
      component: "Componente", unit: "Unidad de medida", unitVal: "Participación en el impacto productivo nacional",
      compTotalSub: "Impacto productivo total del productor",
      compOwnSub: "Solo la producción directa del productor",
      compDirectSub: "Cadena directa (primer eslabón)",
      compIndirectSub: "Cadenas sucesivas de la economía",
      method: "Para más detalle", unitPercent: "Porcentaje\u00A0(%)",
      legendNearZero: "≈0 (bajo el umbral visible)", legendZero: "Sin datos o valor 0",
      tabGeo: "Distribución territorial del impacto", tabSec: "Distribución sectorial del impacto", tabCell: "Distribución territorial-sectorial del impacto",
      tabKicker: "Impacto", axisGeo: "Territorial", axisSec: "Sectorial", axisCell: "Territorial–Sectorial",
      railGeo: "Territorios Top", railSec: "Sectores Top", railCell: "Combinaciones Top",
      hcRel: "Impacto relativo", hcTerr: "Este territorio", hcSec: "Este sector", hcComb: "Esta combinación territorio-sector",
      hcConc: "concentra", hcOf: "del impacto productivo nacional asociado al productor seleccionado.",
      hcKindTerr: "Territorio", hcKindSec: "Sector", hcKindComb: "Territorio · Sector",
      hcShareOf: "del impacto productivo total de", hcPos: "Posición", hcOfN: "de",
      hcUnitTerr: "territorios", hcUnitSec: "sectores", hcUnitComb: "combinaciones",
      tagOwn: "· propio", tagDir: "· vínculo directo", tagInd: "· vínculo indirecto",
      noResults: "Sin resultados",
      infoDomar: "El Domar weight mide la producción bruta de la ubicación-sector seleccionada en relación con el PIB nacional.",
      infoMetric: "Participación de cada territorio, sector o combinación en el impacto productivo nacional asociado al productor seleccionado (las participaciones suman 100%).",
      infoOwn: "Impacto propio: la parte del Domar weight que corresponde al productor consigo mismo (su propia demanda final).",
      infoDir: "Vínculos de una etapa: la producción seleccionada es utilizada directamente por otra actividad.",
      infoInd: "Vínculos que se producen a través de dos o más etapas de la cadena productiva."
    },
    en: {
      title: "National productive impact",
      intro: "Select a location and a sector to explore how its importance is distributed across territories and sectors within the national economy.",
      producerTitle: "Choose the producer",
      producerInstr: "Select the province and sector of the producer whose impact on the national economy you want to trace.",
      profileTitle: "Producer profile",
      profileInstr: "How much this producer weighs in national GDP and how its impact breaks down.",
      componentInstr: "Decide which part of the impact to show on the map: the total, its own production only, or the effects it generates along its chain.",
      qTotal: "What is the producer's full impact?",
      qOwn: "How much comes from its own production?",
      qDir: "Who does it affect in the first link?",
      qInd: "How does it spread across the rest of the economy?",
      detail: "Adjust the detail",
      detailInstr: "Choose the territorial and sectoral aggregation level at which the impact appears on the map.",
      aggGeoSub: "Territory", aggSecSub: "Sector",
      unitNote: "Values are shown as share (%) of the producer's national productive impact. They sum to 100%.",
      producer: "Reference producer", location: "Province", sector: "Sector",       locPh: "Type or choose a province…", secPh: "Type or choose a sector…",
      domar: "Domar weight", composition: "Impact composition",
      own: "Own", direct: "Direct", indirect: "Indirect", total: "Total",
      viz: "Visualization", aggGeo: "Aggregation level · Territory", aggSec: "Aggregation level · Sector",
      macrozone: "Macrozone", region: "Region", province: "Province",
      industry: "Industry", pibr13: "Sector", activity: "Activity",
      component: "Component", unit: "Unit of measure", unitVal: "Share of national productive impact",
      compTotalSub: "Producer's total productive impact",
      compOwnSub: "Producer's own direct production only",
      compDirectSub: "Direct chain (first link)",
      compIndirectSub: "Successive chains of the economy",
      method: "More detail", unitPercent: "Percentage\u00A0(%)",
      legendNearZero: "≈0 (below visible threshold)", legendZero: "No data or value 0",
      tabGeo: "Territorial distribution of impact", tabSec: "Sectoral distribution of impact", tabCell: "Territorial-sectoral distribution of impact",
      tabKicker: "Impact", axisGeo: "Territorial", axisSec: "Sectorial", axisCell: "Territorial–Sectoral",
      railGeo: "Top territories", railSec: "Top sectors", railCell: "Top combinations",
      hcRel: "Relative impact", hcTerr: "This territory", hcSec: "This sector", hcComb: "This territory-sector combination",
      hcConc: "concentrates", hcOf: "of the national productive impact associated with the selected producer.",
      hcKindTerr: "Territory", hcKindSec: "Sector", hcKindComb: "Territory · Sector",
      hcShareOf: "of the total productive impact of", hcPos: "Rank", hcOfN: "of",
      hcUnitTerr: "territories", hcUnitSec: "sectors", hcUnitComb: "combinations",
      tagOwn: "· own", tagDir: "· direct link", tagInd: "· indirect link",
      noResults: "No results",
      infoDomar: "The Domar weight measures the gross output of the selected location-sector relative to national GDP.",
      infoMetric: "Share of each territory, sector or combination in the national productive impact associated with the selected producer (shares sum to 100%).",
      infoOwn: "Own impact: the part of the Domar weight corresponding to the producer itself (its own final demand).",
      infoDir: "One-step links: the selected production is used directly by another activity.",
      infoInd: "Links that occur through two or more stages of the production chain."
    }
  };
  function isEs() { return state.lang === "es"; }
  function t() { return isEs() ? T.es : T.en; }

  function fmtPctNum(v) {
    if (!(v > 0)) return "0";
    const s = v >= 10 ? v.toFixed(1) : v >= 0.1 ? v.toFixed(1) : v.toFixed(2);
    return s.replace(".", isEs() ? "," : ".");
  }
  function fmtPct(v) {
    if (!(v > 0)) return "0%";
    return fmtPctNum(v) + "%";
  }

  Promise.resolve(window.spatialIoNetworkDataPromise || window.spatialIoNetworkData).then(nd => {
    if (!nd || typeof M4Engine === "undefined") return;
    const E = M4Engine.init(nd);

    // ── CedTreeSelect (web_materiales/js/tree-select.js), modo single: el
    // productor (provincia + actividad) es una unica hoja, a diferencia de
    // M2/M3 que permiten multi-seleccion. Arboles construidos una sola vez;
    // el de sectores se reconstruye al cambiar idioma (labels _eng).
    function buildM4GeoTree() {
      const sorted = [...E.domesticLocs].sort((a, b) =>
        (a.cod_region_sort || 0) - (b.cod_region_sort || 0) ||
        (a.cod_provincia_sort || 0) - (b.cod_provincia_sort || 0)
      );
      const mzMap = new Map();
      sorted.forEach((loc) => {
        const mz = loc.nom_macrozona, reg = loc.nom_region, prov = loc.nom_provincia;
        if (!mz || !reg || !prov) return;
        if (!mzMap.has(mz)) mzMap.set(mz, new Map());
        if (!mzMap.get(mz).has(reg)) mzMap.get(mz).set(reg, new Set());
        mzMap.get(mz).get(reg).add(prov);
      });
      return Array.from(mzMap.entries()).map(([mz, regMap]) => ({
        value: mz,
        label: mz,
        children: Array.from(regMap.entries()).map(([reg, provs]) => ({
          value: reg,
          label: reg,
          children: Array.from(provs).map((prov) => ({ value: prov, label: prov, children: [] })),
        })),
      }));
    }

    function buildM4SectorTree() {
      const indMap = new Map();
      sectors.forEach((sec) => {
        const indCode = String(sec.cod_industria);
        const pibrCode = String(sec.cod_PIBR13);
        const actCode = String(sec.cod_SECTOR46);
        if (!indCode || indCode === "undefined") return;
        if (!indMap.has(indCode)) indMap.set(indCode, new Map());
        if (!indMap.get(indCode).has(pibrCode)) indMap.get(indCode).set(pibrCode, new Set());
        indMap.get(indCode).get(pibrCode).add(actCode);
      });
      return Array.from(indMap.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([indCode, pibrMap]) => ({
          value: indCode,
          label: sectorLabel("industry", indCode),
          children: Array.from(pibrMap.entries())
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([pibrCode, actCodes]) => ({
              value: pibrCode,
              label: sectorLabel("pibr13", pibrCode),
              children: Array.from(actCodes)
                .sort((a, b) => Number(a) - Number(b))
                .map((actCode) => ({ value: actCode, label: sectorLabel("activity", actCode), children: [] })),
            })),
        }));
    }

    let m4TreeSelectGeo = null;
    let m4TreeSelectSector = null;

    // ── Estado ────────────────────────────────────────────────────────────
    // Productor por defecto: Santiago · Otras Prof. y Cientificos (cod_SECTOR46 = 40).
    // Si no existe en la grilla, cae al de mayor Domar weight.
    const DEFAULT_J = (() => { const j = E.findJ("Santiago", "40"); return j >= 0 ? j : E.jMax; })();
    const st = {
      j: DEFAULT_J,
      geoLevel: "province", secLevel: "activity",
      component: "total", tab: "geo",
      dec: null, heatDrawn: false
    };
    st.dec = E.decompose(st.j);

    function gridFor() {
      const d = st.dec;
      return st.component === "direct" ? d.direct
        : st.component === "own" ? d.own
        : st.component === "indirect" ? d.indirect : d.total;
    }
    function componentTag() {
      const k = t();
      return st.component === "own" ? k.tagOwn : st.component === "direct" ? k.tagDir : st.component === "indirect" ? k.tagInd : "";
    }

    // ── Warm scale + color helpers (idéntico a M2/M3) ────────────────────
    const EMPTY = "#f3ecfb";
    function colorFn(values) {
      const sc = buildWarmContinuousScale(Array.from(values).filter(v => v > 0));
      return v => (v > 0 && sc) ? sc.colorForValue(v) : EMPTY;
    }
    function indColor(industryName) { return M4_IND_COLORS[industryName] || "#9b95a8"; }

    // ── Hover card ────────────────────────────────────────────────────────
    const hc = document.getElementById("module4-hover-card");
    function showHC(html, x, y) {
      if (!hc) return;
      hc.innerHTML = html;
      hc.classList.remove("is-compact");
      hc.classList.add("is-visible");
      const w = 300, h = 110;
      hc.style.left = `${Math.min(x + 16, window.innerWidth - w - 8)}px`;
      hc.style.top = `${Math.max(8, Math.min(y - h / 2, window.innerHeight - h - 8))}px`;
    }
    function hideHC() { if (hc) hc.classList.remove("is-visible"); }
    function producerLabel() {
      const g = E.nodeGrid[st.j];
      if (!g) return "";
      return `${g.loc.nom_provincia} · ${E.secLabel("activity", E.activityList[g.col])}`;
    }
    function hcExposure(name, v, kind, rank, total) {
      const k = t();
      const kindLabel = (kind === "comb" ? k.hcKindComb : kind === "sec" ? k.hcKindSec : k.hcKindTerr) + componentTag();
      const unit = kind === "comb" ? k.hcUnitComb : kind === "sec" ? k.hcUnitSec : k.hcUnitTerr;
      const rankHtml = (v > 0 && rank && total)
        ? `<span class="m4d-hc-c-rank">${k.hcPos} <b>#${rank}</b> ${k.hcOfN} ${total} ${unit}</span>`
        : "";
      return `<div class="m4d-hc-c-head">
          <div class="m4d-hc-c-kind">${kindLabel}</div>
          <div class="m4d-hc-c-name">${escapeHtml(name)}</div>
        </div>
        <div class="m4d-hc-c-body">
          <div class="m4d-hc-c-metric"><span class="m4d-hc-c-num">${fmtPct(v)}</span><span class="m4d-hc-c-lbl">${k.hcShareOf} <b>${escapeHtml(producerLabel())}</b></span></div>
          ${rankHtml}
        </div>`;
    }

    // ── DOM refs (construidos en buildShell) ─────────────────────────────
    let el = {};
    let actLabelToCode = new Map();

    // ── Mapa territorial (d3 coroplético real) ───────────────────────────
    const provToGroupKey = level =>
      level === "macrozone" ? (p => E.provToMacro.get(p))
      : level === "region" ? (p => E.provToRegion.get(p))
      : (p => p);
    const nameToCode = new Map(E.domesticLocs.map(l => [l.nom_provincia, String(l.cod_provincia).padStart(3, "0")]));

    function drawMap() {
      const svgEl = el.mapSvg;
      if (!svgEl || typeof d3 === "undefined") return;
      const feats = window.module2Data?.geojson?.features;
      if (!feats || !feats.length) return;
      const grid = gridFor();
      const groupTotals = E.geoTotals(st.geoLevel, grid);
      const keyFn = provToGroupKey(st.geoLevel);
      const _geoTotal = Array.from(groupTotals.values()).reduce((a, b) => a + b, 0);
      const _geoScaleVals = Array.from(groupTotals.values()).filter((v) => !(window.NearZero && window.NearZero.is(v, _geoTotal, window.NearZero.GEO_THR)));
      const cf = colorFn(_geoScaleVals.length ? _geoScaleVals : Array.from(groupTotals.values()));

      // valor por código de provincia (todas las provincias del grupo comparten el valor del grupo)
      const valByCode = new Map(), groupByCode = new Map();
      E.provinceList.forEach(p => {
        const code = nameToCode.get(p); if (code == null) return;
        const gkey = keyFn(p);
        valByCode.set(code, groupTotals.get(gkey) || 0);
        groupByCode.set(code, gkey);
      });

      const stage = svgEl.closest(".m4d-map-box") || svgEl.parentElement;
      const mH = Math.max(160, stage.clientHeight - 24);
      const fc = { type: "FeatureCollection", features: feats };
      const svg = d3.select(svgEl); svg.selectAll("*").remove();
      const proj = d3.geoMercator().fitExtent([[6, 6], [mH - 6, mH - 6]], fc);
      const path = d3.geoPath(proj);
      svg.selectAll("path").data(feats).enter().append("path")
        .attr("d", path)
        .attr("fill", d => { const v = valByCode.get(d.properties.CUT_PROV) || 0; if (v <= 0) return EMPTY; if (window.NearZero && window.NearZero.is(v, _geoTotal, window.NearZero.GEO_THR)) return window.NearZero.GRAY; return cf(v); })
        .attr("stroke", "rgba(34,30,124,0.32)").attr("stroke-width", 0.8)
        .attr("data-code", d => d.properties.CUT_PROV)
        .on("mousemove", function (ev, d) {
          const code = d.properties.CUT_PROV;
          const v = valByCode.get(code) || 0;
          const gkey = groupByCode.get(code) || "";
          const _gv = Array.from(groupTotals.values()).filter(x => x > 0);
          showHC(hcExposure(E.secLabel(st.geoLevel === "macrozone" ? "macrozone" : st.geoLevel, gkey) || gkey, v, "terr", _gv.filter(x => x > v).length + 1, _gv.length), ev.clientX, ev.clientY);
        })
        .on("mouseleave", hideHC);

      // Recortar el viewBox a los límites reales del mapa para que el SVG abrace a Chile
      const b = path.bounds(fc), pad = 4;
      svgEl.setAttribute("viewBox", `${b[0][0] - pad} ${b[0][1] - pad} ${b[1][0] - b[0][0] + 2 * pad} ${b[1][1] - b[0][1] + 2 * pad}`);
      svgEl.style.cssText = "display:block;height:100%;width:auto;max-width:100%";

      vlegend(el.mapLegend, _geoScaleVals.length ? _geoScaleVals : [...groupTotals.values()]);
      renderRailGeo(grid, cf);
    }

    // ── Barras sectoriales (color por industria, leyenda abajo) ──────────
    function drawBars() {
      const grid = gridFor();
      const items = E.secTotals(st.secLevel, grid).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
      const max = items.length ? Math.max(...items.map(i => i.v)) : 1;
      const usedInd = [];
      el.bars.innerHTML = items.map(it => {
        const c = indColor(it.industryName);
        if (it.industryName && !usedInd.includes(it.industryName)) usedInd.push(it.industryName);
        return `<div class="m4d-bar-row" data-name="${escapeHtml(it.label)}" data-v="${it.v}">
          <span class="m4d-bar-label" title="${escapeHtml(it.label)}">${escapeHtml(it.label)}</span>
          <div class="m4d-bar-track"><span style="width:${Math.max(0.6, it.v / max * 100).toFixed(1)}%;background:${c}"></span></div>
          <strong class="m4d-bar-val">${fmtPctNum(it.v)}</strong>
        </div>`;
      }).join("") || `<div class="m4d-empty">${t().noResults}</div>`;
      el.bars.querySelectorAll(".m4d-bar-row").forEach(b => {
        b.addEventListener("mousemove", e => { const bv = +b.dataset.v; showHC(hcExposure(b.dataset.name, bv, "sec", items.filter(i => i.v > bv).length + 1, items.length), e.clientX, e.clientY); });
        b.addEventListener("mouseleave", hideHC);
      });
      // leyenda de industrias usada, en orden oficial
      const order = E.industryOpts.map(o => o.label);
      const orderEs = E.industryOpts.map(o => { const r = sectors.find(s => String(s.cod_industria) === String(o.value)); return r ? r.nom_industria : o.label; });
      const seen = [];
      orderEs.forEach((esName, i) => { if (usedInd.includes(esName)) seen.push({ es: esName, label: E.industryOpts[i].label }); });
      el.indLegend.innerHTML = seen.map(s => `<span><i style="background:${indColor(s.es)}"></i>${escapeHtml(s.label)}</span>`).join("");
      renderRailSec(items);
    }

    // ── Heatmap territorial-sectorial (agregado) ─────────────────────────
    function drawHeat() {
      const svgEl = el.hmSvg; if (!svgEl) return;
      const grid = gridFor();
      const M = E.matrix(st.geoLevel, st.secLevel, grid);
      const cont = svgEl.closest(".m4d-hm-figure") || svgEl.parentElement;
      const contW = Math.max(220, (cont.clientWidth || 600) - 84);
      const contH = Math.max(220, (cont.clientHeight || 500) - 14);
      const _fit = window.fitHeatmapGeometry({
        contW, contH, nRows: M.nR, nCols: M.nC,
        rowLabels: M.rows, colLabels: M.colLabels,
        rotDeg: 66, rowFamily: "DM Sans, system-ui", colFamily: "DM Sans, system-ui",
        // Mismo ángulo (66°) y holgura que M3. Además fijamos el techo de fuente
        // del eje X (colFsCap) para que la letra NO crezca con el tamaño del panel
        // y quede al mismo tamaño que M3 (que renderiza ~8px).
        colPad: 8, colFsCap: 8,
      });
      const LP = _fit.LP, BP = _fit.BP, TP = _fit.TP, CH = _fit.CH, CW = _fit.CW;
      const SVG_W = _fit.svgWidth, SVG_H = _fit.svgHeight, GRID_H = _fit.gridH;
      const _matTotal = M.grid.reduce((a, b) => a + (b > 0 ? b : 0), 0);
      const _mScaleVals = M.grid.filter((v) => v > 0 && !(window.NearZero && window.NearZero.is(v, _matTotal, window.NearZero.MATRIX_THR)));
      const cf = colorFn(_mScaleVals.length ? _mScaleVals : M.grid);
      let s = "";
      for (let r = 0; r < M.nR; r++) for (let c = 0; c < M.nC; c++) {
        const v = M.grid[r * M.nC + c];
        const _f = v <= 0 ? EMPTY : (window.NearZero && window.NearZero.is(v, _matTotal, window.NearZero.MATRIX_THR) ? window.NearZero.GRAY : cf(v));
        s += `<rect x="${LP + c * CW}" y="${TP + r * CH}" width="${CW - 0.5}" height="${CH - 0.5}" fill="${_f}" rx="0.5" class="m4d-cell" data-r="${r}" data-c="${c}"/>`;
      }
      // Tamaño de letra adaptativo: que las etiquetas no se solapen entre sí.
      // Filas: separadas por CH (vertical). Columnas: rotadas -60°, separación perpendicular ≈ CW·sin(60°).
      const rowFs = _fit.rowFs;
      const colFs = _fit.colFs;
      M.rows.forEach((rn, r) => { s += `<text x="${LP - 5}" y="${TP + (r + 0.5) * CH}" dominant-baseline="middle" text-anchor="end" class="matrix-row-label" font-family="DM Sans,system-ui" style="font-size:${rowFs}px">${escapeHtml(rn)}</text>`; });
      M.colLabels.forEach((cn, c) => { const x = LP + (c + 0.5) * CW, y = TP + M.nR * CH + 3; s += `<text x="${x}" y="${y}" transform="rotate(-66 ${x} ${y})" text-anchor="end" class="matrix-col-label" font-family="DM Sans,system-ui" style="font-size:${colFs}px">${escapeHtml(cn)}</text>`; });
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");
      svgEl.setAttribute("viewBox", `0 0 ${SVG_W} ${SVG_H}`);
      // El SVG se dibuja 1:1 (viewBox == px) para que el ÁREA DE CELDAS conserve
      // siempre el mismo tamaño en pantalla; al cambiar de agrupación sólo crecen
      // o se encogen las celdas, no el recuadro.
      svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svgEl.style.cssText = `display:block;overflow:visible;align-self:flex-start;width:${Math.round(SVG_W)}px;height:${Math.round(SVG_H)}px`;
      svgEl.innerHTML = s;
      svgEl.querySelectorAll(".m4d-cell").forEach(rect => {
        rect.addEventListener("mousemove", e => {
          const r = +rect.dataset.r, c = +rect.dataset.c, v = M.grid[r * M.nC + c];
          const _hv = M.grid.filter(x => x > 0);
          showHC(hcExposure(`${M.rows[r]} · ${M.colLabels[c]}`, v, "comb", _hv.filter(x => x > v).length + 1, _hv.length), e.clientX, e.clientY);
        });
        rect.addEventListener("mouseleave", hideHC);
      });
      vlegend(el.hmLegend, _mScaleVals.length ? _mScaleVals : Array.from(M.grid));
      // La barra de leyenda mide exactamente el alto del ÁREA DE CELDAS (sin las
      // etiquetas del eje X) y se alinea con el borde superior de la grilla.
      if (el.hmLegend) { el.hmLegend.style.alignSelf = "flex-start"; el.hmLegend.style.marginTop = TP + "px"; el.hmLegend.style.height = Math.round(GRID_H) + "px"; }
      // ranking de combinaciones
      const entries = [];
      for (let r = 0; r < M.nR; r++) for (let c = 0; c < M.nC; c++) { const v = M.grid[r * M.nC + c]; if (v > 0) entries.push([`${M.rows[r]} · ${M.colLabels[c]}`, v]); }
      renderRankList(el.railCell, entries, colorFn(M.grid));
    }

    // ── Leyenda vertical (gradiente + muestras) ──────────────────────────
    function vlegend(legendEl, values) {
      if (!legendEl) return;
      const pos = values.filter(v => v > 0);
      if (!pos.length) { legendEl.innerHTML = ""; return; }
      const mn = Math.min(...pos), mx = Math.max(...pos);
      const sc = buildWarmContinuousScale(pos);
      const lmn = Math.log(Math.max(mn, 1e-9)), lmx = Math.log(Math.max(mx, 1e-9));
      const stops = 8, samples = 6;
      const grad = Array.from({ length: stops }, (_, i) => {
        const frac = (stops - 1 - i) / (stops - 1);
        const v = lmx === lmn ? mx : Math.exp(lmn + (lmx - lmn) * frac);
        return `${sc ? sc.colorForValue(v) : EMPTY} ${Math.round((1 - frac) * 100)}%`;
      });
      const lbls = Array.from({ length: samples }, (_, i) => {
        const frac = (samples - 1 - i) / (samples - 1);
        return lmx === lmn ? mx : Math.exp(lmn + (lmx - lmn) * frac);
      });
      legendEl.innerHTML =
        `<div class="matrix-legend-unit">${t().unitPercent}</div>` +
        `<div class="matrix-legend-bar-vertical" style="background:linear-gradient(to bottom,${grad.join(",")})"></div>` +
        `<div class="matrix-legend-scale-vertical">${lbls.map(v => `<span>${fmtPctNum(v)}</span>`).join("")}</div>`;
      window.attachLegendReadout?.(legendEl.querySelector(".matrix-legend-bar-vertical"), mn, mx, fmtPct);
      // NOTA: la altura de la leyenda del heatmap se fija DETERMINISTAMENTE en
      // drawHeat() (legendEl.style.height = _hmH). NO usar aquí el sync asíncrono
      // basado en medir el DOM: competía con la altura determinista y, durante la
      // transición de entrada del panel, dejaba la barra colapsada (~18px).
    }

    // ── Rails (rankings) ─────────────────────────────────────────────────
    function renderRankList(elr, entries, cf) {
      if (!elr) return;
      const top = entries.slice().sort((a, b) => b[1] - a[1]);
      elr.innerHTML = top.map(([n, v], i) =>
        `<div class="m4d-chip"><span class="m4d-chip-rank">${i + 1}</span><span class="m4d-chip-sw" style="background:${cf(v)}"></span>
         <span class="m4d-chip-name" title="${escapeHtml(n)}">${escapeHtml(n)}</span>
         <span class="m4d-chip-val">${fmtPctNum(v)}</span></div>`).join("") || `<div class="m4d-empty">${t().noResults}</div>`;
    }
    function renderRailGeo(grid, cf) {
      renderRankList(el.railGeo, [...E.geoTotals(st.geoLevel, grid).entries()], cf);
    }
    function renderRailSec(items) {
      const cf = colorFn(items.map(i => i.v));
      renderRankList(el.railSec, items.map(i => [i.label, i.v]), cf);
    }

    // ── Header: Domar weight + composición ───────────────────────────────
    function renderHeader() {
      const g = E.nodeGrid[st.j];
      const prov = g.loc.nom_provincia;
      const act = E.secLabel("activity", E.activityList[g.col]);
      el.domarVal.textContent = fmtPct(E.lambda[st.j] * 100);
      const sm = E.summary(st.dec);
      const k = t();
      const segs = [[k.own, sm.ownPct, "#b89cd6"], [k.direct, sm.directPct, "#7038a8"], [k.indirect, sm.indirectPct, "#3d1a63"]];
      el.bdBar.innerHTML = segs.map(([, v, c]) => `<span style="width:${v.toFixed(1)}%;background:${c}"></span>`).join("");
      el.bdKey.innerHTML = segs.map(([name, v, c]) => `<span><i style="background:${c}"></i>${name}<b>${v.toFixed(0)}%</b></span>`).join("");
    }

    // ── Redibujar la vista activa ────────────────────────────────────────
    function redraw() {
      if (st.tab === "geo") drawMap();
      else if (st.tab === "sec") drawBars();
      else if (st.tab === "cell") { drawHeat(); st.heatDrawn = true; }
    }
    function redrawAll() {
      renderHeader();
      // dibujar la activa; las demás se redibujan al cambiar de tab
      st.heatDrawn = false;
      redraw();
    }

    // ── Cambio de productor ──────────────────────────────────────────────
    function selectProducer() {
      const prov = el.selProv.value;
      const actCode = actLabelToCode.get(el.selSec.value);
      const j = actCode != null ? E.findJ(prov, actCode) : -1;
      if (j < 0) {
        // valor inválido: revertir al productor actual
        const cur = E.nodeGrid[st.j];
        if (cur) { el.selProv.value = cur.loc.nom_provincia; el.selSec.value = E.secLabel("activity", E.activityList[cur.col]); }
        return;
      }
      st.j = j; st.dec = E.decompose(j);
      redrawAll();
    }

    // ── Construir el shell (panel control izq + viz der) ─────────────────
    function buildShell() {
      const shell = section.querySelector(".m4-shell");
      const k = t();
      actLabelToCode = new Map(E.activityOpts.map(o => [o.label, String(o.value)]));
      const seg = (group, items, active) => `<div class="m4d-agg" data-${group}>` +
        items.map(([val, lbl]) => `<button class="${val === active ? "active" : ""}" data-val="${val}">${lbl}</button>`).join("") + `</div>`;

      shell.innerHTML = `
      <div class="m4d-main">
        <aside class="m4d-controls">
          <div class="m4d-panel-header">
            <div class="m4d-panel-badge">${isEs() ? "Impacto productivo" : "Productive impact"}</div>
            <button class="module-controls-toggle panel-controls-toggle" type="button" aria-expanded="true" aria-controls="module-4-controls">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10"></path><path d="M18 7h2"></path><circle cx="16" cy="7" r="2"></circle><path d="M4 17h2"></path><path d="M10 17h10"></path><circle cx="8" cy="17" r="2"></circle></svg>
              <span>${isEs() ? "Ocultar controles" : "Hide controls"}</span>
            </button>
          </div>
          <div class="m4d-scroll">
          <div class="m4d-cgroup">
            <div class="m4d-clabel">1 · ${k.producerTitle}</div>
            <p class="m4d-instruction">${k.producerInstr}</p>
            <label class="m4d-field"><span>${k.location}</span>
              <div class="ts-mount" id="m4d-geo-select"></div>
              <input type="hidden" id="m4d-sel-prov"></label>
            <label class="m4d-field"><span>${k.sector}</span>
              <div class="ts-mount" id="m4d-sector-select"></div>
              <input type="hidden" id="m4d-sel-sec"></label>
          </div>
          <div class="m4d-kpi">
            <div class="m4d-kpi-title">${k.profileTitle}</div>
            <p class="m4d-instruction">${k.profileInstr}</p>
            <div class="m4d-kpi-top">
              <span class="m4d-kpi-lbl">${k.domar}</span>
              <span class="m4d-info" data-info="domar">i</span>
              <span class="m4d-kpi-val" id="m4d-domar">0%</span>
            </div>
            <div class="m4d-bd-top">${k.composition}</div>
            <div class="m4d-bd-bar" id="m4d-bd-bar"></div>
            <div class="m4d-bd-key" id="m4d-bd-key"></div>
          </div>
          <div class="m4d-cgroup">
            <div class="m4d-clabel">2 · ${k.component}</div>
            <p class="m4d-instruction">${k.componentInstr}</p>
            <div class="m3-q-cards" data-comp>
              <button class="m3-q-card active" data-val="total"><div class="m3-q-title">${k.total}</div><div class="m3-q-ask">${k.qTotal}</div></button>
              <button class="m3-q-card" data-val="own" data-info="own"><div class="m3-q-title">${k.own}</div><div class="m3-q-ask">${k.qOwn}</div></button>
              <button class="m3-q-card" data-val="direct" data-info="dir"><div class="m3-q-title">${k.direct}</div><div class="m3-q-ask">${k.qDir}</div></button>
              <button class="m3-q-card" data-val="indirect" data-info="ind"><div class="m3-q-title">${k.indirect}</div><div class="m3-q-ask">${k.qInd}</div></button>
            </div>
          </div>
          <div class="m4d-cgroup">
            <div class="m4d-clabel">3 · ${k.detail}</div>
            <p class="m4d-instruction">${k.detailInstr}</p>
            <div class="m4d-sublbl">${k.aggGeoSub}</div>
            ${seg("m4-geo-agg", [["macrozone", k.macrozone], ["region", k.region], ["province", k.province]], st.geoLevel)}
            <div class="m4d-sublbl" style="margin-top:9px;">${k.aggSecSub}</div>
            ${seg("m4-sec-agg", [["industry", k.industry], ["pibr13", k.pibr13], ["activity", k.activity]], st.secLevel)}
          </div>
          <div class="m4d-cgroup m4d-unit-note">
            <span class="ntag">${k.unit}</span> <span>${k.unitNote} <span class="m4d-info" data-info="metric">i</span></span>
          </div>
          <button class="m4d-method-btn" id="m4d-method-open">${k.method}</button>
          </div>
        </aside>

        <div class="m4d-vizcol">
          <div class="m4d-tabs" role="tablist">
            <button class="m4d-tab active" data-tab="geo"><span class="tab-kicker">${k.tabKicker}</span><span class="tab-axis">${k.axisGeo}</span></button>
            <button class="m4d-tab" data-tab="sec"><span class="tab-kicker">${k.tabKicker}</span><span class="tab-axis">${k.axisSec}</span></button>
            <button class="m4d-tab" data-tab="cell"><span class="tab-kicker">${k.tabKicker}</span><span class="tab-axis">${k.axisCell}</span></button>
          </div>
          <div class="m4d-panel active" data-panel="geo">
            <div class="m4d-hero">
              <div class="m4d-map-box">
                <div class="figure-actions" data-export-scope="module4" data-export-view="geo"><button class="figure-download-btn" type="button" aria-label="Descargar figura" data-export-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8.5 10.5 3.5 3.5 3.5-3.5"></path><path d="M5 18.5h14"></path></svg></button><div class="figure-download-menu" aria-hidden="true"><button class="figure-download-option" type="button" data-export-format="png">PNG</button><button class="figure-download-option" type="button" data-export-format="pdf">PDF</button></div></div>
                <svg id="m4d-map" aria-label="${k.tabGeo}"></svg>
                <div class="matrix-legend-vertical" id="m4d-map-legend"></div>
                <div class="near-zero-legend near-zero-legend-overlay">
                  <span><i style="background:#dcdcdc"></i>${k.legendNearZero}</span>
                  <span><i style="background:${EMPTY};border:1px solid rgba(34,30,124,0.18)"></i>${k.legendZero}</span>
                </div>
              </div>
              <div class="m4d-rail"><div class="m4d-rail-card"><div class="m4d-rail-head"><div class="rank-rail-head-text"><h4>${k.railGeo}</h4><div class="rank-list-unit">${k.unitPercent}</div></div><button class="rank-rail-close" type="button" aria-label="Ocultar ranking">×</button></div><div class="m4d-rank" id="m4d-rail-geo"></div></div></div>
            </div>
          </div>
          <div class="m4d-panel" data-panel="sec">
            <div class="m4d-hero">
              <div class="m4d-bars-col">
                <div class="figure-actions" data-export-scope="module4" data-export-view="sector"><button class="figure-download-btn" type="button" aria-label="Descargar figura" data-export-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8.5 10.5 3.5 3.5 3.5-3.5"></path><path d="M5 18.5h14"></path></svg></button><div class="figure-download-menu" aria-hidden="true"><button class="figure-download-option" type="button" data-export-format="png">PNG</button><button class="figure-download-option" type="button" data-export-format="pdf">PDF</button></div></div>
                <div class="bar-chart-unit">${k.unitPercent}</div>
                <div class="m4d-bars-scroll"><div class="m4d-bars" id="m4d-bars"></div></div>
                <div class="m4d-ind-legend" id="m4d-ind-legend"></div>
              </div>
              <div class="m4d-rail"><div class="m4d-rail-card"><div class="m4d-rail-head"><div class="rank-rail-head-text"><h4>${k.railSec}</h4><div class="rank-list-unit">${k.unitPercent}</div></div><button class="rank-rail-close" type="button" aria-label="Ocultar ranking">×</button></div><div class="m4d-rank" id="m4d-rail-sec"></div></div></div>
            </div>
          </div>
          <div class="m4d-panel" data-panel="cell">
            <div class="m4d-hero">
              <div class="m4d-hm-figure" id="m4d-hm-figure">
                <div class="figure-actions" data-export-scope="module4" data-export-view="matrix"><button class="figure-download-btn" type="button" aria-label="Descargar figura" data-export-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8.5 10.5 3.5 3.5 3.5-3.5"></path><path d="M5 18.5h14"></path></svg></button><div class="figure-download-menu" aria-hidden="true"><button class="figure-download-option" type="button" data-export-format="png">PNG</button><button class="figure-download-option" type="button" data-export-format="pdf">PDF</button></div></div>
                <svg id="m4d-hm" aria-label="${k.tabCell}"></svg>
                <div class="matrix-legend-vertical" id="m4d-hm-legend"></div>
                <div class="near-zero-legend near-zero-legend-overlay">
                  <span><i style="background:#dcdcdc"></i>${k.legendNearZero}</span>
                  <span><i style="background:${EMPTY};border:1px solid rgba(34,30,124,0.18)"></i>${k.legendZero}</span>
                </div>
              </div>
              <div class="m4d-rail"><div class="m4d-rail-card"><div class="m4d-rail-head"><div class="rank-rail-head-text"><h4>${k.railCell}</h4><div class="rank-list-unit">${k.unitPercent}</div></div><button class="rank-rail-close" type="button" aria-label="Ocultar ranking">×</button></div><div class="m4d-rank" id="m4d-rail-cell"></div></div></div>
            </div>
          </div>
        </div>
      </div>
      <div class="m4d-method" id="m4d-method" aria-hidden="true"><div class="m4d-method-panel">${methodHTML()}</div></div>`;

      // refs
      el = {
        selProv: shell.querySelector("#m4d-sel-prov"),
        selSec: shell.querySelector("#m4d-sel-sec"),
        domarVal: shell.querySelector("#m4d-domar"),
        bdBar: shell.querySelector("#m4d-bd-bar"),
        bdKey: shell.querySelector("#m4d-bd-key"),
        mapSvg: shell.querySelector("#m4d-map"),
        mapLegend: shell.querySelector("#m4d-map-legend"),
        railGeo: shell.querySelector("#m4d-rail-geo"),
        bars: shell.querySelector("#m4d-bars"),
        indLegend: shell.querySelector("#m4d-ind-legend"),
        railSec: shell.querySelector("#m4d-rail-sec"),
        hmSvg: shell.querySelector("#m4d-hm"),
        hmLegend: shell.querySelector("#m4d-hm-legend"),
        hmFigure: shell.querySelector("#m4d-hm-figure"),
        railCell: shell.querySelector("#m4d-rail-cell"),
        method: shell.querySelector("#m4d-method")
      };

      // default selects = productor de mayor Domar weight
      const g = E.nodeGrid[st.j];
      el.selProv.value = g.loc.nom_provincia;
      el.selSec.value = E.secLabel("activity", E.activityList[g.col]);

      // CedTreeSelect (modo single): reconstruir en cada buildShell() (se
      // llama de nuevo al cambiar idioma) montando sobre los divs recien
      // creados por el innerHTML de arriba.
      m4TreeSelectGeo?.destroy?.();
      m4TreeSelectSector?.destroy?.();
      const geoMount4 = shell.querySelector("#m4d-geo-select");
      const sectorMount4 = shell.querySelector("#m4d-sector-select");
      m4TreeSelectGeo = (geoMount4 && window.CedTreeSelect)
        ? window.CedTreeSelect.create({
            mount: geoMount4,
            mode: "single",
            levels: ["macrozone", "region", "province"],
            tree: buildM4GeoTree(),
            onSelect: (value) => {
              el.selProv.value = value;
              el.selProv.dispatchEvent(new Event("change", { bubbles: true }));
            },
            i18n: () => ({ search: k.locPh, noResults: isEs() ? "Sin resultados" : "No results" }),
          })
        : null;
      m4TreeSelectGeo?.setValue(g.loc.nom_provincia);
      m4TreeSelectSector = (sectorMount4 && window.CedTreeSelect)
        ? window.CedTreeSelect.create({
            mount: sectorMount4,
            mode: "single",
            levels: ["industry", "pibr13", "activity"],
            tree: buildM4SectorTree(),
            onSelect: (value, label) => {
              el.selSec.value = label;
              el.selSec.dispatchEvent(new Event("change", { bubbles: true }));
            },
            i18n: () => ({ search: k.secPh, noResults: isEs() ? "Sin resultados" : "No results" }),
          })
        : null;
      m4TreeSelectSector?.setValue(E.secLabel("activity", E.activityList[g.col]));

      wire(shell);
      // Conectar close buttons del rail al RankRailKit compartido (cierra en TODOS los módulos)
      shell.querySelectorAll(".m4d-rail .rank-rail-close").forEach(btn =>
        btn.addEventListener("click", () => { if (window.RankRailKit) window.RankRailKit.setVisible(false); })
      );
      // Botón reopen
      shell.querySelectorAll(".m4d-vizcol").forEach(col => {
        if (!col.querySelector(":scope > .rank-reopen")) {
          const b = document.createElement("button"); b.className="rank-reopen"; b.type="button";
          b.innerHTML = '<span class="panel-edge-chevron" aria-hidden="true">&lsaquo;</span><span class="panel-edge-label">Ranking</span>';
          b.addEventListener("click",()=>{ if (window.RankRailKit) window.RankRailKit.setVisible(true); });
          col.appendChild(b);
        }
      });
      // Estado inicial del ranking: respetar ccdRankVisible (default cerrado
      // igual que M2/M3). apply() global corre antes de que M4 exista, por eso
      // lo aplicamos aquí al renderizar.
      try {
        const rankVisible = localStorage.getItem("ccdRankVisible") === "1";
        section.classList.toggle("rank-hidden", !rankVisible);
        shell.querySelectorAll(".m4d-vizcol").forEach(c => c.classList.toggle("rank-collapsed", !rankVisible));
      } catch (e) {}
      renderMethodMath(el.method);
    }

    // ── Más detalle metodológico (Propuesta A · apéndice técnico) ─────────
    const M4_COMP_COLORS = { propio: "#9a73c4", directo: "#6d3fa0", indirecto: "#c9b3e0" };
    const METODO = [
      { n: "1",
        es: { title: "Productores e identidad de producción", rows: [
          { text: "Cada <b>productor</b> (i) corresponde a una combinación de ubicación y sector. Sea xᵢ su producción bruta, yᵢ la parte destinada a usos finales y xⱼᵢ la producción de i utilizada como insumo por el productor j." },
          { text: "La producción de cada celda se distribuye entre usos finales y ventas intermedias:", math: "x_i = y_i + \\sum_j x_{ji}" } ] },
        en: { title: "Producers and the production identity", rows: [
          { text: "Each <b>producer</b> (i) is a combination of location and sector. Let xᵢ be its gross output, yᵢ the part going to final uses and xⱼᵢ the output of i used as an input by producer j." },
          { text: "Each cell's output is split between final uses and intermediate sales:", math: "x_i = y_i + \\sum_j x_{ji}" } ] } },
      { n: "2",
        es: { title: "Matriz insumo-producto", rows: [
          { text: "Siguiendo la notación de Baqaee y Rubbo, la matriz insumo-producto se define como:", math: "\\Omega_{ij} = \\dfrac{p_j\\,x_{ij}}{p_i\\,x_i}" },
          { text: "El índice i identifica al <b>comprador</b> y j al <b>proveedor</b>. Por tanto, Ωᵢⱼ representa el gasto del productor i en insumos provenientes de j, como proporción de las ventas de i." },
          { note: "La matriz Ω registra solamente relaciones <b>directas</b> entre productores." } ] },
        en: { title: "Input-output matrix", rows: [
          { text: "Following Baqaee and Rubbo's notation, the input-output matrix is defined as:", math: "\\Omega_{ij} = \\dfrac{p_j\\,x_{ij}}{p_i\\,x_i}" },
          { text: "Index i identifies the <b>buyer</b> and j the <b>supplier</b>. Thus Ωᵢⱼ is producer i's spending on inputs from j, as a share of i's sales." },
          { note: "The matrix Ω records only <b>direct</b> relationships between producers." } ] } },
      { n: "3",
        es: { title: "Inversa de Leontief", rows: [
          { text: "La inversa de Leontief se define como:", math: "\\Psi = (I-\\Omega)^{-1} = I + \\Omega + \\Omega^2 + \\Omega^3 + \\cdots" },
          { text: "El elemento Ψᵢₖ reúne todas las rutas mediante las cuales la demanda asociada al productor i requiere la producción del proveedor k." },
          { text: "La expansión permite distinguir tres componentes:", math: "\\Psi = \\underbrace{I}_{\\text{propio}} + \\underbrace{\\Omega}_{\\text{directo}} + \\underbrace{\\left(\\Omega^2+\\Omega^3+\\cdots\\right)}_{\\text{indirecto}}" } ] },
        en: { title: "Leontief inverse", rows: [
          { text: "The Leontief inverse is defined as:", math: "\\Psi = (I-\\Omega)^{-1} = I + \\Omega + \\Omega^2 + \\Omega^3 + \\cdots" },
          { text: "The element Ψᵢₖ gathers every path through which the demand associated with producer i requires the output of supplier k." },
          { text: "The expansion distinguishes three components:", math: "\\Psi = \\underbrace{I}_{\\text{own}} + \\underbrace{\\Omega}_{\\text{direct}} + \\underbrace{\\left(\\Omega^2+\\Omega^3+\\cdots\\right)}_{\\text{indirect}}" } ] } },
      { n: "4",
        es: { title: "Componentes: propio, directo e indirecto", rows: [
          { chip: "propio", text: "<b>Propio</b> (I): la producción inicial de la misma celda cuya demanda final se está satisfaciendo." },
          { chip: "directo", text: "<b>Directo</b> (Ω): relaciones de una etapa — el productor i compra directamente al productor k." },
          { chip: "indirecto", text: "<b>Indirecto</b> (Ω²+Ω³+⋯): cadenas de dos o más etapas, en las que la producción de k llega a i a través de otros productores." },
          { note: "Cada potencia de Ω añade una etapa adicional a la cadena. La inversa de Leontief reúne todas esas etapas en una sola medida." } ] },
        en: { title: "Components: own, direct and indirect", rows: [
          { chip: "propio", text: "<b>Own</b> (I): the initial output of the same cell whose final demand is being satisfied." },
          { chip: "directo", text: "<b>Direct</b> (Ω): one-step relationships — producer i buys directly from producer k." },
          { chip: "indirecto", text: "<b>Indirect</b> (Ω²+Ω³+⋯): chains of two or more stages, where k's output reaches i through other producers." },
          { note: "Each power of Ω adds one more stage to the chain. The Leontief inverse collects all those stages into a single measure." } ] } },
      { n: "5",
        es: { title: "Domar weight", rows: [
          { text: "El Domar weight del productor k es su producción bruta relativa al PIB nominal E:", math: "\\lambda_k = \\dfrac{p_k\\,x_k}{E}" },
          { text: "La identidad de producción permite relacionar el Domar weight con la inversa de Leontief:", math: "\\lambda_k = \\sum_i \\dfrac{p_i\\,y_i}{E}\\,\\Psi_{ik}" },
          { text: "Esto muestra que el Domar weight de k puede descomponerse entre todas las cadenas de usos finales que requieren, directa o indirectamente, su producción. Definimos la contribución de la cadena asociada a i como:", math: "D_{ik} = \\dfrac{p_i\\,y_i}{E}\\,\\Psi_{ik}" },
          { text: "Por construcción:", math: "\\sum_i D_{ik} = \\lambda_k" },
          { text: "La contribución de cada cadena también se separa en sus componentes propio, directo e indirecto:", math: "D_{ik} = \\dfrac{p_i y_i}{E}I_{ik} + \\dfrac{p_i y_i}{E}\\Omega_{ik} + \\dfrac{p_i y_i}{E}\\left(\\Omega^2+\\Omega^3+\\cdots\\right)_{ik}" } ] },
        en: { title: "Domar weight", rows: [
          { text: "Producer k's Domar weight is its gross output relative to nominal GDP E:", math: "\\lambda_k = \\dfrac{p_k\\,x_k}{E}" },
          { text: "The production identity relates the Domar weight to the Leontief inverse:", math: "\\lambda_k = \\sum_i \\dfrac{p_i\\,y_i}{E}\\,\\Psi_{ik}" },
          { text: "This shows that k's Domar weight can be decomposed across all final-use chains that require, directly or indirectly, its output. We define the contribution of the chain associated with i as:", math: "D_{ik} = \\dfrac{p_i\\,y_i}{E}\\,\\Psi_{ik}" },
          { text: "By construction:", math: "\\sum_i D_{ik} = \\lambda_k" },
          { text: "Each chain's contribution also splits into its own, direct and indirect components:", math: "D_{ik} = \\dfrac{p_i y_i}{E}I_{ik} + \\dfrac{p_i y_i}{E}\\Omega_{ik} + \\dfrac{p_i y_i}{E}\\left(\\Omega^2+\\Omega^3+\\cdots\\right)_{ik}" } ] } },
      { n: "6",
        es: { title: "Relación con el teorema de Hulten", rows: [
          { text: "La relación entre la inversa de Leontief y el Domar weight es, inicialmente, una identidad contable. El teorema de Hulten le entrega una interpretación económica." },
          { text: "Alrededor de una asignación eficiente y para un shock pequeño de productividad en el productor k:", math: "\\dfrac{\\partial \\log Y}{\\partial \\log A_k} = \\lambda_k" },
          { text: "Por tanto:", math: "\\dfrac{\\partial \\log Y}{\\partial \\log A_k} = \\sum_i \\dfrac{p_i\\,y_i}{E}\\,\\Psi_{ik}" },
          { note: "Bajo las condiciones de Hulten, el Domar weight es el impacto agregado de primer orden de un shock de productividad en el productor seleccionado. La inversa de Leontief abre ese impacto y muestra qué cadenas territoriales y sectoriales explican su magnitud." } ] },
        en: { title: "Relation to Hulten's theorem", rows: [
          { text: "The link between the Leontief inverse and the Domar weight is, at first, an accounting identity. Hulten's theorem gives it an economic interpretation." },
          { text: "Around an efficient allocation and for a small productivity shock to producer k:", math: "\\dfrac{\\partial \\log Y}{\\partial \\log A_k} = \\lambda_k" },
          { text: "Therefore:", math: "\\dfrac{\\partial \\log Y}{\\partial \\log A_k} = \\sum_i \\dfrac{p_i\\,y_i}{E}\\,\\Psi_{ik}" },
          { note: "Under Hulten's conditions, the Domar weight is the first-order aggregate impact of a productivity shock to the selected producer. The Leontief inverse opens up that impact and shows which territorial and sectoral chains explain its magnitude." } ] } },
      { n: "7",
        es: { title: "Participaciones mostradas en el módulo", rows: [
          { text: "Para expresar las contribuciones como porcentajes del Domar weight seleccionado, se define:", math: "S_{ik} = \\dfrac{D_{ik}}{\\lambda_k}" },
          { text: "Para cada productor k:", math: "\\sum_i S_{ik} = 1" },
          { text: "Estas participaciones alimentan las visualizaciones:" },
          { list: ["el <b>mapa</b> las agrega por territorio;", "las <b>barras</b> las agregan por sector;", "el <b>heatmap</b> mantiene cada combinación territorio-sector."] },
          { note: "Así, el módulo muestra cómo se distribuye territorial y sectorialmente el impacto productivo nacional de primer orden asociado al productor seleccionado." } ] },
        en: { title: "Shares displayed in the module", rows: [
          { text: "To express contributions as percentages of the selected Domar weight, we define:", math: "S_{ik} = \\dfrac{D_{ik}}{\\lambda_k}" },
          { text: "For each producer k:", math: "\\sum_i S_{ik} = 1" },
          { text: "These shares feed the visualizations:" },
          { list: ["the <b>map</b> aggregates them by territory;", "the <b>bars</b> aggregate them by sector;", "the <b>heatmap</b> keeps each territory-sector combination."] },
          { note: "This way, the module shows how the first-order national productive impact associated with the selected producer is distributed across territories and sectors." } ] } },
      { n: "8",
        es: { title: "Nota sobre la economía abierta", rows: [
          { text: "En la implementación se consideran únicamente productores nacionales. Las importaciones intermedias no se representan como producción de una celda doméstica. Por esta razón:", math: "\\sum_i \\dfrac{p_i\\,y_i}{E}" },
          { text: "no tiene por qué ser igual a uno. Esto no constituye una inconsistencia: los usos finales de producción nacional pueden superar el PIB debido a la utilización de insumos importados." },
          { note: "En la representación completa de una economía abierta, las importaciones se incorporan como usos finales netos negativos. En la representación doméstica del módulo se excluyen como nodos productivos y no se restan de la demanda final de los productores nacionales." } ] },
        en: { title: "Note on the open economy", rows: [
          { text: "The implementation considers only domestic producers. Intermediate imports are not represented as the output of a domestic cell. For this reason:", math: "\\sum_i \\dfrac{p_i\\,y_i}{E}" },
          { text: "need not equal one. This is not an inconsistency: final uses of domestic output can exceed GDP because of the use of imported inputs." },
          { note: "In a full open-economy representation, imports enter as negative net final uses. In the domestic representation used by the module they are excluded as nodes and are not subtracted from domestic producers' final demand." } ] } },
      { n: "9",
        es: { title: "Alcance de los resultados", rows: [
          { text: "El módulo presenta un <b>benchmark de primer orden</b> basado en la estructura productiva observada." },
          { note: "No calcula cuánto disminuiría efectivamente la producción de cada territorio o sector después de un shock. Esos resultados también dependerían de la sustitución entre proveedores, los cambios de precios, el comercio y otros ajustes de equilibrio general." } ] },
        en: { title: "Scope of the results", rows: [
          { text: "The module presents a <b>first-order benchmark</b> based on the observed productive structure." },
          { note: "It does not compute how much each territory's or sector's output would actually fall after a shock. Those results would also depend on supplier substitution, price changes, trade and other general-equilibrium adjustments." } ] } }
    ];

    function eqHTML(tex) { return `<div class="m4d-eq" data-tex="${escapeHtml(tex)}"></div>`; }
    function methodRow(r) {
      if (r.text && r.math) return `<p class="m4d-mp-p">${r.text}</p>${eqHTML(r.math)}`;
      if (r.math) return eqHTML(r.math);
      if (r.text) return `<p class="m4d-mp-p">${r.text}</p>`;
      if (r.note) return `<p class="m4d-mp-note">${r.note}</p>`;
      if (r.list) return `<ul class="m4d-mp-list">${r.list.map(li => `<li>${li}</li>`).join("")}</ul>`;
      if (r.chip) return `<div class="m4d-mp-chip" style="--c:${M4_COMP_COLORS[r.chip]}"><span class="m4d-mp-chipdot"></span><span>${r.text}</span></div>`;
      return "";
    }
    function methodHTML() {
      const es = isEs();
      const eyebrow = es ? "Módulo 4 · Metodología" : "Module 4 · Methodology";
      const title = es ? "Más detalle metodológico" : "More methodological detail";
      const lead = es
        ? "Cómo se construye, paso a paso, el impacto productivo nacional que distribuyen el mapa, las barras y el heatmap."
        : "How the national productive impact distributed by the map, bars and heatmap is built, step by step.";
      const secs = METODO.map(s => {
        const d = es ? s.es : s.en;
        return `<section class="m4d-mp-sec"><div class="m4d-mp-sechd"><span class="m4d-mp-num">§${s.n}</span><h3 class="m4d-mp-h3">${d.title}</h3></div>${d.rows.map(methodRow).join("")}</section>`;
      }).join("");
      return `
        <button class="m4d-method-close" data-close>×</button>
        <div class="m4d-mp-head"><h2>${title}</h2><p class="m4d-mp-lead">${lead}</p></div>
        <div class="m4d-mp-body">${secs}</div>`;
    }
    function renderMethodMath(scope) {
      if (typeof katex === "undefined" || !scope) return;
      scope.querySelectorAll(".m4d-eq[data-tex]").forEach(node => {
        if (node.dataset.rendered) return;
        try { katex.render(node.getAttribute("data-tex"), node, { displayMode: true, throwOnError: false }); node.dataset.rendered = "1"; }
        catch (e) { node.textContent = node.getAttribute("data-tex"); }
      });
    }

    function wire(shell) {
      el.selProv.addEventListener("change", selectProducer);
      el.selSec.addEventListener("change", selectProducer);

      shell.querySelector("[data-m4-geo-agg]").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        shell.querySelectorAll("[data-m4-geo-agg] button").forEach(x => x.classList.toggle("active", x === b));
        st.geoLevel = b.dataset.val;
        if (st.tab === "geo") drawMap(); else if (st.tab === "cell") drawHeat(); else st.heatDrawn = false;
      });
      shell.querySelector("[data-m4-sec-agg]").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        shell.querySelectorAll("[data-m4-sec-agg] button").forEach(x => x.classList.toggle("active", x === b));
        st.secLevel = b.dataset.val;
        if (st.tab === "sec") drawBars(); else if (st.tab === "cell") drawHeat(); else st.heatDrawn = false;
      });
      shell.querySelector("[data-comp]").addEventListener("click", e => {
        const b = e.target.closest("button"); if (!b) return;
        shell.querySelectorAll("[data-comp] button").forEach(x => x.classList.toggle("active", x === b));
        st.component = b.dataset.val;
        renderHeader(); redraw();
      });
      shell.querySelectorAll(".m4d-tab").forEach(tb => tb.addEventListener("click", () => {
        shell.querySelectorAll(".m4d-tab").forEach(x => x.classList.toggle("active", x === tb));
        st.tab = tb.dataset.tab;
        shell.querySelectorAll(".m4d-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === st.tab));
        if (st.tab === "cell") { requestAnimationFrame(drawHeat); setTimeout(drawHeat, 60); setTimeout(drawHeat, 240); st.heatDrawn = true; }
        else redraw();
      }));

      // info hovers
      shell.querySelectorAll("[data-info]").forEach(node => {
        const key = node.dataset.info;
        const txt = { domar: "infoDomar", metric: "infoMetric", own: "infoOwn", dir: "infoDir", ind: "infoInd" }[key];
        node.addEventListener("mouseenter", e => {
          const k = t();
          showHC(`<div class="m4d-hc-info">${k[txt]}</div>`, e.clientX, e.clientY);
        });
        node.addEventListener("mouseleave", hideHC);
      });

      // method drawer
      const md = el.method;
      shell.querySelector("#m4d-method-open").addEventListener("click", () => md.classList.add("is-open"));
      md.addEventListener("click", e => { if (e.target === md || e.target.hasAttribute("data-close")) md.classList.remove("is-open"); });

      // resize
      let rt;
      window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => redraw(), 160); }, { passive: true });
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => redraw(), 160); });
        ro.observe(shell.querySelector(".m4d-vizcol"));
      }
      // redibujar al activarse el módulo (hashchange a #module-4)
      window.addEventListener("hashchange", () => { if (location.hash === "#module-4") setTimeout(redraw, 80); });
    }

    // ── Init ──────────────────────────────────────────────────────────────
    buildShell();
    window.initFigureExports?.();
    requestAnimationFrame(redrawAll);
    setTimeout(redrawAll, 200);

    // Sincronizar idioma: reconstruir el shell (labels) y redibujar
    const _prevApply = window.applyLanguage;
    window.applyLanguage = function (nextLang) {
      if (typeof _prevApply === "function") _prevApply(nextLang);
      buildShell();
      window.initFigureExports?.();
      // restaurar selectores desde el productor actual (labels dependen del idioma)
      const g = E.nodeGrid[st.j];
      if (g && el.selProv) el.selProv.value = g.loc.nom_provincia;
      if (g && el.selSec) el.selSec.value = E.secLabel("activity", E.activityList[g.col]);
      // restaurar estado de segmentadores
      section.querySelectorAll("[data-m4-geo-agg] button").forEach(b => b.classList.toggle("active", b.dataset.val === st.geoLevel));
      section.querySelectorAll("[data-m4-sec-agg] button").forEach(b => b.classList.toggle("active", b.dataset.val === st.secLevel));
      section.querySelectorAll("[data-comp] button").forEach(b => b.classList.toggle("active", b.dataset.val === st.component));
      section.querySelectorAll(".m4d-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === st.tab));
      section.querySelectorAll(".m4d-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === st.tab));
      requestAnimationFrame(redrawAll);
    };
  });
})();
