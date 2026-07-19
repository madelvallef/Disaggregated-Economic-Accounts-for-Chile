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
      intro: "La elasticidad del PIB agregado frente a un aumento marginal de la productividad de un productor corresponde, en la literatura económica, a su Domar weight (Hulten, 1978). Las vistas muestran cómo se distribuye ese efecto a lo largo de la cadena de valor hasta la demanda final.",
      producerTitle: "Elige los productores",
      producerTheory: "La <b>elasticidad del PIB agregado</b> frente a un <b>aumento marginal de la productividad</b> de un productor corresponde, en la literatura económica, a su <b>Domar weight</b> (Hulten, 1978).",
      producerInstr: "Selecciona la <b>provincia</b> y el <b>sector</b> del productor para ver esa <b>elasticidad</b> y cómo se distribuye su efecto a lo largo de la <b>cadena de valor</b>, desde sus <b>clientes directos</b> hasta los productores alcanzados por <b>vínculos sucesivos</b> y la <b>demanda final</b>.",
      profileTitle: "Impacto en el PIB nacional",
      profileScenario: (producer) => `Ante un aumento de productividad de <b>1%</b> en ${producer}, el PIB nacional varía en:`,
      componentInstr: "Elige qué parte del impacto del productor quieres visualizar.",
      qTotal: "¿Cómo se distribuye el impacto completo?",
      qOwn: "¿Qué parte corresponde al componente propio?",
      qDir: "¿Qué parte se transmite en un eslabón?",
      qInd: "¿Qué parte se transmite por cadenas sucesivas?",
      detail: "Ajusta el detalle",
      detailInstr: "Escoge con qué nivel de agregación territorial y sectorial se muestra el impacto en el mapa.",
      aggGeoSub: "Territorio", aggSecSub: "Sector",
      producer: "Productor de referencia", location: "Provincia", sector: "Sector",       locPh: "Escriba o elija una provincia…", secPh: "Escriba o elija un sector…",
      composition: "Así se descompone ese impacto nacional",
      own: "Componente propio", direct: "Exposición directa", indirect: "Exposición indirecta", total: "Impacto total",
      viz: "Visualización", aggGeo: "Nivel de agregación · Territorio", aggSec: "Nivel de agregación · Sector",
      macrozone: "Macrozona", region: "Región", province: "Provincia",
      industry: "Industria", pibr13: "Sector", activity: "Actividad",
      component: "Descomposición del impacto",
      compTotalSub: "Impacto productivo total del productor",
      compOwnSub: "Solo la producción directa del productor",
      compDirectSub: "Cadena directa (primer eslabón)",
      compIndirectSub: "Cadenas sucesivas de la economía",
      method: "Detalle metodológico", unitPercent: "Porcentaje\u00A0(%)",
      legendNearZero: "≈0", legendZero: "=0",
      tabGeo: "Distribución territorial del impacto", tabSec: "Distribución sectorial del impacto", tabCell: "Distribución territorial-sectorial del impacto",
      tabKicker: "", axisGeo: "Territorios", axisSec: "Sectores", axisCell: "Territorios - Sectores",
      railGeo: "Territorios Top", railSec: "Sectores Top", railCell: "Combinaciones Top",
      hcRel: "Impacto relativo", hcTerr: "Este territorio", hcSec: "Este sector", hcComb: "Esta combinación territorio-sector",
      hcConc: "concentra", hcOf: "del impacto productivo nacional asociado al productor seleccionado.",
      hcKindTerr: "Territorio", hcKindSec: "Sector", hcKindComb: "Territorio · Sector",
      hcShareOf: "del impacto productivo total de", hcPos: "Posición", hcOfN: "de",
      hcUnitTerr: "territorios", hcUnitSec: "sectores", hcUnitComb: "combinaciones",
      tagOwn: "· propio", tagDir: "· vínculo directo", tagInd: "· vínculo indirecto",
      noResults: "Sin resultados",
      infoTotal: "El efecto completo de un aumento de productividad en el productor seleccionado. Es la suma de los tres componentes y representa 100% de la descomposición.",
      infoOwn: "La parte del efecto asociada directamente al productor seleccionado.",
      infoDir: "La parte que llega a sus clientes directos en el primer paso de la cadena de valor.",
      infoInd: "La parte que continúa hacia otros productores mediante vínculos sucesivos de la cadena de valor."
    },
    en: {
      title: "National productive impact",
      intro: "In the economics literature, the elasticity of aggregate GDP to a marginal productivity increase in a producer is its Domar weight (Hulten, 1978). The views show how that effect is distributed along the value chain to final demand.",
      producerTitle: "Choose the producers",
      producerTheory: "In the economics literature, the <b>elasticity of aggregate GDP</b> to a <b>marginal productivity increase</b> in a producer is its <b>Domar weight</b> (Hulten, 1978).",
      producerInstr: "Select the producer's <b>province</b> and <b>sector</b> to see that <b>elasticity</b> and how its effect is distributed along the <b>value chain</b>, from <b>direct customers</b> to producers reached through <b>successive links</b> and <b>final demand</b>.",
      profileTitle: "Impact on national GDP",
      profileScenario: (producer) => `Following a <b>1%</b> productivity increase in ${producer}, national GDP changes by:`,
      componentInstr: "Choose which part of the producer's impact you want to visualize.",
      qTotal: "How is the complete impact distributed?",
      qOwn: "What share corresponds to the own component?",
      qDir: "What share travels through one link?",
      qInd: "What share travels through successive links?",
      detail: "Adjust the detail",
      detailInstr: "Choose the territorial and sectoral aggregation level at which the impact appears on the map.",
      aggGeoSub: "Territory", aggSecSub: "Sector",
      producer: "Reference producer", location: "Province", sector: "Sector",       locPh: "Type or choose a province…", secPh: "Type or choose a sector…",
      composition: "This is how that national impact breaks down",
      own: "Own component", direct: "Direct exposure", indirect: "Indirect exposure", total: "Total impact",
      viz: "Visualization", aggGeo: "Aggregation level · Territory", aggSec: "Aggregation level · Sector",
      macrozone: "Macrozone", region: "Region", province: "Province",
      industry: "Industry", pibr13: "Sector", activity: "Activity",
      component: "Impact decomposition",
      compTotalSub: "Producer's total productive impact",
      compOwnSub: "Producer's own direct production only",
      compDirectSub: "Direct chain (first link)",
      compIndirectSub: "Successive chains of the economy",
      method: "Methodological detail", unitPercent: "Percentage\u00A0(%)",
      legendNearZero: "≈0", legendZero: "=0",
      tabGeo: "Territorial distribution of impact", tabSec: "Sectoral distribution of impact", tabCell: "Territorial-sectoral distribution of impact",
      tabKicker: "", axisGeo: "Territories", axisSec: "Sectors", axisCell: "Territories - Sectors",
      railGeo: "Top territories", railSec: "Top sectors", railCell: "Top combinations",
      hcRel: "Relative impact", hcTerr: "This territory", hcSec: "This sector", hcComb: "This territory-sector combination",
      hcConc: "concentrates", hcOf: "of the national productive impact associated with the selected producer.",
      hcKindTerr: "Territory", hcKindSec: "Sector", hcKindComb: "Territory · Sector",
      hcShareOf: "of the total productive impact of", hcPos: "Rank", hcOfN: "of",
      hcUnitTerr: "territories", hcUnitSec: "sectors", hcUnitComb: "combinations",
      tagOwn: "· own", tagDir: "· direct link", tagInd: "· indirect link",
      noResults: "No results",
      infoTotal: "The complete effect of a productivity increase in the selected producer. It is the sum of the three components and represents 100% of the decomposition.",
      infoOwn: "The part of the effect associated directly with the selected producer.",
      infoDir: "The part that reaches its direct customers in the first step of the value chain.",
      infoInd: "The part that continues to other producers through successive value-chain links."
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
  function fmtScenarioPct(v) {
    if (!(v > 0)) return "0%";
    return v.toFixed(3).replace(".", isEs() ? "," : ".") + "%";
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
    const EMPTY = "#ffffff";
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
      let _geoAnyGray = false;
      let _geoAnyZero = false;

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
        .attr("fill", d => {
          const v = valByCode.get(d.properties.CUT_PROV) || 0;
          if (v <= 0) { _geoAnyZero = true; return EMPTY; }
          if (window.NearZero && window.NearZero.is(v, _geoTotal, window.NearZero.GEO_THR)) {
            _geoAnyGray = true;
            return window.NearZero.GRAY;
          }
          return cf(v);
        })
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
      window.NearZero?.updateLegend("m4d-map-nz-legend", _geoAnyGray, _geoAnyZero);
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
      const isMobileHeatmap = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
      const _matTotal = M.grid.reduce((a, b) => a + (b > 0 ? b : 0), 0);
      const _mScaleVals = M.grid.filter((v) => v > 0 && !(window.NearZero && window.NearZero.is(v, _matTotal, window.NearZero.MATRIX_THR)));
      const legendValues = _mScaleVals.length ? _mScaleVals : Array.from(M.grid);
      const cf = colorFn(legendValues);

      // Igual que M2/M3, la unidad forma parte del ancho reservado de la
      // leyenda. Sin esta reserva el SVG podía invadir el título y recortarlo.
      vlegend(el.hmLegend, legendValues);
      const legendUnit = el.hmLegend?.querySelector(".matrix-legend-unit");
      const legendTitleW = legendUnit
        ? Math.ceil(Math.max(legendUnit.scrollWidth, legendUnit.getBoundingClientRect().width))
        : 0;
      const legendWidth = Math.max(70, legendTitleW, 16 + 8 + 42);
      if (el.hmLegend) el.hmLegend.style.minWidth = legendWidth + "px";

      const mobileContentScaleW = isMobileHeatmap ? 0.80 : 1;
      // Keep the same mobile geometry as M2/M3. The legend becomes a row below
      // the matrix on small screens, so it must not consume horizontal space.
      const panelWidth = isMobileHeatmap
        ? Math.max(376, cont.clientWidth || 0)
        : Math.max(320, cont.clientWidth || 900);
      const legendReserve = isMobileHeatmap ? 0 : 14 + legendWidth;
      const contW = Math.max(220, Math.floor((panelWidth - legendReserve) * mobileContentScaleW));
      // A bounded portrait canvas keeps all labels visible at once on a phone,
      // rather than turning the matrix into a narrow, scrollable column.
      const mobileMatrixHeight = Math.max(300, Math.min(420, Math.round(contW * 1.353)));
      const contH = isMobileHeatmap
        ? mobileMatrixHeight
        : Math.max(220, (cont.clientHeight || 500) - 14);
      if (isMobileHeatmap) cont.style.setProperty("--m4-mobile-matrix-height", Math.round(contH) + "px");
      else cont.style.removeProperty("--m4-mobile-matrix-height");
      const _fit = window.fitHeatmapGeometry({
        contW, contH, nRows: M.nR, nCols: M.nC,
        rowLabels: M.rows, colLabels: M.colLabels.map((label) => isMobileHeatmap && window.heatmapAxisLabelShort ? window.heatmapAxisLabelShort(label) : label),
        rotDeg: isMobileHeatmap ? 82 : 66,
        leftPadMin: isMobileHeatmap ? 64 : undefined,
        bottomPadMin: isMobileHeatmap ? 84 : undefined,
        // En móvil las etiquetas del eje X se leen en vertical; desktop conserva
        // el ángulo de 66°. Además fijamos el techo de fuente
        // del eje X (colFsCap) para que la letra NO crezca con el tamaño del panel
        // y quede al mismo tamaño que M3 (que renderiza ~8px).
        colPad: 8, colFsCap: 8,
      });
      const LP = _fit.LP, BP = _fit.BP, TP = _fit.TP, CH = _fit.CH, CW = _fit.CW;
      const SVG_W = _fit.svgWidth, SVG_H = _fit.svgHeight, GRID_H = _fit.gridH;
      let _matAnyGray = false;
      let _matAnyZero = false;
      let s = "";
      for (let r = 0; r < M.nR; r++) for (let c = 0; c < M.nC; c++) {
        const v = M.grid[r * M.nC + c];
        const isNearZero = v > 0 && window.NearZero && window.NearZero.is(v, _matTotal, window.NearZero.MATRIX_THR);
        if (v <= 0) _matAnyZero = true;
        if (isNearZero) _matAnyGray = true;
        const _f = v <= 0 ? EMPTY : (isNearZero ? window.NearZero.GRAY : cf(v));
        s += `<rect x="${LP + c * CW}" y="${TP + r * CH}" width="${CW}" height="${CH}" fill="${_f}" class="matrix-cell m4d-cell" data-r="${r}" data-c="${c}"/>`;
      }
      // Tamaño de letra adaptativo: que las etiquetas no se solapen entre sí.
      // Filas: separadas por CH (vertical). Columnas: rotadas -60°, separación perpendicular ≈ CW·sin(60°).
      const rowFs = _fit.rowFs;
      const colFs = _fit.colFs;
      M.rows.forEach((rn, r) => { s += `<text x="${LP - 5}" y="${TP + (r + 0.5) * CH}" dominant-baseline="middle" text-anchor="end" class="matrix-row-label" font-family="DM Sans,system-ui" style="font-size:${rowFs}px">${escapeHtml(rn)}</text>`; });
      const labelRotation = isMobileHeatmap ? -82 : -66;
      M.colLabels.forEach((cn, c) => { const x = LP + (c + 0.5) * CW, y = TP + M.nR * CH + 3; const fullLabel = cn; const dispLabel = isMobileHeatmap && window.heatmapAxisLabelShort ? window.heatmapAxisLabelShort(fullLabel) : fullLabel; s += `<text x="${x}" y="${y}" transform="rotate(${labelRotation} ${x} ${y})" text-anchor="end" class="matrix-col-label" font-family="DM Sans,system-ui" style="font-size:${colFs}px"><title>${escapeHtml(fullLabel)}</title>${escapeHtml(dispLabel)}</text>`; });
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
      window.NearZero?.updateLegend("m4d-hm-nz-legend", _matAnyGray, _matAnyZero);
      // La barra de leyenda mide exactamente el alto del ÁREA DE CELDAS (sin las
      // etiquetas del eje X) y se alinea con el borde superior de la grilla.
      if (el.hmLegend) {
        if (isMobileHeatmap) {
          el.hmLegend.style.alignSelf = "";
          el.hmLegend.style.marginTop = "";
          el.hmLegend.style.height = "";
        } else {
          el.hmLegend.style.alignSelf = "flex-start";
          el.hmLegend.style.marginTop = TP + "px";
          el.hmLegend.style.height = Math.round(GRID_H) + "px";
        }
      }
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
      const impact = fmtScenarioPct(E.lambda[st.j]);
      el.profileScenario.innerHTML = t().profileScenario(escapeHtml(producerLabel()));
      el.impactVal.textContent = impact;
      const sm = E.summary(st.dec);
      const k = t();
      const segs = [[k.own, sm.ownPct, "#b89cd6"], [k.direct, sm.directPct, "#7038a8"], [k.indirect, sm.indirectPct, "#3d1a63"]];
      el.bdBar.innerHTML = segs.map(([, v, c]) => `<span style="width:${v.toFixed(1)}%;background:${c}"></span>`).join("");
      el.bdKey.innerHTML = segs.map(([name, v, c]) => `<span><i style="background:${c}"></i><em>${name}</em><b>${v.toFixed(0)}%</b></span>`).join("");
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
    window.module4RedrawAll = redrawAll;

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
            <button class="module-controls-toggle panel-controls-toggle panel-close-btn" type="button" aria-expanded="true" aria-controls="module-4-controls" aria-label="${isEs() ? "Ocultar controles" : "Hide controls"}" title="${isEs() ? "Ocultar controles" : "Hide controls"}">×</button>
          </div>
          <div class="m4d-scroll">
          <div class="m4d-cgroup">
            <div class="m4d-clabel">1 · ${k.producerTitle}</div>
            <p class="m4d-instruction m4d-producer-theory">${k.producerTheory}</p>
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
            <p class="m4d-profile-scenario" id="m4d-profile-scenario"></p>
            <div class="m4d-kpi-top">
              <span class="m4d-kpi-val" id="m4d-impact">0%</span>
            </div>
            <div class="m4d-bd-top">${k.composition}</div>
            <div class="m4d-bd-bar" id="m4d-bd-bar"></div>
            <div class="m4d-bd-key" id="m4d-bd-key"></div>
          </div>
          <div class="m4d-cgroup">
            <div class="m4d-clabel">2 · ${k.component}</div>
            <p class="m4d-instruction">${k.componentInstr}</p>
            <div class="m3-q-cards" data-comp>
              <div class="m3-q-card active" role="button" tabindex="0" data-val="total"><div class="m3-q-title"><span>${k.total}</span><button type="button" class="m4d-info" data-info="total" aria-label="${isEs() ? "Más información sobre el impacto total" : "More information about total impact"}" aria-expanded="false">i</button></div><div class="m3-q-ask">${k.qTotal}</div></div>
              <div class="m3-q-card" role="button" tabindex="0" data-val="own"><div class="m3-q-title"><span>${k.own}</span><button type="button" class="m4d-info" data-info="own" aria-label="${isEs() ? "Más información sobre el componente propio" : "More information about the own component"}" aria-expanded="false">i</button></div><div class="m3-q-ask">${k.qOwn}</div></div>
              <div class="m3-q-card" role="button" tabindex="0" data-val="direct"><div class="m3-q-title"><span>${k.direct}</span><button type="button" class="m4d-info" data-info="dir" aria-label="${isEs() ? "Más información sobre la exposición directa" : "More information about direct exposure"}" aria-expanded="false">i</button></div><div class="m3-q-ask">${k.qDir}</div></div>
              <div class="m3-q-card" role="button" tabindex="0" data-val="indirect"><div class="m3-q-title"><span>${k.indirect}</span><button type="button" class="m4d-info" data-info="ind" aria-label="${isEs() ? "Más información sobre la exposición indirecta" : "More information about indirect exposure"}" aria-expanded="false">i</button></div><div class="m3-q-ask">${k.qInd}</div></div>
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
          <button class="m4d-method-btn" id="m4d-method-open">${k.method}</button>
          </div>
        </aside>

        <div class="m4d-vizcol">
          <div class="m4d-tabs" role="tablist">
            <button class="m4d-tab active" data-tab="geo"><span class="tab-axis">${k.axisGeo}</span></button>
            <button class="m4d-tab" data-tab="sec"><span class="tab-axis">${k.axisSec}</span></button>
            <button class="m4d-tab" data-tab="cell"><span class="tab-axis">${k.axisCell}</span></button>
          </div>
          <div class="m4d-panel active" data-panel="geo">
            <div class="m4d-hero">
              <div class="m4d-map-box">
                <div class="figure-actions" data-export-scope="module4" data-export-view="geo"><div class="figure-action-row"><button class="figure-expand-btn" type="button" aria-label="Ampliar figura" title="Ampliar figura" data-figure-expand-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M21 16v3a2 2 0 0 1-2 2h-3"></path><path d="M3 8v11h11"></path></svg></button><button class="figure-download-btn" type="button" aria-label="Descargar figura" data-export-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8.5 10.5 3.5 3.5 3.5-3.5"></path><path d="M5 18.5h14"></path></svg></button></div><div class="figure-download-menu" aria-hidden="true"><button class="figure-download-option" type="button" data-export-format="png">PNG</button><button class="figure-download-option" type="button" data-export-format="pdf">PDF</button></div></div>
                <svg id="m4d-map" aria-label="${k.tabGeo}"></svg>
                <div class="matrix-legend-vertical" id="m4d-map-legend"></div>
                <div class="near-zero-legend" id="m4d-map-nz-legend" hidden>
                  <span class="nz-gray" hidden><i style="background:#dcdcdc"></i>${k.legendNearZero}</span>
                  <span class="nz-zero" hidden><i style="background:#ffffff;border:1px solid rgba(34,30,124,0.18)"></i>${k.legendZero}</span>
                </div>
              </div>
              <div class="m4d-rail"><div class="m4d-rail-card"><div class="m4d-rail-head"><div class="rank-rail-head-text"><h4>${k.railGeo}</h4><div class="rank-list-unit">${k.unitPercent}</div></div><button class="rank-rail-close" type="button" aria-label="Ocultar ranking">×</button></div><div class="m4d-rank" id="m4d-rail-geo"></div></div></div>
            </div>
          </div>
          <div class="m4d-panel" data-panel="sec">
            <div class="m4d-hero">
              <div class="m4d-bars-col">
                <div class="figure-actions" data-export-scope="module4" data-export-view="sector"><div class="figure-action-row"><button class="figure-expand-btn" type="button" aria-label="Ampliar figura" title="Ampliar figura" data-figure-expand-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M21 16v3a2 2 0 0 1-2 2h-3"></path><path d="M3 8v11h11"></path></svg></button><button class="figure-download-btn" type="button" aria-label="Descargar figura" data-export-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8.5 10.5 3.5 3.5 3.5-3.5"></path><path d="M5 18.5h14"></path></svg></button></div><div class="figure-download-menu" aria-hidden="true"><button class="figure-download-option" type="button" data-export-format="png">PNG</button><button class="figure-download-option" type="button" data-export-format="pdf">PDF</button></div></div>
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
                <div class="figure-actions" data-export-scope="module4" data-export-view="matrix"><div class="figure-action-row"><button class="figure-expand-btn" type="button" aria-label="Ampliar figura" title="Ampliar figura" data-figure-expand-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M21 16v3a2 2 0 0 1-2 2h-3"></path><path d="M3 8v11h11"></path></svg></button><button class="figure-download-btn" type="button" aria-label="Descargar figura" data-export-toggle><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10"></path><path d="m8.5 10.5 3.5 3.5 3.5-3.5"></path><path d="M5 18.5h14"></path></svg></button></div><div class="figure-download-menu" aria-hidden="true"><button class="figure-download-option" type="button" data-export-format="png">PNG</button><button class="figure-download-option" type="button" data-export-format="pdf">PDF</button></div></div>
                <div class="m4d-hm-scroll"><svg id="m4d-hm" aria-label="${k.tabCell}"></svg></div>
                <div class="matrix-legend-vertical" id="m4d-hm-legend"></div>
                <div class="near-zero-legend" id="m4d-hm-nz-legend" hidden>
                  <span class="nz-gray" hidden><i style="background:#dcdcdc"></i>${k.legendNearZero}</span>
                  <span class="nz-zero" hidden><i style="background:#ffffff;border:1px solid rgba(34,30,124,0.18)"></i>${k.legendZero}</span>
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
        profileScenario: shell.querySelector("#m4d-profile-scenario"),
        impactVal: shell.querySelector("#m4d-impact"),
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

    // ── Más detalle metodológico (nuevo diseño) ────────────────────────────
    function eqHTML(tex) { return `<div class="m4d-eq" data-tex="${escapeHtml(tex)}"></div>`; }
    function imHTML(tex) { return `<span class="m4d-im" data-tex="${escapeHtml(tex)}"></span>`; }
    function methodHTML() {
      const es = isEs();
      const title = es ? "Detalle metodológico" : "Methodological detail";
      const lead = es
        ? "Cómo se construye, paso a paso, el impacto productivo de un productor aguas abajo, a cada uno de los productores de la economía."
        : "How the downstream productive impact of one producer on every producer in the economy is built, step by step.";
      const secs = es ? `
        <section class="m4d-mp-sec">
          <div class="m4d-mp-sechd"><span class="m4d-mp-num">1</span><h3 class="m4d-mp-h3">Teorema de Hulten</h3></div>
          <p class="m4d-mp-p">Baqaee &amp; Farhi muestran que, en economías eficientes, el teorema de Hulten sirve como una aproximación local: la elasticidad del PIB agregado a un shock de productividad en el productor ${imHTML("i")} es el Domar weight de dicho sector ${imHTML("i")}, es decir, sus ventas divididas por el PIB:</p>
          ${eqHTML("\\dfrac{d\\,\\log Y}{d\\,\\log A_i} \\approx \\dfrac{sales_i}{GDP} = \\lambda_i")}
          <p class="m4d-mp-note">En donde el Domar weight es en sí mismo un objeto de equilibrio. Ya incorpora las ventas brutas, los encadenamientos productivos y los flujos intermedios. La red sigue importando en un sentido profundo, pero a primer orden no entra por separado una vez conocidas las participaciones de venta: ya están incorporadas en ellas. Estas participaciones son un estadístico suficiente para agregar shocks micro.</p>
        </section>
        <section class="m4d-mp-sec">
          <div class="m4d-mp-sechd"><span class="m4d-mp-num">2</span><h3 class="m4d-mp-h3">Notación de Insumo-Producto</h3></div>
          <p class="m4d-mp-p">Por otro lado, el Domar weight de un productor está estrechamente relacionado con su cadena de valor. Sea ${imHTML("x_i")} su producción bruta, ${imHTML("y_i")} la parte destinada a usos finales y ${imHTML("x_{ji}")} la producción de ${imHTML("i")} utilizada como insumo por el productor ${imHTML("j")}. La matriz de insumo-producto se define como:</p>
          ${eqHTML("\\Omega_{ij} = \\dfrac{p_j\\,x_{ij}}{p_i\\,y_i}")}
          <p class="m4d-mp-p">En donde ${imHTML("i")} identifica al comprador y ${imHTML("j")} al proveedor. Por tanto, ${imHTML("\\Omega_{ij}")} representa el gasto del productor ${imHTML("i")} en insumos provenientes de ${imHTML("j")}, como proporción de las ventas de ${imHTML("i")}.</p>
          <p class="m4d-mp-p"><b>Inversa de Leontief:</b> Definimos la inversa de Leontief como:</p>
          ${eqHTML("\\Psi = (I-\\Omega)^{-1} = I + \\Omega + \\Omega^2 + \\Omega^3 + \\cdots")}
          <p class="m4d-mp-p">En donde la matriz ${imHTML("\\Omega")} captura la exposición directa de un productor a otro, aguas abajo, mientras que ${imHTML("\\Psi")} captura la exposición directa e indirecta a través de la cadena de valor.</p>
          <p class="m4d-mp-p"><b>Domar weights e Inversa de Leontief:</b> La identidad:</p>
          ${eqHTML("p_i\\,y_i = p_i\\,c_i + \\sum_j p_i\\,x_{ji}")}
          <p class="m4d-mp-p">relaciona los Domar weights y la inversa de Leontief vía:</p>
          ${eqHTML("\\lambda' = b'\\Psi = \\underbrace{b'I}_{\\text{Propio}} + \\underbrace{b'\\Omega}_{\\substack{\\text{Exposicion}\\\\\\text{Directa}}} + \\underbrace{b'\\Omega^2+b'\\Omega^3+\\ldots}_{\\substack{\\text{Exposicion}\\\\\\text{Indirecta}}}")}
          <p class="m4d-mp-p">En donde ${imHTML("b_i = p_i\\,c_i / \\sum_j p_j\\,c_j")} corresponde al share del productor ${imHTML("i")} en el consumo final.</p>
          <p class="m4d-mp-p">Lo cual permite observar cómo un shock productivo a un productor, caracterizado por su ubicación y sector, afecta a otros productores aguas abajo, a través de su geografía y su sector.</p>
          <p class="m4d-mp-p">Dividiendo ambos lados de la ecuación anterior por ${imHTML("b'\\Psi")}, podemos ver cuánto del impacto nacional de un productor se debe al impacto directo e indirecto en otros productores a lo largo de la economía.</p>
        </section>
      ` : `
        <section class="m4d-mp-sec">
          <div class="m4d-mp-sechd"><span class="m4d-mp-num">1</span><h3 class="m4d-mp-h3">Hulten's theorem</h3></div>
          <p class="m4d-mp-p">Baqaee &amp; Farhi show that, in efficient economies, Hulten's theorem provides a local approximation: the elasticity of aggregate GDP to a productivity shock in producer ${imHTML("i")} equals that producer's Domar weight ${imHTML("i")}, that is, its sales divided by GDP:</p>
          ${eqHTML("\\dfrac{d\\,\\log Y}{d\\,\\log A_i} \\approx \\dfrac{sales_i}{GDP} = \\lambda_i")}
          <p class="m4d-mp-note">The Domar weight is itself an equilibrium object. It already incorporates gross sales, production linkages and intermediate flows. The network still matters deeply, but at first order it does not enter separately once sales shares are known: it is already embedded in them. Those shares are a sufficient statistic to aggregate micro shocks.</p>
        </section>
        <section class="m4d-mp-sec">
          <div class="m4d-mp-sechd"><span class="m4d-mp-num">2</span><h3 class="m4d-mp-h3">Input-output notation</h3></div>
          <p class="m4d-mp-p">The Domar weight of a producer is closely linked to its value chain. Let ${imHTML("x_i")} be producer ${imHTML("i")}'s gross output, ${imHTML("y_i")} the part destined to final uses, and ${imHTML("x_{ji}")} the output of ${imHTML("i")} used as an input by producer ${imHTML("j")}. The input-output matrix is defined as:</p>
          ${eqHTML("\\Omega_{ij} = \\dfrac{p_j\\,x_{ij}}{p_i\\,y_i}")}
          <p class="m4d-mp-p">Index ${imHTML("i")} identifies the buyer and ${imHTML("j")} the supplier. Thus ${imHTML("\\Omega_{ij}")} represents producer ${imHTML("i")}'s spending on inputs from ${imHTML("j")} as a share of ${imHTML("i")}'s sales.</p>
          <p class="m4d-mp-p"><b>Leontief inverse:</b> We define the Leontief inverse as:</p>
          ${eqHTML("\\Psi = (I-\\Omega)^{-1} = I + \\Omega + \\Omega^2 + \\Omega^3 + \\cdots")}
          <p class="m4d-mp-p">Matrix ${imHTML("\\Omega")} captures a producer's direct downstream exposure to another producer, while ${imHTML("\\Psi")} captures both direct and indirect exposure through the value chain.</p>
          <p class="m4d-mp-p"><b>Domar weights and the Leontief inverse:</b> The identity</p>
          ${eqHTML("p_i\\,y_i = p_i\\,c_i + \\sum_j p_i\\,x_{ji}")}
          <p class="m4d-mp-p">links Domar weights to the Leontief inverse through:</p>
          ${eqHTML("\\lambda' = b'\\Psi = \\underbrace{b'I}_{\\text{Own}} + \\underbrace{b'\\Omega}_{\\substack{\\text{Direct}\\\\\\text{Exposure}}} + \\underbrace{b'\\Omega^2+b'\\Omega^3+\\ldots}_{\\substack{\\text{Indirect}\\\\\\text{Exposure}}}")}
          <p class="m4d-mp-p">where ${imHTML("b_i = p_i\\,c_i / \\sum_j p_j\\,c_j")} is producer ${imHTML("i")}'s share in final consumption.</p>
          <p class="m4d-mp-p">This makes it possible to see how a productivity shock to one producer, characterized by its location and sector, affects other downstream producers through geography and sector.</p>
          <p class="m4d-mp-p">Dividing both sides of the previous equation by ${imHTML("b'\\Psi")}, we can see how much of a producer's national impact comes from direct and indirect effects on other producers across the economy.</p>
        </section>
      `;
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
      scope.querySelectorAll(".m4d-im[data-tex]").forEach(node => {
        if (node.dataset.rendered) return;
        try { katex.render(node.getAttribute("data-tex"), node, { displayMode: false, throwOnError: false }); node.dataset.rendered = "1"; }
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
      const componentCards = shell.querySelector("[data-comp]");
      const selectComponent = b => {
        if (!b || !b.dataset.val) return;
        componentCards.querySelectorAll("[data-val]").forEach(x => x.classList.toggle("active", x === b));
        st.component = b.dataset.val;
        renderHeader(); redraw();
      };
      componentCards.addEventListener("click", e => {
        if (e.target.closest(".m4d-info")) return;
        selectComponent(e.target.closest("[data-val]"));
      });
      componentCards.addEventListener("keydown", e => {
        if (e.target.closest(".m4d-info")) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectComponent(e.target.closest("[data-val]")); }
      });
      shell.querySelectorAll(".m4d-tab").forEach(tb => tb.addEventListener("click", () => {
        shell.querySelectorAll(".m4d-tab").forEach(x => x.classList.toggle("active", x === tb));
        st.tab = tb.dataset.tab;
        shell.querySelectorAll(".m4d-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === st.tab));
        if (st.tab === "cell") { requestAnimationFrame(drawHeat); setTimeout(drawHeat, 60); setTimeout(drawHeat, 240); st.heatDrawn = true; }
        else redraw();
      }));

      // Ayudas de los conceptos: puntero, foco y toque/clic sin activar la tarjeta.
      let openInfo = null;
      shell.querySelectorAll("[data-info]").forEach(node => {
        const key = node.dataset.info;
        const txt = { total: "infoTotal", own: "infoOwn", dir: "infoDir", ind: "infoInd" }[key];
        const showInfo = () => {
          const k = t();
          const rect = node.getBoundingClientRect();
          showHC(`<div class="m4d-hc-info">${k[txt]}</div>`, rect.right, rect.top + rect.height / 2);
        };
        const closeInfo = () => {
          if (openInfo === node) openInfo = null;
          node.setAttribute("aria-expanded", "false");
          hideHC();
        };
        node.addEventListener("mouseenter", showInfo);
        node.addEventListener("mouseleave", () => { if (openInfo !== node) closeInfo(); });
        node.addEventListener("focus", showInfo);
        node.addEventListener("blur", () => { if (openInfo !== node) closeInfo(); });
        node.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();
          if (openInfo === node) { closeInfo(); return; }
          if (openInfo) openInfo.setAttribute("aria-expanded", "false");
          openInfo = node;
          node.setAttribute("aria-expanded", "true");
          showInfo();
        });
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
      section.querySelectorAll("[data-comp] [data-val]").forEach(b => b.classList.toggle("active", b.dataset.val === st.component));
      section.querySelectorAll(".m4d-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === st.tab));
      section.querySelectorAll(".m4d-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === st.tab));
      requestAnimationFrame(redrawAll);
    };
  });
})();
