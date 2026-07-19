(() => {
  const section = document.getElementById("module-3");
  if (!section) return;
  Promise.resolve(window.spatialIoFlowsDataPromise || window.spatialIoFlowsData).then((data) => {
    if (!data) return;

  const s = {
    view: "geo",
    perspective: "provider",
    question: "main",
    unit: "value",  // "value" | "share_flow" | "share_production" | "share_counterpart"
    geoLevel: "province",
    sectorLevel: "activity",
    selfGeo: { macrozone: [], region: [], province: [] },
    selfSector: { industry: [], pibr13: [], activity: [] },
    exclusions: { selfMarket: false },
    tradeScope: "total",
    subState: { intranode: "include", intraprov: "include", intrareg: "include", interreg: "include" },
    summaryOpen: false
  };

  const hoverCard = document.getElementById("module3-hover-card");
  let hoverPinned = false;
  let pinnedCell = null; // { type: "geo"|"sector"|"matrix", key, rowKey, colKey, x, y, genHtml }
  let _lastMetrics = null; // cached from last renderAll()

  const perspectiveSelect = section.querySelector("#m3-perspective");
  const questionSelect = section.querySelector("#m3-question");
  const unitSelect = section.querySelector("#m3-unit");
  const summaryEl = section.querySelector("#m3-selection-summary");
  const filterStack = section.querySelector(".filter-stack");
  const tabs = section.querySelectorAll(".module3-tab");
  const panels = section.querySelectorAll("[data-module3-view-panel]");
  const geoLevelControls = section.querySelectorAll("#m3-left-geo-level");
  const sectorLevelControls = section.querySelectorAll("#m3-left-sector-level");

  const domesticLocations = locations.filter((loc) => Number(loc.cod_ubicacion) !== 57);
  const allMacrozones = uniqueSorted(domesticLocations, "nom_macrozona", "cod_region_sort");
  const allRegions = uniqueSorted(domesticLocations, "nom_region", "cod_region_sort");
  const allProvinces = uniqueSorted(domesticLocations, "nom_provincia", "cod_provincia_sort");
  const allIndustries = uniqueSectorOptions("industry", sectors);
  const allPibr13 = uniqueSectorOptions("pibr13", sectors);
  const allActivities = uniqueSectorOptions("activity", sectors);
  const allUbiCodes = new Set(domesticLocations.map((loc) => Number(loc.cod_ubicacion)));
  const allSector46Codes = new Set(sectors.map((sec) => Number(sec.cod_SECTOR46)));
  const provinceByCut = new Map(locations.map((loc) => [String(loc.cod_provincia).padStart(3, "0"), loc]));
  const sectorMetaBy46 = new Map(sectors.map((sec) => [Number(sec.cod_SECTOR46), sec]));
  const specialLocationLabels = data.specialLabels?.location || {};
  const specialSectorLabels = data.specialLabels?.sector || {};
  const geoOrderMaps = {
    macrozone: new Map(allMacrozones.map((value, index) => [value, index])),
    region: new Map(allRegions.map((value, index) => [value, index])),
    province: new Map(allProvinces.map((value, index) => [value, index]))
  };
  const sectorOrderMaps = {
    industry: new Map(allIndustries.map((item, index) => [String(item.value), index])),
    pibr13: new Map(allPibr13.map((item, index) => [String(item.value), index])),
    activity: new Map(allActivities.map((item, index) => [String(item.value), index]))
  };

  // ── CedTreeSelect (web_materiales/js/tree-select.js): mismo componente que
  // Modulo 2. Arbol completo construido una sola vez; los checkboxes que
  // emite (data-filter-group="m3-self-geo-macrozone" etc) son consumidos por
  // el listener delegado existente en .filter-stack (mas abajo), asi que la
  // logica de estado (s.selfGeo/s.selfSector, updateSelectionList) no cambia.
  function buildM3GeoTree() {
    const sorted = [...domesticLocations].sort((a, b) =>
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

  function buildM3SectorTree() {
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
        label: sectorGroupLabel(indCode, "industry"),
        children: Array.from(pibrMap.entries())
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([pibrCode, actCodes]) => ({
            value: pibrCode,
            label: sectorGroupLabel(pibrCode, "pibr13"),
            children: Array.from(actCodes)
              .sort((a, b) => Number(a) - Number(b))
              .map((actCode) => ({ value: actCode, label: sectorGroupLabel(actCode, "activity"), children: [] })),
          })),
      }));
  }

  const m3GeoMount = section.querySelector("#m3-self-geo-tree-group");
  const m3SectorMount = section.querySelector("#m3-self-sector-tree-group");

  const m3TreeSelectGeo = (m3GeoMount && window.CedTreeSelect)
    ? window.CedTreeSelect.create({
        mount: m3GeoMount,
        mode: "multi",
        levels: ["macrozone", "region", "province"],
        groupPrefix: "m3-self-geo",
        showActions: false,
        tree: buildM3GeoTree(),
        getSelection: () => s.selfGeo,
        i18n: () => ({
          search: isEs() ? "Buscar macrozona, región o provincia…" : "Search macrozone, region or province…",
          summaryAll: isEs() ? "Todas las provincias" : "All provinces",
          summaryN: isEs() ? "{n} seleccionados" : "{n} selected",
          noResults: isEs() ? "Sin resultados" : "No results",
        }),
      })
    : null;

  const m3TreeSelectSector = (m3SectorMount && window.CedTreeSelect)
    ? window.CedTreeSelect.create({
        mount: m3SectorMount,
        mode: "multi",
        levels: ["industry", "pibr13", "activity"],
        groupPrefix: "m3-self-sector",
        showActions: false,
        tree: buildM3SectorTree(),
        getSelection: () => s.selfSector,
        i18n: () => ({
          search: isEs() ? "Buscar industria, sector o actividad…" : "Search industry, sector or activity…",
          summaryAll: isEs() ? "Todos los sectores" : "All sectors",
          summaryN: isEs() ? "{n} seleccionados" : "{n} selected",
          noResults: isEs() ? "Sin resultados" : "No results",
        }),
      })
    : null;

  function lang() { return state.lang; }
  function isEs() { return lang() === "es"; }
  function activeSides() {
    return s.perspective === "provider"
      ? { selfGeo: data.vu, selfSector: data.vs, otherGeo: data.cu, otherSector: data.cs }
      : { selfGeo: data.cu, selfSector: data.cs, otherGeo: data.vu, otherSector: data.vs };
  }
  function currentQuestionLabel() {
    if (s.question === "relevance") return copy[lang()].m3QuestionRelevance;
    return s.perspective === "provider" ? copy[lang()].m3QuestionMainProvider : copy[lang()].m3QuestionMainClient;
  }
  function currentUnitLabel(mode = s.unit) {
    if (mode === "share_flow")        return isEs() ? "% del flujo" : "% of flow";
    if (mode === "share_production")  return isEs() ? "% de mi producción" : "% of my output";
    if (mode === "share_counterpart") return isEs() ? "% de la contraparte" : "% of counterpart";
    if (mode === "share")             return copy[lang()].m3UnitShare;
    return isEs() ? "Billones de CLP" : "MUSD$";
  }
  // tv flow values are in USD; convert using module2Data.usdRate (782.75) to match CLP scale of econRows
  const m2UsdRate = window.module2Data?.usdRate || 782.75;

  function formatValue(value, mode = s.unit) {
    const isPct = mode === "share" || mode === "share_flow" || mode === "share_production" || mode === "share_counterpart";
    if (isPct) return `${(Number(value || 0) * 100).toFixed(1)}%`;
    const num = Number(value || 0);
    // "clp" mode: value already in display CLP unit (from econRows/1e9), no conversion needed
    if (mode === "clp") {
      const s2 = num;
      return new Intl.NumberFormat(isEs() ? "es-CL" : "en-US", {
        minimumFractionDigits: s2 > 0 && s2 < 10 ? 1 : 0,
        maximumFractionDigits: s2 > 0 && s2 < 10 ? 1 : 0
      }).format(s2);
    }
    // Default (flows): tv_USD × m2UsdRate / 1000 → CLP scale; or raw USD for English
    const scaled = isEs() ? num * m2UsdRate / 1000000 : num;
    return new Intl.NumberFormat(isEs() ? "es-CL" : "en-US", {
      minimumFractionDigits: scaled > 0 && scaled < 10 ? 1 : 0,
      maximumFractionDigits: scaled > 0 && scaled < 10 ? 1 : 0
    }).format(scaled);
  }
  function formatUnitValue(value, mode = s.unit) {
    const isPct = mode === "share" || mode === "share_flow" || mode === "share_production" || mode === "share_counterpart";
    if (isPct) return `${(Number(value || 0) * 100).toFixed(1)}%`;
    return `${formatValue(value, mode)} ${currentUnitLabel(mode)}`;
  }
  function applyMatrixZeroThreshold(value, mode = s.unit) {
    const raw = Number(value || 0);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return raw;
  }
  function geoGroupName(ubicCode, level = s.geoLevel) {
    const key = String(ubicCode);
    const label = specialLocationLabels[key];
    if (label) {
      // Support both string labels and {es, en} bilingual objects
      if (typeof label === "string") return label;
      return isEs() ? label.es : label.en;
    }
    const loc = locationByUbicacion.get(String(ubicCode));
    if (!loc) return "";
    if (level === "macrozone") return loc.nom_macrozona;
    if (level === "region") return loc.nom_region;
    return loc.nom_provincia;
  }
  function sectorGroupCode(sector46, level = s.sectorLevel) {
    const meta = sectorMetaBy46.get(Number(sector46));
    if (!meta) return String(sector46);
    if (level === "industry") return String(meta.cod_industria);
    if (level === "pibr13") return String(meta.cod_PIBR13);
    return String(meta.cod_SECTOR46);
  }
  function sectorGroupLabel(code, level = s.sectorLevel) {
    const key = String(code);
    if (specialSectorLabels[key]) return specialSectorLabels[key];
    return sectorLabel(level, code);
  }
  function geoOrder(key, level = s.geoLevel) {
    return geoOrderMaps[level].get(key) ?? 9999;
  }
  function sectorOrder(key, level = s.sectorLevel) {
    return sectorOrderMaps[level].get(String(key)) ?? 9999;
  }
  function selectedGeoCodes(selection) {
    if (selection.province.length) return new Set(locations.filter((loc) => selection.province.includes(loc.nom_provincia)).map((loc) => Number(loc.cod_ubicacion)));
    if (selection.region.length) return new Set(locations.filter((loc) => selection.region.includes(loc.nom_region)).map((loc) => Number(loc.cod_ubicacion)));
    if (selection.macrozone.length) return new Set(locations.filter((loc) => selection.macrozone.includes(loc.nom_macrozona)).map((loc) => Number(loc.cod_ubicacion)));
    return new Set(allUbiCodes);
  }
  function selectedSectorCodes(selection) {
    if (selection.activity.length) return new Set(selection.activity.map(Number));
    if (selection.pibr13.length) return new Set(sectors.filter((sec) => selection.pibr13.includes(String(sec.cod_PIBR13))).map((sec) => Number(sec.cod_SECTOR46)));
    if (selection.industry.length) return new Set(sectors.filter((sec) => selection.industry.includes(String(sec.cod_industria))).map((sec) => Number(sec.cod_SECTOR46)));
    return new Set(allSector46Codes);
  }
  function describeQuestion() {
    if (s.question === "main") {
      return s.perspective === "provider"
        ? (isEs() ? "Muestra qué clientes concentran mis ventas dentro del universo filtrado." : "Shows which clients concentrate my sales within the filtered universe.")
        : (isEs() ? "Muestra qué proveedores concentran mis compras dentro del universo filtrado." : "Shows which suppliers concentrate my purchases within the filtered universe.");
    }
    return s.perspective === "provider"
      ? (isEs() ? "Mide qué tan importante soy como proveedor para cada cliente visible." : "Measures how important I am as a supplier for each visible client.")
      : (isEs() ? "Mide qué tan importante soy como cliente para cada proveedor visible." : "Measures how important I am as a client for each visible supplier.");
  }
  function describeUnit() {
    if (s.unit === "value") return isEs() ? `Muestra el flujo en ${currentUnitLabel("value")}.` : `Shows the flow in ${currentUnitLabel("value")}.`;
    if (s.question === "main") {
      return s.perspective === "provider"
        ? (isEs() ? "Usa como denominador el total filtrado de los productores seleccionados." : "Uses the selected producers' filtered total as denominator.")
        : (isEs() ? "Usa como denominador el total filtrado de los productores seleccionados." : "Uses the selected producers' filtered total as denominator.");
    }
    return s.perspective === "provider"
      ? (isEs() ? "Usa como denominador el total filtrado de cada cliente visible." : "Uses each visible client's filtered total as denominator.")
      : (isEs() ? "Usa como denominador el total filtrado de cada proveedor visible." : "Uses each visible supplier's filtered total as denominator.");
  }
  function describeExclusions() {
    const map = {
      total: isEs() ? "Doméstico + exportaciones" : "Domestic + exports",
      domestic: isEs() ? "Todo nacional" : "All domestic",
      intraregional: isEs() ? "Intra-regional" : "Intra-regional",
      intraprovincial: isEs() ? "Intra-provincial" : "Intra-provincial",
      intranode: isEs() ? "Intra-nodo" : "Intra-node",
      international: isEs() ? "Solo exportaciones" : "Exports only"
    };
    return map[s.tradeScope] || (isEs() ? "Doméstico + exportaciones" : "Domestic + exports");
  }
  function displayMetric(raw, baseTotal, benchmarkMap, key) {
    if (s.unit === "value") return applyMatrixZeroThreshold(raw, "value");
    // % del flujo: raw / mis ventas/compras intermedias totales
    if (s.unit === "share_flow") return applyMatrixZeroThreshold(baseTotal > 0 ? raw / baseTotal : 0, "share");
    // For share_production and share_counterpart: use domestic-only raw (exports excluded)
    const m = _lastMetrics;
    let domRaw = raw;
    if (m) {
      if (key.includes("|||")) {
        domRaw = m.byCellRawDom?.get(key) ?? 0;
      } else {
        domRaw = m.byGeoRawDom?.get(key) ?? m.bySectorRawDom?.get(key) ?? 0;
      }
    }
    // % de mi producción: raw (includes exports) / ventas_tot del self node
    // Exports ARE part of my production going to the world — use full raw, not domRaw
    if (s.unit === "share_production") {
      let denom;
      if (key.includes("|||") && m) {
        const rowKey = key.split("|||")[0];
        denom = m.productionByGeo?.get(rowKey) || m.selfProductionTotal || baseTotal;
      } else {
        denom = m?.selfProductionTotal || baseTotal;
      }
      return denom > 0 ? raw / denom : 0;
    }
    // % de la contraparte:
    //   cell (geo|||sector): domRaw / production of the SECTOR col (buyer sector)
    //   geo bar:             domRaw / counterpartGeoTotals[geoKey]
    //   sector bar:          domRaw / counterpartSectorTotals[secKey]
    if (s.unit === "share_counterpart") {
      let denom = 0;
      if (m) {
        if (key.includes("|||")) {
          const colKey = key.split("|||")[1];
          denom = m.productionBySector?.get(colKey) || m.counterpartCellTotals?.get(key) || 0;
        } else {
          denom = m.counterpartGeoTotals?.get(key)
               || m.counterpartSectorTotals?.get(key)
               || 0;
        }
      }
      return applyMatrixZeroThreshold(denom > 0 ? domRaw / denom : 0, "share");
    }
    // fallback: % del flujo
    return applyMatrixZeroThreshold(baseTotal > 0 ? raw / baseTotal : 0, "share");
  }

  function syncExclusionControls() {
    // No-op — exclusions replaced by tradeScope buttons (data-m3-trade)
  }

  function showHover(html, x, y, pinned = false) {
    if (!hoverCard) return;
    if (hoverPinned && !pinned) return; // don't replace pinned card on hover
    const closeBtn = `<button class="hover-card-close" onclick="(function(){var hc=document.getElementById('module3-hover-card');hc.classList.remove('is-visible','is-pinned');hc.innerHTML='';})()">×</button>`;
    hoverCard.innerHTML = pinned ? closeBtn + html : html;
    hoverCard.classList.add("is-visible");
    hoverCard.classList.toggle("is-pinned", pinned);
    const rect = hoverCard.getBoundingClientRect();
    hoverCard.style.left = `${Math.max(16, Math.min(window.innerWidth - rect.width - 16, x + 16))}px`;
    hoverCard.style.top = `${Math.max(16, Math.min(window.innerHeight - rect.height - 16, y + 16))}px`;
    // pinnedContent removed — use pinnedCell.genHtml instead
  }
  function pinHover(html, x, y, genHtml) {
    hoverPinned = true;
    pinnedCell = { x, y, genHtml };
    showHover(html, x, y, true);
    // Wire close button to reset pinned state
    hoverCard.querySelector(".hover-card-close")?.addEventListener("click", () => {
      hoverPinned = false;
      pinnedCell = null;
      hoverCard.classList.remove("is-visible", "is-pinned");
      hoverCard.innerHTML = "";
    });
  }
  function refreshPinnedHover() {
    if (!hoverPinned || !pinnedCell?.genHtml) return;
    const freshHtml = pinnedCell.genHtml();
    if (!freshHtml) return;
    const closeBtn = `<button class="hover-card-close" onclick="(function(){var hc=document.getElementById('module3-hover-card');hc.classList.remove('is-visible','is-pinned');hc.innerHTML='';})()">×</button>`;
    hoverCard.innerHTML = closeBtn + freshHtml;
    hoverCard.querySelector(".hover-card-close")?.addEventListener("click", () => {
      hoverPinned = false;
      pinnedCell = null;
      hoverCard.classList.remove("is-visible", "is-pinned");
      hoverCard.innerHTML = "";
    });
  }
  function unpinHover() {
    hoverPinned = false;
    pinnedCell = null;
    hoverCard.classList.remove("is-visible", "is-pinned");
    hoverCard.innerHTML = "";
  }
  function hideHover() {
    if (!hoverCard) return;
    if (hoverPinned) return; // don't hide if pinned
    hoverCard.classList.remove("is-visible");
    hoverCard.innerHTML = "";
  }

  function alignGeoLegendToMapM3() {
    return; // leyenda ahora es hijo flex de .map-stage (estándar M4); sin posicionamiento JS
    const mapStage = document.querySelector(".module-three-view[data-module3-view-panel=\"geo\"] .map-stage");
    const svgEl = document.getElementById("m3-map-chile");
    const legend = document.getElementById("m3-geo-legend");
    if (!mapStage || !svgEl || !legend) return;

    const shapeNodes = svgEl.querySelectorAll("path");
    if (!shapeNodes.length) return;

    const svgRect = svgEl.getBoundingClientRect();
    const stageRect = mapStage.getBoundingClientRect();
    const bbox = svgEl.getBBox();
    if (!(svgRect.width > 0) || !(svgRect.height > 0) || !(bbox.width > 0) || !(bbox.height > 0)) return;

    const _vb = svgEl.viewBox.baseVal;
    const scaleX = _vb.width > 0 ? svgRect.width / _vb.width : svgRect.width / 860;
    const scaleY = _vb.height > 0 ? svgRect.height / _vb.height : svgRect.height / 620;
    const mapLeft = svgRect.left - stageRect.left + (bbox.x * scaleX);
    const mapTop = svgRect.top - stageRect.top + (bbox.y * scaleY);
    const mapWidth = bbox.width * scaleX;
    const mapHeight = bbox.height * scaleY;
    const legendGap = 8;

    legend.style.left = `${Math.round(mapLeft + mapWidth + legendGap)}px`;
    legend.style.top = `${Math.round(mapTop)}px`;
    legend.style.height = `${Math.round(mapHeight)}px`;

    const legendBar = legend.querySelector(".geo-legend-bar");
    if (legendBar) legendBar.style.height = `${Math.round(mapHeight)}px`;
  }

  function syncLanguage() {
    // ── Translate static panel elements ──────────────────────────────────────
    const es = isEs();
    const prov = s.perspective === "provider";
    const cp = es ? (prov ? "cliente" : "proveedor") : (prov ? "client" : "supplier");
    const cpPl = es ? (prov ? "clientes" : "proveedores") : (prov ? "clients" : "suppliers");
    const myAct = es ? (prov ? "ventas" : "compras") : (prov ? "sales" : "purchases");
    const _t = {
      m3BadgeLabel:         es ? "Cadenas de valor · Perspectiva"              : "Value chains · Perspective",
      m3PerspBtnProvider:   es ? "Clientes"                                    : "Clients",
      m3PerspBtnClient:     es ? "Proveedores"                                 : "Suppliers",
      m3MarketLabel:        es ? "1 · Elige los productores"                   : "1 · Choose the producers",
      m3MarketInstruction:  es ? `Selecciona la ubicación y el sector de los productores cuyos ${cpPl} quieres explorar.` : `Select the location and sector of the producers whose ${cpPl} you want to explore.`,
      m3CharcLabel:         es ? "Perfil de los productores"                   : "Producers' profile",
      m3CharcInstruction:   es ? `Así se compone la actividad económica de los productores seleccionados: cuánto producen, cuánto venden y de dónde obtienen sus insumos. Te ayuda a dimensionar a los productores antes de mirar sus ${cpPl}.` : `This is how the selected producers' economic activity breaks down: how much they produce, how much they sell and where they source their inputs. It helps you size up the producers before looking at their ${cpPl}.`,
      m3FlowLabel:          es ? "Resultado · Flujo de la selección"           : "Result · Selection flow",
      m3VisualizeLabel:     es ? "2 · Elige cómo medir"                        : "2 · Choose how to measure",
      m3VisualizeInstruction: es ? `Cada unidad responde una pregunta distinta sobre tu relación con los ${cpPl}. Elige la que te interesa observar.` : `Each unit answers a different question about your relationship with your ${cpPl}. Pick the one you want to observe.`,
      m3AggGeoLabel:        es ? "3 · Ajusta el detalle"                       : "3 · Adjust the detail",
      m3AggInstruction:     es ? `Escoge con qué nivel de agregación territorial y sectorial se muestran tus ${cpPl} en el mapa.` : `Choose the territorial and sectoral aggregation level at which your ${cpPl} appear on the map.`,
      m3AggGeoSubLabel:     es ? "Territorio"                                  : "Territory",
      m3AggSecSubLabel:     es ? "Sector"                                      : "Sector",
      m3AggSecLabel:        es ? "3 · Ajusta el detalle"                       : "3 · Adjust the detail",
      m3AggSectionLabel:    es ? "3 · Ajusta el detalle"                       : "3 · Adjust the detail",
      m3TradeLabel:         es ? "4 · Filtra el comercio"                      : "4 · Filter trade",
      m3TradeInstruction:   es ? "Limita las transacciones que se cuentan según su origen y destino." : "Limit which transactions are counted by their origin and destination.",
      m2GeoAggregationLabel:es ? "Geografía"                                   : "Geography",
      m2AggSector:          "Sector",
      m2SelectAll:          es ? "Todos"                                        : "Select all",
      m2ClearAll:           es ? "Limpiar"                                      : "Clear",
      m2AggMacrozone:       es ? "Macrozona"                                    : "Macrozone",
      m2AggRegion:          es ? "Región"                                       : "Region",
      m2AggProvince:        es ? "Provincia"                                    : "Province",
      m2AggIndustry:        es ? "Industria"                                    : "Industry",
      m2AggActivity:        es ? "Actividad"                                    : "Activity",
      m3IntraNode:          es ? "Intra-nodo"                                   : "Intra-node",
      m3IntraProv:          "Intra-prov.",
      m3IntraReg:           "Intra-reg.",
      m3InterReg:           "Inter-reg.",
      m3Include:            es ? "Incluir"                                       : "Include",
      m3Solo:               es ? "Solo"                                          : "Only",
      m3Exclude:            es ? "Excluir"                                       : "Exclude",
      m3Reset:              "Reset",
      m3UnitValueTitle:     es ? "Billones de CLP"                               : "MUSD$",
      m3UnitValueSub:       es ? `¿Dónde están mis ${cpPl} más grandes?`          : `Where are my largest ${cpPl}?`,
      m3UnitFlowTitle:      es ? `% de mis ${myAct} a empresas`                   : `% of my ${myAct} to firms`,
      m3UnitFlowSub:        es ? `¿Cómo reparto mis ${myAct} entre ${cpPl}?`      : `How do I split my ${myAct} across ${cpPl}?`,
      m3UnitProductionTitle:es ? `% de mis ${myAct} totales`                     : `% of my total ${myAct}`,
      m3UnitProductionSub:  es ? `¿Qué tan dependiente soy de cada ${cp}?`        : `How dependent am I on each ${cp}?`,
      m3UnitCounterpartTitle:es ? `% de las ventas totales del ${cp}`            : `% of the ${cp}'s total sales`,
      m3UnitCounterpartSub: es ? `¿Qué tan importante soy para ese ${cp}?`        : `How important am I to that ${cp}?`,
    };
    section.querySelectorAll("[data-i18n]").forEach((node) => {
      const v = _t[node.dataset.i18n];
      if (v !== undefined) node.textContent = v;
    });
    perspectiveSelect.options[0].text = copy[lang()].m3PerspectiveProvider;
    perspectiveSelect.options[1].text = copy[lang()].m3PerspectiveClient;
    questionSelect.options[0].text = s.perspective === "provider" ? copy[lang()].m3QuestionMainProvider : copy[lang()].m3QuestionMainClient;
    questionSelect.options[1].text = copy[lang()].m3QuestionRelevance;
    unitSelect.options[0].text = isEs() ? "Billones de CLP" : "MUSD$";
    unitSelect.options[1].text = copy[lang()].m3UnitShare;
    geoLevelControls.forEach((select) => {
      select.options[0].text = isEs() ? "Macrozona" : "Macrozone";
      select.options[1].text = isEs() ? "Región" : "Region";
      select.options[2].text = isEs() ? "Provincia" : "Province";
    });
    sectorLevelControls.forEach((select) => {
      select.options[0].text = isEs() ? "Industria" : "Industry";
      select.options[1].text = "Sector";
      select.options[2].text = isEs() ? "Actividad" : "Activity";
    });
    syncExclusionControls();
    // Sync trade button labels
    const tradeBtns = section.querySelectorAll("[data-m3-trade]");
    tradeBtns.forEach((b) => {
      if (b.dataset.m3Trade === "total") b.textContent = isEs() ? "Total" : "Total";
      if (b.dataset.m3Trade === "domestic") b.textContent = isEs() ? "Doméstico" : "Domestic";
      if (b.dataset.m3Trade === "international") b.textContent = isEs() ? "Internacional" : "International";
    });
  }

  function renderSelectionCascade(prefix, selectionGeo, selectionSector) {
    selectionGeo.macrozone = pruneSelection(selectionGeo.macrozone, allMacrozones);
    selectionGeo.region = pruneSelection(selectionGeo.region, allRegions);
    selectionGeo.province = pruneSelection(selectionGeo.province, allProvinces);
    selectionSector.industry = pruneSelection(selectionSector.industry, allIndustries.map((d) => d.value));
    selectionSector.pibr13 = pruneSelection(selectionSector.pibr13, allPibr13.map((d) => d.value));
    selectionSector.activity = pruneSelection(selectionSector.activity, allActivities.map((d) => d.value));
    m3TreeSelectGeo?.refresh();
    m3TreeSelectSector?.refresh();
  }

  function renderFilters() {
    syncExclusionControls();
    renderSelectionCascade("m3-self", s.selfGeo, s.selfSector);
  }

  function computeMetrics() {
    const side = activeSides();
    const selfGeoCodes = selectedGeoCodes(s.selfGeo);
    const selfSectorCodes = selectedSectorCodes(s.selfSector);
    const result = {
      totalSelected: 0,
      selfTotalRaw: 0,
      selfGeoCount: selfGeoCodes.size,
      selfSectorCount: selfSectorCodes.size,
      byGeoRaw: new Map(),
      bySectorRaw: new Map(),
      byCellRaw: new Map(),
      byGeoRawDom: new Map(),       // same but exports excluded
      bySectorRawDom: new Map(),
      byCellRawDom: new Map(),
      topSectorByGeo: new Map(),
      topGeoBySector: new Map(),
      benchmarkGeoTotals: new Map(),
      benchmarkSectorTotals: new Map(),
      benchmarkCellTotals: new Map()
    };

    for (let i = 0; i < data.tv.length; i += 1) {
      const raw = Number(data.tv[i] || 0);
      if (raw <= 0) continue;
      const selfGeoCode = Number(side.selfGeo[i]);
      const selfSectorCode = Number(side.selfSector[i]);
      const otherGeoCode = Number(side.otherGeo[i]);
      const otherSectorCode = Number(side.otherSector[i]);
      const isExport = Number(data.isExport?.[i] || 0) === 1;
      const isImport = Number(data.isImport?.[i] || 0) === 1;
      const isDomestic = Number(data.isDomestic?.[i] || 0) === 1;
      const isIntraNode = Number(data.isIntraNode?.[i] || 0) === 1;

      // Trade scope filter
      // For "total" and "domestic": exclude imports (they represent foreign production, not Chilean output)
      const forceExcludeImport = (s.tradeScope === "total" || s.tradeScope === "domestic" ||
        s.tradeScope === "intraregional" || s.tradeScope === "intraprovincial" || s.tradeScope === "intranode");
      if (forceExcludeImport && isImport) continue;

      // Main scope filter
      if (s.tradeScope === "domestic" && !isDomestic) continue;
      if (s.tradeScope === "intraregional" && !Number(data.isIntraregional?.[i]||0)) continue;
      if (s.tradeScope === "intraprovincial" && !Number(data.isIntraprovincial?.[i]||0)) continue;
      if (s.tradeScope === "intranode" && !Number(data.isIntraNode?.[i]||0)) continue;
      // International = exports (provider side) OR imports (client side)
      if (s.tradeScope === "international" && !isExport && !isImport) continue;

      // Domestic sub-type 3-state filter (only when domestic scope)
      if (isDomestic && s.tradeScope === "domestic") {
        const isIntraNode = Number(data.isIntraNode?.[i]||0) === 1;
        const isIntraProv = Number(data.isIntraprovincial?.[i]||0) === 1 && !isIntraNode;
        const isIntraReg  = Number(data.isIntraregional?.[i]||0) === 1 && !isIntraNode && !isIntraProv;
        const isInterReg  = isDomestic && !isIntraNode && !isIntraProv && !isIntraReg;

        // Determine which key this row belongs to
        const rowKey = isIntraNode ? "intranode" : isIntraProv ? "intraprov" : isIntraReg ? "intrareg" : "interreg";
        const rowState = s.subState[rowKey];

        // If ANY sub-type is "solo", only show rows in solo state
        const hasSolo = Object.values(s.subState).some(v => v === "solo");
        if (hasSolo) {
          if (rowState !== "solo") continue;
        } else {
          if (rowState === "exclude") continue;
        }
      }

      // Self-market exclusion (intraNode = same location-sector)
      if (s.exclusions.selfMarket && isIntraNode) continue;
      const selfMatches = selfGeoCodes.has(selfGeoCode) && selfSectorCodes.has(selfSectorCode);
      if (!selfMatches) {
        result.benchmarkGeoTotals.set(geoGroupName(otherGeoCode), (result.benchmarkGeoTotals.get(geoGroupName(otherGeoCode)) || 0) + raw);
        result.benchmarkSectorTotals.set(sectorGroupCode(otherSectorCode), (result.benchmarkSectorTotals.get(sectorGroupCode(otherSectorCode)) || 0) + raw);
        result.benchmarkCellTotals.set(`${geoGroupName(otherGeoCode)}|||${sectorGroupCode(otherSectorCode)}`, (result.benchmarkCellTotals.get(`${geoGroupName(otherGeoCode)}|||${sectorGroupCode(otherSectorCode)}`) || 0) + raw);
        continue;
      }

      // International scope: the counterpart is foreign (not mappable to Chilean
      // territories/sectors). Aggregate by the SELF (Chilean) side instead, so the
      // visualizations show the main Chilean exporters (provider) / importers (client).
      const _intlAgg = s.tradeScope === "international";
      const geoKey = geoGroupName(_intlAgg ? selfGeoCode : otherGeoCode);
      const sectorKey = sectorGroupCode(_intlAgg ? selfSectorCode : otherSectorCode);
      const cellKey = `${geoKey}|||${sectorKey}`;
      result.benchmarkGeoTotals.set(geoKey, (result.benchmarkGeoTotals.get(geoKey) || 0) + raw);
      result.benchmarkSectorTotals.set(sectorKey, (result.benchmarkSectorTotals.get(sectorKey) || 0) + raw);
      result.benchmarkCellTotals.set(cellKey, (result.benchmarkCellTotals.get(cellKey) || 0) + raw);

      result.selfTotalRaw += raw;

      result.byGeoRaw.set(geoKey, (result.byGeoRaw.get(geoKey) || 0) + raw);
      result.bySectorRaw.set(sectorKey, (result.bySectorRaw.get(sectorKey) || 0) + raw);
      result.byCellRaw.set(cellKey, (result.byCellRaw.get(cellKey) || 0) + raw);
      // Domestic-only variants: exclude exports (no counterpart production for foreign recipients)
      if (!isExport) {
        result.byGeoRawDom.set(geoKey, (result.byGeoRawDom.get(geoKey) || 0) + raw);
        result.bySectorRawDom.set(sectorKey, (result.bySectorRawDom.get(sectorKey) || 0) + raw);
        result.byCellRawDom.set(cellKey, (result.byCellRawDom.get(cellKey) || 0) + raw);
      }
      if (!result.topSectorByGeo.has(geoKey)) result.topSectorByGeo.set(geoKey, new Map());
      if (!result.topGeoBySector.has(sectorKey)) result.topGeoBySector.set(sectorKey, new Map());
      result.topSectorByGeo.get(geoKey).set(sectorKey, (result.topSectorByGeo.get(geoKey).get(sectorKey) || 0) + raw);
      result.topGeoBySector.get(sectorKey).set(geoKey, (result.topGeoBySector.get(sectorKey).get(geoKey) || 0) + raw);
      result.totalSelected += raw;
    }
    // ── KPI economic decomposition (always seller perspective, no exclusions) ──
    const kpi = { vendorTotal:0, vendorIntermedNac:0, vendorFinalDemand:0, vendorExport:0, clientTotal:0, clientNac:0, clientImport:0 };
    for (let i = 0; i < data.tv.length; i++) {
      const raw = Number(data.tv[i] || 0);
      if (raw <= 0) continue;
      const vuCode = Number(data.vu[i]);
      const vsCode = Number(data.vs[i]);
      const cuCode = Number(data.cu[i]);
      const csCode = Number(data.cs[i]);
      const isExp = Number(data.isExport?.[i] || 0) === 1;
      const isImp = Number(data.isImport?.[i] || 0) === 1;
      if (selfGeoCodes.has(vuCode) && selfSectorCodes.has(vsCode)) {
        kpi.vendorTotal += raw;
        if (!isExp && !isImp) kpi.vendorIntermedNac += raw;
        if (false) kpi.vendorFinalDemand += raw;
        if (isExp) kpi.vendorExport += raw;
      }
      if (selfGeoCodes.has(cuCode) && selfSectorCodes.has(csCode)) {
        kpi.clientTotal += raw;
        if (!isExp) kpi.clientNac += raw;
        if (isExp)  kpi.clientImport += raw;
      }
    }
    result.kpi = kpi;

    // ── Module2-based denominators for % de mi producción and % de la contraparte ──
    // Both always use ventas_tot — difference is WHOSE ventas_tot:
    //   share_production  = flow / ventas_tot of MY node (self)
    //   share_counterpart = flow / ventas_tot of the COUNTERPART node
    const m2rows = window.module2Data?.econRows || [];
    const m2scale = m2UsdRate * 1e6; // econRows ventas_tot in raw CLP; flows in USD → divide CLP by (usdRate × 1e6) to get MUSD
    const counterpartGeoTotals    = new Map();
    const counterpartSectorTotals = new Map();
    const counterpartCellTotals   = new Map();
    let selfProductionTotal = 0;
    for (const row of m2rows) {
      const gk  = geoGroupName(Number(row.cod_ubicacion));
      const sk  = sectorGroupCode(Number(row.cod_SECTOR46));
      const ck  = `${gk}|||${sk}`;
      const vt  = (Number(row.ventas_tot || 0)) / m2scale;
      // Counterpart totals (ventas_tot grouped by geo/sector)
      if (gk) {
        counterpartGeoTotals.set(gk,  (counterpartGeoTotals.get(gk)  || 0) + vt);
        counterpartCellTotals.set(ck, (counterpartCellTotals.get(ck) || 0) + vt);
      }
      if (sk) {
        counterpartSectorTotals.set(sk, (counterpartSectorTotals.get(sk) || 0) + vt);
      }
      // Self production total (ventas_tot for my selected geo+sector)
      if (selfGeoCodes.has(Number(row.cod_ubicacion)) && selfSectorCodes.has(Number(row.cod_SECTOR46))) {
        selfProductionTotal += vt;
      }
    }
    result.counterpartGeoTotals    = counterpartGeoTotals;
    result.counterpartSectorTotals = counterpartSectorTotals;
    result.counterpartCellTotals   = counterpartCellTotals;
    result.selfProductionTotal     = selfProductionTotal;
    // Also build productionByGeo and productionBySector (ventas_tot summed over all rows)
    const productionByGeo    = new Map();
    const productionBySector = new Map();
    for (const row of m2rows) {
      const gk = geoGroupName(Number(row.cod_ubicacion));
      const sk = sectorGroupCode(Number(row.cod_SECTOR46));
      const vt = (Number(row.ventas_tot || 0)) / m2scale;
      if (gk) productionByGeo.set(gk, (productionByGeo.get(gk) || 0) + vt);
      if (sk) productionBySector.set(sk, (productionBySector.get(sk) || 0) + vt);
    }
    result.productionByGeo    = productionByGeo;
    result.productionBySector = productionBySector;

    return result;
  }

  function renderSummary(metrics) {
    if (!summaryEl) return;
    const topGeo = Array.from(metrics.byGeoRaw.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topSector = Array.from(metrics.bySectorRaw.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ownLabel = s.perspective === "provider"
      ? (isEs() ? "Productores seleccionados" : "Selected producers")
      : (isEs() ? "Productores seleccionados" : "Selected producers");
    const baseLabel = s.question === "main"
      ? (s.perspective === "provider"
        ? (isEs() ? "Total filtrado de los productores seleccionados" : "Selected producers' filtered total")
        : (isEs() ? "Total filtrado de los productores seleccionados" : "Selected producers' filtered total"))
      : (s.perspective === "provider"
        ? (isEs() ? "Total filtrado de cada cliente visible" : "Each visible client's filtered total")
        : (isEs() ? "Total filtrado de cada proveedor visible" : "Each visible supplier's filtered total"));
    const detail = !s.summaryOpen ? "" : `
      <div class="selection-detail-grid">
        <div class="selection-detail-meta-item"><span class="selection-detail-meta-label">${escapeHtml(ownLabel)}</span><span class="selection-detail-meta-value">${escapeHtml(selectionCountLabel("geo", s.geoLevel, metrics.selfGeoCount))} · ${escapeHtml(selectionCountLabel("sector", s.sectorLevel, metrics.selfSectorCount))}</span></div>
        <div class="selection-detail-meta-item"><span class="selection-detail-meta-label">${escapeHtml(isEs() ? "Tipo de comercio" : "Trade type")}</span><span class="selection-detail-meta-value">${escapeHtml(describeExclusions())}</span></div>
        <div class="selection-detail-meta-item"><span class="selection-detail-meta-label">${escapeHtml(isEs() ? "Pregunta activa" : "Active question")}</span><span class="selection-detail-meta-value">${escapeHtml(currentQuestionLabel())}</span></div>
        <div class="selection-detail-meta-item"><span class="selection-detail-meta-label">${escapeHtml(isEs() ? "Lectura" : "Interpretation")}</span><span class="selection-detail-meta-value">${escapeHtml(describeQuestion())}</span></div>
        <div class="selection-detail-meta-item"><span class="selection-detail-meta-label">${escapeHtml(isEs() ? "Base de cálculo" : "Calculation base")}</span><span class="selection-detail-meta-value">${escapeHtml(baseLabel)}</span></div>
        <div class="selection-detail-column"><h4>${escapeHtml(isEs() ? `Principales ${aggregationLevelLabel("geo", s.geoLevel)} de contraparte` : `Top counterparty ${aggregationLevelLabel("geo", s.geoLevel)}`)}</h4>${topGeo.map(([key, value]) => `<div class="selection-detail-item"><span>${escapeHtml(key)}</span><em>${escapeHtml(formatUnitValue(value, "value"))}</em></div>`).join("")}</div>
        <div class="selection-detail-column"><h4>${escapeHtml(isEs() ? `Principales ${aggregationLevelLabel("sector", s.sectorLevel)} de contraparte` : `Top counterparty ${aggregationLevelLabel("sector", s.sectorLevel)}`)}</h4>${topSector.map(([key, value]) => `<div class="selection-detail-item"><span>${escapeHtml(sectorGroupLabel(key))}</span><em>${escapeHtml(formatUnitValue(value, "value"))}</em></div>`).join("")}</div>
      </div>`;
    const _flowNum = escapeHtml(formatValue(metrics.totalSelected, "value"));
    const _flowUnit = escapeHtml(currentUnitLabel("value"));
    const _flowIntro = isEs() ? "El flujo total de los productores seleccionados arriba." : "The total flow of the producers selected above.";
    summaryEl.innerHTML = `<div class="m3-flow-intro">${_flowIntro}</div><div class="m3-flow-num">${_flowNum} <span class="m3-flow-unit">${_flowUnit}</span></div>`;
  }

  function renderGeo(metrics) {
    const agg = Array.from(metrics.byGeoRaw.entries()).map(([key, raw]) => ({
      key,
      raw,
      display: displayMetric(raw, metrics.selfTotalRaw, metrics.benchmarkGeoTotals, key)
    }));
    const metricByProvince = new Map();
    if (s.geoLevel === "province") {
      agg.forEach((item) => {
        const loc = locations.find((d) => d.nom_provincia === item.key);
        if (loc) metricByProvince.set(String(loc.cod_provincia).padStart(3, "0"), item.display);
      });
    } else {
      const byGroup = new Map(agg.map((item) => [item.key, item.display]));
      locations.forEach((loc) => {
        const group = s.geoLevel === "region" ? loc.nom_region : loc.nom_macrozona;
        metricByProvince.set(String(loc.cod_provincia).padStart(3, "0"), byGroup.get(group) || 0);
      });
    }
    const _drawnCodes = new Set(geoFeatures.map((f) => f.properties.CUT_PROV));
    const values = Array.from(metricByProvince.entries()).filter(([c, v]) => v > 0 && _drawnCodes.has(c)).map(([, v]) => v);
    const _geoTotal = values.reduce((a, b) => a + b, 0);
    const _geoScaleVals = values.filter((v) => !window.NearZero.is(v, _geoTotal, window.NearZero.GEO_THR));
    const scale = buildWarmContinuousScale(_geoScaleVals.length ? _geoScaleVals : values);
    const colorForValue = scale?.colorForValue || (() => "#ffffff");
    if (window.RankRailKit) {
      RankRailKit.fill("module-3", "geo", isEs() ? "Territorios Top" : "Top territories",
        agg.filter((a) => a.display > 0).sort((x, y) => y.display - x.display)
          .map((a) => ({ name: a.key, valueText: formatValue(a.display, s.unit), color: colorForValue(a.display) })), lang(), currentUnitLabel(s.unit));
    }
    const _svgNode = document.getElementById("m3-map-chile");
    const _mH = Math.max(160, (_svgNode.closest(".map-stage") ? _svgNode.closest(".map-stage").clientHeight : 620) - 24);
    const _fc = { type: "FeatureCollection", features: geoFeatures };
    const svg = d3.select(_svgNode);
    svg.selectAll("*").remove();
    const projection = d3.geoMercator().fitExtent([[6, 6], [_mH - 6, _mH - 6]], _fc);
    const path = d3.geoPath(projection);
    let _geoAnyGray = false, _geoAnyZero = false;
    svg.selectAll("path")
      .data(geoFeatures)
      .enter()
      .append("path")
      .attr("class", "map-region")
      .attr("d", path)
      .attr("fill", (d) => {
        const value = metricByProvince.get(d.properties.CUT_PROV) || 0;
        if (value <= 0) { _geoAnyZero = true; return "#ffffff"; }
        if (window.NearZero.is(value, _geoTotal, window.NearZero.GEO_THR)) { _geoAnyGray = true; return window.NearZero.GRAY; }
        return colorForValue(value);
      })
      .attr("stroke", "rgba(34,30,124,0.32)")
      .attr("stroke-width", 1)
      .on("mouseenter", (event, d) => {
        const loc = provinceByCut.get(d.properties.CUT_PROV);
        if (!loc) return;
        const key = s.geoLevel === "macrozone" ? loc.nom_macrozona : s.geoLevel === "region" ? loc.nom_region : loc.nom_provincia;
        const item = agg.find((entry) => entry.key === key);
        const topMap = metrics.topSectorByGeo.get(key) || new Map();
        const caption = hoverCaption("sector");
        const geoPct = (sectorKey, value) => {
          const rowDisplay = displayMetric(value, metrics.selfTotalRaw, metrics.benchmarkCellTotals, `${key}|||${sectorKey}`);
          return rowDisplay;
        };
        const _mainRaw = item ? item.raw : 0; const _mainDisp = item ? item.display : 0; const _mainValStr = s.unit === "value" ? formatUnitValue(_mainDisp, s.unit) : formatUnitValue(_mainDisp, s.unit) + " (" + formatValue(_mainRaw, "value") + " " + currentUnitLabel("value") + ")";
        showHover(`<div class="hover-card-head"><div class="hover-card-name">${escapeHtml(key)}</div><div class="hover-card-value">${escapeHtml(_mainValStr)}</div></div><div class="hover-card-caption">${escapeHtml(caption)}</div>${Array.from(topMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([sectorKey, value]) => { const pctVal = geoPct(sectorKey, value); const dispVal = s.unit === "value"
              ? formatValue(value, "value") + " " + currentUnitLabel("value")
              : formatUnitValue(pctVal, s.unit) + " (" + formatValue(value, "value") + " " + currentUnitLabel("value") + ")";
            return `<div class="hover-card-item is-row"><span>${escapeHtml(sectorGroupLabel(sectorKey))}</span><em>${escapeHtml(dispVal)}</em></div>`; }).join("")}`, event.clientX, event.clientY);
      })
      .on("mousemove", (event) => { if (hoverCard?.classList.contains("is-visible") && !hoverPinned) showHover(hoverCard.innerHTML, event.clientX, event.clientY); })
      .on("mouseleave", hideHover)
      .on("click", (event, d) => {
        const loc = provinceByCut.get(d.properties.CUT_PROV);
        if (!loc) return;
        if (hoverPinned) { unpinHover(); return; }
        const capturedHtml = hoverCard.innerHTML;
        const capturedKey = s.geoLevel === "macrozone" ? loc.nom_macrozona : s.geoLevel === "region" ? loc.nom_region : loc.nom_provincia;
        pinHover(capturedHtml, event.clientX, event.clientY,
          () => buildGeoHoverHtml(capturedKey));
      });

    const legend = document.getElementById("m3-geo-legend");
    const _b = path.bounds(_fc), _pad = 4;
    _svgNode.setAttribute("viewBox", `${_b[0][0] - _pad} ${_b[0][1] - _pad} ${_b[1][0] - _b[0][0] + 2 * _pad} ${_b[1][1] - _b[0][1] + 2 * _pad}`);
    _svgNode.style.cssText = "display:block;height:100%;width:auto;max-width:100%";
    window.NearZero.updateLegend("m3-geo-nz-legend", _geoAnyGray, _geoAnyZero);
    if (!values.length) {
      legend.innerHTML = "";
      return;
    }
    const _lv = _geoScaleVals.length ? _geoScaleVals : values;
    const minValue = d3.min(_lv);
    const maxValue = d3.max(_lv);
    const samples = minValue === maxValue ? [minValue] : Array.from({ length: 6 }, (_, index) => minValue * Math.pow(maxValue / minValue, index / 5)).reverse();
    legend.innerHTML = `<div class="geo-legend-unit">${escapeHtml(currentUnitLabel(s.unit))}</div><div class="geo-legend-bar" aria-hidden="true"></div><div class="geo-legend-scale">${samples.map((value) => `<span>${escapeHtml(formatValue(value, s.unit))}</span>`).join("")}</div>`;
    window.attachLegendReadout?.(legend.querySelector(".geo-legend-bar"), minValue, maxValue, (v) => formatValue(v, s.unit));
    // Re-align reliably: the rebuilt legend bar has no height until aligned. rAF alone is throttled
    // when the module/tab is backgrounded, which left the bar collapsed; setTimeout fallbacks fire
    // regardless. align self-guards when the map isn't visible, so extra calls are safe no-ops.
    requestAnimationFrame(alignGeoLegendToMapM3);
    setTimeout(alignGeoLegendToMapM3, 0);
    setTimeout(alignGeoLegendToMapM3, 80);
    setTimeout(alignGeoLegendToMapM3, 240);
  }

  function renderSector(metrics) {
    const agg = Array.from(metrics.bySectorRaw.entries()).map(([key, raw]) => ({
      key,
      raw,
      display: displayMetric(raw, metrics.selfTotalRaw, metrics.benchmarkSectorTotals, key)
    })).sort((a, b) => b.display - a.display);
    const maxValue = d3.max(agg, (item) => item.display) || 1;
    if (window.RankRailKit) {
      const _secScale = buildWarmContinuousScale(agg.filter((a) => a.display > 0).map((a) => a.display));
      const _secCf = _secScale?.colorForValue || (() => "#cccccc");
      RankRailKit.fill("module-3", "sector", isEs() ? "Sectores Top" : "Top sectors",
        agg.filter((a) => a.display > 0).map((a) => {
          return { name: sectorGroupLabel(a.key), valueText: formatValue(a.display, s.unit), color: _secCf(a.display) };
        }), lang(), currentUnitLabel(s.unit));
    }
    const bars = section.querySelector("#m3-sector-bars");
    const barsUnitEl = section.querySelector("#m3-sector-bars-unit");
    if (barsUnitEl) barsUnitEl.textContent = currentUnitLabel(s.unit);
    const legend = section.querySelector("#m3-macro-legend");
    legend.innerHTML = allIndustries.map((item) => `<span><i style="background:${industryColorForCode(item.value)}"></i>${item.label}</span>`).join("");
    bars.innerHTML = agg.map((item) => {
      const meta = sectors.find((sec) => String(sec[sectorCodeFieldForLevel(s.sectorLevel)]) === String(item.key));
      const color = specialSectorLabels[String(item.key)] ? "rgba(34,30,124,0.35)" : industryColorForCode(meta?.cod_industria || item.key);
      return `<button class="m4d-bar-row" data-m3-sector="${escapeHtml(String(item.key))}" style="border:none;padding:0;cursor:pointer"><span class="m4d-bar-label" title="${escapeHtml(sectorGroupLabel(item.key))}">${escapeHtml(sectorGroupLabel(item.key))}</span><div class="m4d-bar-track"><span style="width:${Math.max(0.6, (item.display / maxValue) * 100).toFixed(1)}%; background:${color}"></span></div><strong class="m4d-bar-val">${escapeHtml(formatValue(item.display, s.unit))}</strong></button>`;
    }).join("");
    bars.querySelectorAll("[data-m3-sector]").forEach((node) => {
      node.addEventListener("mouseenter", (event) => {
        const key = node.getAttribute("data-m3-sector");
        const item = agg.find((entry) => String(entry.key) === String(key));
        const topMap = metrics.topGeoBySector.get(key) || new Map();
        const caption = hoverCaption("geo");
        const secPct = (geoKey, value) => {
          return displayMetric(value, metrics.selfTotalRaw, metrics.benchmarkCellTotals, `${geoKey}|||${key}`);
        };
        const _sMainRaw = item ? item.raw : 0; const _sMainDisp = item ? item.display : 0; const _sMainValStr = s.unit === "value" ? formatUnitValue(_sMainDisp, s.unit) : formatUnitValue(_sMainDisp, s.unit) + " (" + formatValue(_sMainRaw, "value") + " " + currentUnitLabel("value") + ")";
        showHover(`<div class="hover-card-head"><div class="hover-card-name">${escapeHtml(sectorGroupLabel(key))}</div><div class="hover-card-value">${escapeHtml(_sMainValStr)}</div></div><div class="hover-card-caption">${escapeHtml(caption)}</div>${Array.from(topMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([geoKey, value]) => { const pctVal = secPct(geoKey, value); const dispVal = s.unit === "value"
              ? formatValue(value, "value") + " " + currentUnitLabel("value")
              : formatUnitValue(pctVal, s.unit) + " (" + formatValue(value, "value") + " " + currentUnitLabel("value") + ")";
            return `<div class="hover-card-item is-row"><span>${escapeHtml(geoKey)}</span><em>${escapeHtml(dispVal)}</em></div>`; }).join("")}`, event.clientX, event.clientY);
      });
      node.addEventListener("mousemove", (event) => { if (hoverCard?.classList.contains("is-visible") && !hoverPinned) showHover(hoverCard.innerHTML, event.clientX, event.clientY); });
      node.addEventListener("mouseleave", hideHover);
      node.addEventListener("click", (event) => {
        if (hoverPinned) { unpinHover(); return; }
        const capturedKey = node.getAttribute("data-m3-sector");
        pinHover(hoverCard.innerHTML, event.clientX, event.clientY,
          () => buildSectorHoverHtml(capturedKey));
      });
    });
  }

  function renderMatrix(metrics) {
    const rowKeys = Array.from(new Set(Array.from(metrics.byCellRaw.keys()).map((key) => key.split("|||")[0]))).sort((a, b) => geoOrder(a) - geoOrder(b));
    const colKeys = Array.from(new Set(Array.from(metrics.byCellRaw.keys()).map((key) => key.split("|||")[1]))).sort((a, b) => sectorOrder(a) - sectorOrder(b));
    const rowTotals = new Map();
    const colTotals = new Map();
    const unitMap = new Map();
    metrics.byCellRaw.forEach((raw, key) => {
      const [rowKey, colKey] = key.split("|||");
      rowTotals.set(rowKey, (rowTotals.get(rowKey) || 0) + raw);
      colTotals.set(colKey, (colTotals.get(colKey) || 0) + raw);
      unitMap.set(key, displayMetric(raw, metrics.selfTotalRaw, metrics.benchmarkCellTotals, key));
    });

    const svg = document.getElementById("m3-matrix-svg");
    const figure = document.getElementById("m3-matrix-figure");
    const legend = document.getElementById("m3-matrix-legend");
    const values = Array.from(unitMap.values()).filter((value) => value > 0);
    const _matTotal = values.reduce((a, b) => a + b, 0);
    const _matScaleVals = values.filter((v) => !window.NearZero.is(v, _matTotal, window.NearZero.MATRIX_THR));
    const scale = buildWarmContinuousScale(_matScaleVals.length ? _matScaleVals : values);
    const colorForValue = scale?.colorForValue || (() => "#ffffff");
    if (window.RankRailKit) {
      const _cells = [];
      rowKeys.forEach((r) => colKeys.forEach((c) => { const v = unitMap.get(r + "|||" + c) || 0; if (v > 0) _cells.push([r + " \u00b7 " + sectorGroupLabel(c), v]); }));
      _cells.sort((a, b) => b[1] - a[1]);
      RankRailKit.fill("module-3", "matrix", isEs() ? "Combinaciones Top" : "Top combinations",
        _cells.map(([nm, v]) => ({ name: nm, valueText: formatValue(v, s.unit), color: colorForValue(v) })), lang(), currentUnitLabel(s.unit));
    }
    // El contenido de la leyenda (título + números) se construye ANTES de
    // reservar el ancho para el SVG, y no después: así "offsetWidth" mide el
    // ancho real de ESTE render (con el título/valores actuales), no el del
    // render anterior (que podía quedar desactualizado o en 0 si la leyenda
    // estaba oculta), evitando que quede recortada o se separe del heatmap.
    // Se reconstruye una segunda vez más abajo para alinear su alto exacto
    // con la grilla ya renderizada.
    if (values.length) {
      const _lvEarly = _matScaleVals.length ? _matScaleVals : values;
      const minEarly = d3.min(_lvEarly), maxEarly = d3.max(_lvEarly);
      const samplesEarly = minEarly === maxEarly ? [minEarly] : Array.from({ length: 6 }, (_, index) => minEarly * Math.pow(maxEarly / minEarly, index / 5)).reverse();
      legend.innerHTML = `<div class="matrix-legend-unit">${escapeHtml(currentUnitLabel(s.unit))}</div><div class="matrix-legend-bar-vertical" aria-hidden="true"></div><div class="matrix-legend-scale-vertical">${samplesEarly.map((value) => `<span>${escapeHtml(formatValue(value, s.unit))}</span>`).join("")}</div>`;
      // El título es position:absolute (no empuja la barra/números) y por eso
      // NO cuenta para el ancho del elemento flex (.matrix-figure centra
      // svg+leyenda como grupo); sin esto el título puede quedar recortado.
      const titleElEarly = legend.querySelector(".matrix-legend-unit");
      legend.style.minWidth = titleElEarly ? Math.ceil(titleElEarly.offsetWidth) + "px" : "";
    } else {
      legend.innerHTML = "";
    }
    const isMobileHeatmap = window.matchMedia && window.matchMedia("(max-width: 820px)").matches;
    const mobileContentScaleW = isMobileHeatmap ? 0.80 : 1;
    // La matriz se dimensiona contra el espacio útil disponible; en móvil
    // reducimos el ancho interno para que entre completa sin scroll.
    const panelWidth = isMobileHeatmap
      ? Math.max(376, figure.clientWidth || 0)
      : Math.max(320, figure.clientWidth || 900);
    const panelHeight = isMobileHeatmap
      ? Math.max(212, figure.clientHeight || 0)
      : Math.max(220, figure.clientHeight || 520);
    // ── Geometría idéntica al Módulo 4: celdas no cuadradas + viewBox ajustado
    //    al contenido + escala para llenar el cuadro (preserveAspectRatio meet). ──
    // OJO: la reserva usa SOLO el ancho del título (estable para una misma
    // unidad) y un piso fijo — nunca "legend.offsetWidth" del contenedor
    // completo, porque ese incluye la columna de números, que cambia de
    // ancho según los dígitos de cada nivel de agregación y volvería a hacer
    // que el SVG cambiara de tamaño al re-agrupar.
    const legendTitleW = legend?.querySelector(".matrix-legend-unit")?.offsetWidth || 0;
    const legendReserve = isMobileHeatmap ? 0 : 14 + Math.max(70, legendTitleW);
    const contW = Math.max(220, Math.floor((panelWidth - legendReserve) * mobileContentScaleW));
    const contH = Math.max(220, panelHeight - 14);
    const _fit = window.fitHeatmapGeometry({
      contW, contH, nRows: rowKeys.length, nCols: colKeys.length,
      rowLabels: rowKeys,
      colLabels: colKeys.map((c) => isMobileHeatmap && window.heatmapAxisLabelShort ? window.heatmapAxisLabelShort(sectorGroupLabel(c)) : sectorGroupLabel(c)),
      rotDeg: isMobileHeatmap ? 82 : 66,
      leftPadMin: isMobileHeatmap ? 64 : undefined,
      bottomPadMin: isMobileHeatmap ? 84 : undefined,
      rowFamily: "Verdana, Geneva, sans-serif", colFamily: "Verdana, Geneva, sans-serif",
    });
    const leftLabelWidth = _fit.LP;
    const bottomLabelHeight = _fit.BP;
    const topPad = _fit.TP;
    const cellH = _fit.CH;
    const cellW = _fit.CW;
    const gridWidth = colKeys.length * cellW;
    const gridHeight = rowKeys.length * cellH;
    // offsetX/offsetY centran la grilla (posiblemente más chica que el
    // recuadro fijo, por el aspecto casi-cuadrado de las celdas) dentro del
    // mismo recuadro; el SVG exterior no cambia de tamaño.
    const gridLeft = leftLabelWidth + (_fit.offsetX || 0);
    const gridTop = topPad + (_fit.offsetY || 0);
    const gridBottom = gridTop + gridHeight;
    const legendGap = 14;
    const legendLeft = gridLeft + gridWidth + legendGap;
    const svgWidth = _fit.svgWidth;
    const svgHeight = _fit.svgHeight;
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // El SVG se dibuja 1:1 (viewBox == px) para que el ÁREA DE CELDAS conserve
    // siempre el mismo tamaño en pantalla; al cambiar de agrupación sólo crecen
    // o se encogen las celdas, no el recuadro. La geometría de la grilla se
    // publica en dataset para que la leyenda mida exactamente su alto.
    svg.dataset.gridTop = gridTop;
    svg.dataset.gridHeight = gridHeight;
    svg.style.cssText = `display:block;overflow:visible;align-self:flex-start;width:${Math.round(svgWidth)}px;height:${Math.round(svgHeight)}px`;

    const parts = [];
    // Tamaño de letra dinámico (mismo estándar que M4)
    const _rowFs = _fit.rowFs;
    const _colFs = _fit.colFs;
    let _matAnyGray = false, _matAnyZero = false;
    rowKeys.forEach((rowKey, r) => {
      const y = gridTop + r * cellH;
      parts.push(`<text class="matrix-row-label" x="${gridLeft - 6}" y="${y + cellH / 2}" style="font-size:${_rowFs}px">${escapeHtml(rowKey)}</text>`);
      colKeys.forEach((colKey, c) => {
        const x = gridLeft + c * cellW;
        const key = `${rowKey}|||${colKey}`;
        const value = unitMap.get(key) || 0;
        const isNearZero = value > 0 && window.NearZero.is(value, _matTotal, window.NearZero.MATRIX_THR);
        if (value <= 0) _matAnyZero = true;
        if (isNearZero) _matAnyGray = true;
        const _f = value <= 0 ? "#ffffff" : (isNearZero ? window.NearZero.GRAY : colorForValue(value));
        parts.push(`<rect class="matrix-cell${value > 0 ? "" : " is-empty"}" data-row="${escapeHtml(rowKey)}" data-col="${escapeHtml(colKey)}" x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${_f}"></rect>`);
      });
    });
    window.NearZero.updateLegend("m3-matrix-nz-legend", _matAnyGray, _matAnyZero);
      const labelRotation = isMobileHeatmap ? -82 : -66;
    colKeys.forEach((colKey, c) => {
      const labelX = gridLeft + (c + 1) * cellW - 1;
      const labelY = gridBottom + 3;
      const fullLabel = sectorGroupLabel(colKey);
      const dispLabel = isMobileHeatmap && window.heatmapAxisLabelShort ? window.heatmapAxisLabelShort(fullLabel) : fullLabel;
      parts.push(`<text class="matrix-col-label" x="${labelX}" y="${labelY}" transform="rotate(${labelRotation} ${labelX} ${labelY})" style="font-size:${_colFs}px"><title>${escapeHtml(fullLabel)}</title>${escapeHtml(dispLabel)}</text>`);
    });
    svg.innerHTML = parts.join("");
    svg.querySelectorAll(".matrix-cell").forEach((node) => {
      node.addEventListener("mouseenter", (event) => {
        const rowKey = node.getAttribute("data-row");
        const colKey = node.getAttribute("data-col");
        const key = `${rowKey}|||${colKey}`;
        const raw = metrics.byCellRaw.get(key) || 0;
        const display = unitMap.get(key) || 0;
        const rowShare = rowTotals.get(rowKey) ? raw / rowTotals.get(rowKey) : 0;
        const colShare = colTotals.get(colKey) ? raw / colTotals.get(colKey) : 0;
        showHover(`<div class="hover-card-head"><div class="hover-card-name">${escapeHtml(rowKey)} - ${escapeHtml(sectorGroupLabel(colKey))}</div><div class="hover-card-value">${escapeHtml(formatUnitValue(display, s.unit))}</div></div><div class="hover-card-metrics"><div class="hover-card-metric"><span>${escapeHtml(isEs() ? `Participación en ${rowKey}` : `Share within ${rowKey}`)}</span><strong>${escapeHtml(formatValue(rowShare, "share"))}</strong></div><div class="hover-card-metric"><span>${escapeHtml(isEs() ? `Participación en ${sectorGroupLabel(colKey)}` : `Share within ${sectorGroupLabel(colKey)}`)}</span><strong>${escapeHtml(formatValue(colShare, "share"))}</strong></div></div>`, event.clientX, event.clientY);
      });
      node.addEventListener("mousemove", (event) => { if (hoverCard?.classList.contains("is-visible") && !hoverPinned) showHover(hoverCard.innerHTML, event.clientX, event.clientY); });
      node.addEventListener("mouseleave", hideHover);
      node.addEventListener("click", (event) => {
        if (hoverPinned) { unpinHover(); return; }
        const capturedRow = node.getAttribute("data-row");
        const capturedCol = node.getAttribute("data-col");
        pinHover(hoverCard.innerHTML, event.clientX, event.clientY,
          () => buildMatrixHoverHtml(capturedRow, capturedCol));
      });
    });

    if (values.length) {
      const _lv = _matScaleVals.length ? _matScaleVals : values;
      const minValue = d3.min(_lv);
      const maxValue = d3.max(_lv);
      const samples = minValue === maxValue ? [minValue] : Array.from({ length: 6 }, (_, index) => minValue * Math.pow(maxValue / minValue, index / 5)).reverse();
      legend.innerHTML = `<div class="matrix-legend-unit">${escapeHtml(currentUnitLabel(s.unit))}</div><div class="matrix-legend-bar-vertical" aria-hidden="true"></div><div class="matrix-legend-scale-vertical">${samples.map((value) => `<span>${escapeHtml(formatValue(value, s.unit))}</span>`).join("")}</div>`;
      window.attachLegendReadout?.(legend.querySelector(".matrix-legend-bar-vertical"), minValue, maxValue, (v) => formatValue(v, s.unit));
      // El título es position:absolute (no empuja la barra/números) y por eso
      // NO cuenta para el ancho del elemento flex; sin esto el título puede
      // quedar recortado por fuera del contenedor.
      const titleEl = legend.querySelector(".matrix-legend-unit");
      legend.style.minWidth = titleEl ? Math.ceil(titleEl.offsetWidth) + "px" : "";
      // La leyenda es hermana flex del SVG (CSS .matrix-figure): el conjunto
      // svg+leyenda se centra como una unidad y la barra queda pegada al
      // heatmap. Igualamos su alto al alto REAL renderizado del SVG mediante el
      // helper compartido robusto (mismo criterio en M2/M3/M4).
      window.syncMatrixLegendHeight?.(legend, svg);
    } else {
      legend.innerHTML = "";
    }
  }


  function renderKpiBlock(kpi) {
    const block = section.querySelector("#m3-kpi-block");
    if (!block) return;
    const fmt = (v) => formatValue(v, "clp"); // econRows already in CLP display unit
    // Enrich kpi with module2 economic accounts (econRows)
    const m2rows = window.module2Data?.econRows;
    if (m2rows && m2rows.length) {
      const selfGeoSet = selectedGeoCodes(s.selfGeo);
      const selfSectorSet = selectedSectorCodes(s.selfSector);
      let ventas_tot=0, ventas_mat=0, ventas_con=0, ventas_int_exp=0, material_tot=0, material_nac=0, material_int=0;
      // econRows values are in raw CLP pesos; divide by 1e12 to get Billones de CLP
      // Supply-use identity: ventas_tot + material_int = ventas_mat + ventas_con + exportacion
      // (production + imports = intermediate domestic use + final domestic demand + exports)
      // Also: ventas_mat = material_nac (symmetric I-O national balance)
      const scale = 1e12;
      m2rows.forEach(row => {
        const geo = Number(row.cod_ubicacion ?? 0);
        const sec = Number(row.cod_sector ?? 0);
        if (!selfGeoSet.has(geo) || !selfSectorSet.has(sec)) return;
        ventas_tot   += Number(row.ventas_tot   ?? 0);
        ventas_mat   += Number(row.ventas_mat   ?? 0); // intermediate domestic sales = material_nac
        ventas_con   += Number(row.ventas_con   ?? 0); // final domestic demand
        ventas_int_exp += Number(row.ventas_int ?? 0); // ventas_int = exportaciones
        material_tot += Number(row.material_tot ?? 0);
        material_nac += Number(row.material_nac ?? 0);
        material_int += Number(row.material_int ?? 0); // imported inputs
      });
      if (ventas_tot > 0) {
        kpi.vendorTotal       = ventas_tot   / scale;
        kpi.vendorIntermedNac = ventas_mat   / scale; // = material_nac by I-O identity
        kpi.vendorExport      = ventas_int_exp / scale;
        kpi.vendorFinalDemand = ventas_con   / scale;
        kpi.clientTotal       = material_tot / scale;
        kpi.clientNac         = material_nac / scale;
        kpi.clientImport      = material_int / scale;
      }
    }
    const es = isEs();
    block.innerHTML = `
      <div class="m3-kpi-row">
        <div class="m3-kpi-row-label">${es ? "Ventas totales / Producción bruta" : "Total sales / Gross output"}</div>
        <div class="m3-kpi-row-val">${fmt(kpi.vendorTotal)} ${currentUnitLabel("value")}</div>
        <div class="m3-kpi-subs">
          <div class="m3-kpi-sub-row"><span class="m3-kpi-sub-label">${es ? "Ventas intermedias nacionales" : "Domestic intermediate sales"}</span><span class="m3-kpi-sub-val">${fmt(kpi.vendorIntermedNac)}</span></div>
          <div class="m3-kpi-sub-row"><span class="m3-kpi-sub-label">${es ? "Ventas a demanda final nacional" : "Domestic final demand sales"}</span><span class="m3-kpi-sub-val">${fmt(kpi.vendorFinalDemand)}</span></div>
          <div class="m3-kpi-sub-row"><span class="m3-kpi-sub-label">${es ? "Exportaciones" : "Exports"}</span><span class="m3-kpi-sub-val">${fmt(kpi.vendorExport)}</span></div>
        </div>
      </div>
      <div class="m3-kpi-divider"></div>
      <div class="m3-kpi-row">
        <div class="m3-kpi-row-label">${es ? "Materiales / Insumos totales" : "Total inputs / Materials"}</div>
        <div class="m3-kpi-row-val">${fmt(kpi.clientTotal)} ${currentUnitLabel("value")}</div>
        <div class="m3-kpi-subs">
          <div class="m3-kpi-sub-row"><span class="m3-kpi-sub-label">${es ? "Materiales nacionales" : "Domestic materials"}</span><span class="m3-kpi-sub-val">${fmt(kpi.clientNac)}</span></div>
          <div class="m3-kpi-sub-row"><span class="m3-kpi-sub-label">${es ? "Importaciones" : "Imports"}</span><span class="m3-kpi-sub-val">${fmt(kpi.clientImport)}</span></div>
        </div>
      </div>
    `;
  }

  function hoverCaption(axis) {
    const perspLabel = s.perspective === "provider"
      ? (isEs() ? "Clientes" : "Clients")
      : (isEs() ? "Proveedores" : "Suppliers");
    if (s.unit === "value")             return isEs() ? `${perspLabel} · Billones de CLP`  : `${perspLabel} · MUSD$`;
    if (s.unit === "share_flow")        return isEs() ? `${perspLabel} · % flujo`           : `${perspLabel} · % flow`;
    if (s.unit === "share_production")  return isEs() ? `${perspLabel} · % producción`      : `${perspLabel} · % output`;
    if (s.unit === "share_counterpart") return isEs() ? `${perspLabel} · % contraparte`     : `${perspLabel} · % counterpart`;
    return perspLabel;
  }

  function buildGeoHoverHtml(key) {
    if (!metrics) return null;
    const item = Array.from(metrics.byGeoRaw.entries()).find(([k]) => k === key);
    const raw = item ? item[1] : 0;
    const display = displayMetric(raw, metrics.selfTotalRaw, metrics.benchmarkGeoTotals, key);
    const topMap = metrics.topSectorByGeo.get(key) || new Map();
    const topRows = Array.from(topMap.entries()).sort((a,b) => b[1]-a[1]).slice(0,5);
    const caption = hoverCaption("sector");
    const pctRows = topRows.map(([sk, v]) => {
      const rowDisplay = displayMetric(v, metrics.selfTotalRaw, metrics.benchmarkCellTotals, `${key}|||${sk}`);
      const valStr = s.unit === "value"
        ? formatValue(v, "value") + " " + currentUnitLabel("value")
        : formatUnitValue(rowDisplay, s.unit) + " (" + formatValue(v, "value") + " " + currentUnitLabel("value") + ")";
      return `<div class="hover-card-item is-row"><span>${escapeHtml(sectorGroupLabel(sk))}</span><em>${escapeHtml(valStr)}</em></div>`;
    }).join("");
    const geoTail = topRows.length ? '<div class="hover-card-caption">' + escapeHtml(caption) + '</div><div class="hover-card-metrics">' + pctRows + '</div>' : '';
    const geoMainVal = s.unit === "value" ? formatUnitValue(display, s.unit) : formatUnitValue(display, s.unit) + " (" + formatValue(raw, "value") + " " + currentUnitLabel("value") + ")";
    return '<div class="hover-card-head"><div class="hover-card-name">' + escapeHtml(key) + '</div><div class="hover-card-value">' + escapeHtml(geoMainVal) + '</div></div>' + geoTail;
  }

  function buildSectorHoverHtml(key) {
    const metrics = _lastMetrics;
    if (!metrics) return null;
    const raw = metrics.bySectorRaw.get(String(key)) || 0;
    const display = displayMetric(raw, metrics.selfTotalRaw, metrics.benchmarkSectorTotals, key);
    const topMap = metrics.topGeoBySector.get(String(key)) || new Map();
    const topRows = Array.from(topMap.entries()).sort((a,b) => b[1]-a[1]).slice(0,5);
    const caption = hoverCaption("geo");
    const pctRows = topRows.map(([gk, v]) => {
      const rowDisplay = displayMetric(v, metrics.selfTotalRaw, metrics.benchmarkCellTotals, `${gk}|||${key}`);
      const valStr = s.unit === "value"
        ? formatValue(v, "value") + " " + currentUnitLabel("value")
        : formatUnitValue(rowDisplay, s.unit) + " (" + formatValue(v, "value") + " " + currentUnitLabel("value") + ")";
      return `<div class="hover-card-item is-row"><span>${escapeHtml(gk)}</span><em>${escapeHtml(valStr)}</em></div>`;
    }).join("");
    const secTail = topRows.length ? '<div class="hover-card-caption">' + escapeHtml(caption) + '</div><div class="hover-card-metrics">' + pctRows + '</div>' : '';
    const secMainVal = s.unit === "value" ? formatUnitValue(display, s.unit) : formatUnitValue(display, s.unit) + " (" + formatValue(raw, "value") + " " + currentUnitLabel("value") + ")";
    return '<div class="hover-card-head"><div class="hover-card-name">' + escapeHtml(sectorGroupLabel(key)) + '</div><div class="hover-card-value">' + escapeHtml(secMainVal) + '</div></div>' + secTail;
  }

  function buildMatrixHoverHtml(rowKey, colKey) {
    const metrics = _lastMetrics;
    if (!metrics) return null;
    const key = `${rowKey}|||${colKey}`;
    const raw = metrics.byCellRaw.get(key) || 0;
    const display = displayMetric(raw, metrics.selfTotalRaw, metrics.benchmarkCellTotals, key);
    // Row/col totals from byCellRaw
    let rowTotal = 0, colTotal = 0;
    metrics.byCellRaw.forEach((v, k) => {
      const [r,c] = k.split("|||");
      if (r === rowKey) rowTotal += v;
      if (c === colKey) colTotal += v;
    });
    const rowShare = rowTotal > 0 ? raw / rowTotal : 0;
    const colShare = colTotal > 0 ? raw / colTotal : 0;
    return `<div class="hover-card-head"><div class="hover-card-name">${escapeHtml(rowKey)} - ${escapeHtml(sectorGroupLabel(colKey))}</div><div class="hover-card-value">${escapeHtml(formatUnitValue(display, s.unit))}</div></div><div class="hover-card-metrics"><div class="hover-card-metric"><span>${escapeHtml(isEs() ? `Participación en ${rowKey}` : `Share within ${rowKey}`)}</span><strong>${escapeHtml(formatValue(rowShare, "share"))}</strong></div><div class="hover-card-metric"><span>${escapeHtml(isEs() ? `Participación en ${sectorGroupLabel(colKey)}` : `Share within ${sectorGroupLabel(colKey)}`)}</span><strong>${escapeHtml(formatValue(colShare, "share"))}</strong></div></div>`;
  }

  function renderAll() {
    const metrics = computeMetrics();
    _lastMetrics = metrics;
    renderSummary(metrics);
    // Will call refreshPinnedHover after sub-renders
    renderKpiBlock(metrics.kpi);
    renderGeo(metrics);
    renderSector(metrics);
    renderMatrix(metrics);
  }
  window.module3RenderAll = renderAll;

  summaryEl?.addEventListener("click", (event) => {
    if (!event.target.closest(".selection-summary-head")) return;
    s.summaryOpen = !s.summaryOpen;
    const _m = computeMetrics();
    renderSummary(_m);
    renderKpiBlock(_m.kpi);
  });

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    s.view = tab.dataset.module3View;
    tabs.forEach((node) => node.classList.toggle("active", node === tab));
    panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.module3ViewPanel === s.view));
    if (s.view === "matrix") {
      renderAll();
    } else if (s.view === "geo") {
      // Re-fit the map and re-align the legend now that the panel is visible again, so neither
      // keeps a stale (collapsed) size from when the tab was hidden. setTimeout (not rAF) so it
      // fires reliably even when the tab/window was backgrounded.
      renderGeo(_lastMetrics || computeMetrics());
      setTimeout(alignGeoLegendToMapM3, 0);
      setTimeout(alignGeoLegendToMapM3, 60);
      setTimeout(alignGeoLegendToMapM3, 220);
    }
  }));

  perspectiveSelect?.addEventListener("change", (event) => {
    s.perspective = event.target.value;
    syncLanguage();
    renderAll();
  });
  function syncUnitForQuestion() {
    if (s.question === "relevance") {
      s.unit = "share";
      if (unitSelect) unitSelect.value = "share";
    }
    if (unitSelect) unitSelect.options[0].disabled = s.question === "relevance";
  }
  questionSelect?.addEventListener("change", (event) => {
    s.question = event.target.value;
    syncUnitForQuestion();
    renderAll();
  });
  unitSelect?.addEventListener("change", (event) => {
    s.unit = event.target.value;
    renderAll();
  });
  geoLevelControls.forEach((select) => select.addEventListener("change", (event) => {
    s.geoLevel = event.target.value;
    geoLevelControls.forEach((node) => { node.value = s.geoLevel; });
    renderAll();
  }));
  sectorLevelControls.forEach((select) => select.addEventListener("change", (event) => {
    s.sectorLevel = event.target.value;
    sectorLevelControls.forEach((node) => { node.value = s.sectorLevel; });
    renderAll();
  }));

  filterStack?.addEventListener("click", (event) => {
    const action = event.target.closest("[data-m3-filter-action]");
    if (!action) return;
    const act = action.dataset.m3FilterAction;
    if (act === "all-self-geo") s.selfGeo = { macrozone: [...allMacrozones], region: [...allRegions], province: [...allProvinces] };
    if (act === "clear-self-geo") s.selfGeo = { macrozone: [], region: [], province: [] };
    if (act === "all-self-sector") s.selfSector = { industry: allIndustries.map((d) => d.value), pibr13: allPibr13.map((d) => d.value), activity: allActivities.map((d) => d.value) };
    if (act === "clear-self-sector") s.selfSector = { industry: [], pibr13: [], activity: [] };
    if (act === "all-exclusions") s.exclusions = { selfMarket: true };
    if (act === "clear-exclusions") s.exclusions = { selfMarket: false };
    syncExclusionControls();
    renderFilters();
    renderAll();
  });

  // Also listen for exclusion checkboxes on the whole m3-panel (outside filter-stack)
  section.querySelector(".m3-panel, .control-bar.np-panel")?.addEventListener("change", (event) => {
    const exclusion = event.target.closest("input[type='checkbox'][data-m3-exclusion]");
    if (!exclusion) return;
    const key = exclusion.dataset.m3Exclusion;
    if (key === "self-market") s.exclusions.selfMarket = exclusion.checked;
    if (key === "export-import") s.exclusions.exportImport = exclusion.checked;
    if (key === "final-demand") s.exclusions.finalDemand = exclusion.checked;
    syncExclusionControls();
    renderAll();
  });

  // Trade scope buttons (level 1)
  const m3TradeSubRow = section.querySelector("#m3-trade-sub");
  section.querySelectorAll("[data-m3-trade]").forEach((btn) => {
    btn.addEventListener("click", () => {
      s.tradeScope = btn.dataset.m3Trade;
      section.querySelectorAll("[data-m3-trade]").forEach((b) => {
        b.classList.toggle("active", b.dataset.m3Trade === s.tradeScope);
      });
      // Show sub-row only for domestic
      if (m3TradeSubRow) {
        m3TradeSubRow.style.display = s.tradeScope === "domestic" ? "block" : "none";
        // Reset sub-btn to "all domestic" when switching to domestic
        section.querySelectorAll("[data-m3-trade-sub]").forEach((b) => {
          b.classList.toggle("active", b.dataset.m3TradeSub === "domestic");
        });
      }
      renderAll();
    });
  });

  // Reset all sub-states to "include"
  function resetSubStates() {
    s.subState = { intranode: "include", intraprov: "include", intrareg: "include", interreg: "include" };
    section.querySelectorAll("[data-m3-subtoggle][data-state]").forEach((b) => {
      b.classList.toggle("active", b.dataset.state === "include");
    });
    renderAll();
  }
  section.querySelector("#m3-subtoggle-reset")?.addEventListener("click", resetSubStates);

  // Domestic sub-type 3-state buttons (include / solo / exclude)
  section.querySelectorAll("[data-m3-subtoggle][data-state]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key      = btn.dataset.m3Subtoggle;
      const newState = btn.dataset.state; // "include" | "solo" | "exclude"
      s.subState[key] = newState;
      // Sync all state buttons — activate only the selected state per key
      section.querySelectorAll("[data-m3-subtoggle]").forEach((b) => {
        const match = b.dataset.m3Subtoggle === key && b.dataset.state === newState;
        b.classList.toggle("active", match);
      });
      renderAll();
    });
  });

  filterStack?.addEventListener("change", (event) => {
    const exclusion = event.target.closest("input[type='checkbox'][data-m3-exclusion]");
    if (exclusion) {
      const key = exclusion.dataset.m3Exclusion;
      if (key === "self-market") s.exclusions.selfMarket = exclusion.checked;
      if (key === "export-import") s.exclusions.exportImport = exclusion.checked;
      if (key === "final-demand") s.exclusions.finalDemand = exclusion.checked;
      syncExclusionControls();
      renderAll();
      return;
    }
    const input = event.target.closest("input[type='checkbox'][data-filter-group]");
    if (!input) return;
    const group = input.dataset.filterGroup;
    const target = group.startsWith("m3-self-")
      ? (group.includes("-geo-") ? s.selfGeo : s.selfSector)
      : null;
    if (!target) return;
    if (group.endsWith("macrozone")) target.macrozone = updateSelectionList(target.macrozone, input.value, input.checked);
    if (group.endsWith("region")) target.region = updateSelectionList(target.region, input.value, input.checked);
    if (group.endsWith("province")) target.province = updateSelectionList(target.province, input.value, input.checked);
    if (group.endsWith("industry")) target.industry = updateSelectionList(target.industry, input.value, input.checked);
    if (group.endsWith("pibr13")) target.pibr13 = updateSelectionList(target.pibr13, input.value, input.checked);
    if (group.endsWith("activity")) target.activity = updateSelectionList(target.activity, input.value, input.checked);
    renderFilters();
    renderAll();
  });

  [perspectiveSelect, questionSelect, unitSelect].forEach((node, index) => {
    const message = () => {
      if (index === 0) {
        return s.perspective === "provider"
          ? (isEs() ? "La selección propia representa proveedores. Las exclusiones ajustan el universo de transacciones." : "Own selection represents suppliers. Exclusions adjust the transaction universe.")
          : (isEs() ? "La selección propia representa clientes. Las exclusiones ajustan el universo de transacciones." : "Own selection represents clients. Exclusions adjust the transaction universe.");
      }
      if (index === 1) return describeQuestion();
      return describeUnit();
    };
    node?.addEventListener("mouseenter", () => showFloatingControlHelp(message(), node));
    node?.addEventListener("mouseleave", hideFloatingControlHelp);
  });

  // ── Wire custom UI buttons to hidden selects ──
  section.querySelectorAll('[data-m3-persp]').forEach(btn => {
    btn.addEventListener('click', () => {
      s.perspective = btn.dataset.m3Persp;
      section.querySelectorAll('[data-m3-persp]').forEach(b => b.classList.toggle('active', b === btn));
      if (perspectiveSelect) perspectiveSelect.value = s.perspective;
      syncLanguage();
      renderAll();
    });
  });

  section.querySelectorAll('[data-m3-unit]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      s.unit = btn.dataset.m3Unit;
      section.querySelectorAll('[data-m3-unit]').forEach(b => b.classList.toggle('active', b === btn));
      if (unitSelect) unitSelect.value = s.unit;
      renderAll();
    });
  });

  section.querySelectorAll('[data-m3-q]').forEach(btn => {
    btn.addEventListener('click', () => {
      s.question = btn.dataset.m3Q;
      section.querySelectorAll('[data-m3-q]').forEach(b => b.classList.toggle('active', b === btn));
      if (questionSelect) questionSelect.value = s.question;
      // Relevance forces share
      if (s.question === 'relevance') {
        s.unit = 'share';
        section.querySelectorAll('[data-m3-unit]').forEach(b => {
          b.classList.toggle('active', b.dataset.m3Unit === 'share');
          if (b.dataset.m3Unit === 'value') { b.disabled = true; b.style.opacity = '0.35'; b.style.cursor = 'not-allowed'; }
        });
        if (unitSelect) unitSelect.value = 'share';
      } else {
        section.querySelectorAll('[data-m3-unit]').forEach(b => {
          b.disabled = false; b.style.opacity = ''; b.style.cursor = '';
          b.classList.toggle('active', b.dataset.m3Unit === s.unit);
        });
      }
      renderAll();
    });
  });

  section.querySelectorAll('[data-m3-geo-agg]').forEach(btn => {
    btn.addEventListener('click', () => {
      s.geoLevel = btn.dataset.m3GeoAgg;
      section.querySelectorAll('[data-m3-geo-agg]').forEach(b => b.classList.toggle('active', b === btn));
      geoLevelControls.forEach(sel => { if (sel) sel.value = s.geoLevel; });
      renderAll();
    });
  });

  section.querySelectorAll('[data-m3-sec-agg]').forEach(btn => {
    btn.addEventListener('click', () => {
      s.sectorLevel = btn.dataset.m3SecAgg;
      section.querySelectorAll('[data-m3-sec-agg]').forEach(b => b.classList.toggle('active', b === btn));
      sectorLevelControls.forEach(sel => { if (sel) sel.value = s.sectorLevel; });
      renderAll();
    });
  });

  const baseApplyLanguage = applyLanguage;
  applyLanguage = function(nextLang) {
    baseApplyLanguage(nextLang);
    syncLanguage();
    m3TreeSelectGeo?.setLang();
    // Los nombres de sector/industria/actividad tienen version _eng: hay que
    // reconstruir el arbol (no solo los checks, que ya actualiza refresh()).
    m3TreeSelectSector?.setTree(buildM3SectorTree());
    m3TreeSelectSector?.setLang();
    renderFilters();
    renderAll();
  };

  // Re-align geo legend and matrix legend on resize
  let _m3ResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(_m3ResizeTimer);
    _m3ResizeTimer = setTimeout(() => {
      alignGeoLegendToMapM3();
      const matrixPanel = section.querySelector("[data-module3-view-panel='matrix']");
      if (matrixPanel && (matrixPanel.classList.contains("is-active") || matrixPanel.style.display !== "none")) {
        renderAll();
      }
    }, 120);
  }, { passive: true });

  // Keep the geo legend locked to the map's rendered size: re-align whenever the map or its
  // container changes size (tab switches, panel changes, window resizes), so the legend never
  // keeps a stale/collapsed height when returning to the map tab.
  if (window.ResizeObserver) {
    const _m3MapStage = section.querySelector(".module-three-view[data-module3-view-panel=\"geo\"] .map-stage");
    const _m3MapSvg = document.getElementById("m3-map-chile");
    if (_m3MapStage && _m3MapSvg) {
      let _m3AlignTimer = null;
      const _m3MapRo = new ResizeObserver(() => {
        if (_m3AlignTimer) clearTimeout(_m3AlignTimer);
        _m3AlignTimer = setTimeout(alignGeoLegendToMapM3, 50);
      });
      _m3MapRo.observe(_m3MapStage);
      _m3MapRo.observe(_m3MapSvg);
    }
  }

  // Re-render matrix when the figure container changes size (e.g. on initial layout expansion)
  const _m3MatrixFig = section.querySelector("#m3-matrix-figure");
  if (_m3MatrixFig && window.ResizeObserver) {
    let _m3RoInit = true;
    const _m3Ro = new ResizeObserver(() => {
      if (_m3RoInit) { _m3RoInit = false; return; } // skip first call (initial render)
      clearTimeout(_m3ResizeTimer);
      _m3ResizeTimer = setTimeout(() => {
        const matrixPanel = section.querySelector("[data-module3-view-panel='matrix']");
        if (matrixPanel && (matrixPanel.classList.contains("is-active") || matrixPanel.style.display !== "none")) {
          renderAll();
        }
      }, 80);
    });
    _m3Ro.observe(_m3MatrixFig);
  }

  syncLanguage();
  syncUnitForQuestion();
  s.selfGeo = { macrozone: [...allMacrozones], region: [...allRegions], province: [...allProvinces] };
  s.selfSector = { industry: allIndustries.map((d) => d.value), pibr13: allPibr13.map((d) => d.value), activity: allActivities.map((d) => d.value) };
  syncExclusionControls();
  renderFilters();
  renderAll();
  }).catch((error) => {
    console.error("module3 data load failed", error);
  });
})();
