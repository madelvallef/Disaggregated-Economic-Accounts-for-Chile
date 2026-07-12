/* ── Módulo 4 · Motor de cálculo y render (Exposición territorial/sectorial) ──
   Centrado en un productor j (ubicación × sector). Calcula en vivo, desde la
   inversa de Leontief doméstica, la exposición de toda la economía a j y su
   descomposición Total / Propio / Directo / Indirecto.

   Modelo (ver cabecera de spatial_io_network_data.js):
     Total[j,i]   = beta[i]·psi[i*N+j]        (contribución de la cadena i a λⱼ)
     Directo[j,i] = beta[i]·ad[i*N+j]          (vínculo de una etapa)
     Propio       = beta[j]                     (término identidad, i==j)
     Indirecto    = Total − Directo − Propio
     λⱼ = go[j]/gdp = Σᵢ Total[j,i]
   Las grillas se expresan como participación de λⱼ (suman 100%). */
(function () {
  function init(nd) {
    const N = nd.nodeCount, psi = nd.psi, ad = nd.ad, beta = nd.beta, nodes = nd.nodes;

    // ── Dominios geográfico y sectorial ──────────────────────────────────
    const domesticLocs = locations.filter(l => Number(l.cod_ubicacion) !== 57);
    const provinceList = uniqueSorted(domesticLocs, "nom_provincia", "cod_provincia_sort");
    const regionList   = uniqueSorted(domesticLocs, "nom_region",    "cod_region_sort");
    const macroList    = uniqueSorted(domesticLocs, "nom_macrozona", "cod_region_sort");
    const provinceIdx  = new Map(provinceList.map((p, i) => [p, i]));
    const locByUbic    = new Map(locations.map(l => [String(l.cod_ubicacion).padStart(2, "0"), l]));

    const activityOpts = uniqueSectorOptions("activity", sectors);
    const pibr13Opts   = uniqueSectorOptions("pibr13", sectors);
    const industryOpts = uniqueSectorOptions("industry", sectors);
    const activityList = activityOpts.map(d => String(d.value));   // códigos
    const activityIdx  = new Map(activityList.map((a, i) => [a, i]));
    const sectorMeta   = new Map(sectors.map(s => [Number(s.cod_SECTOR46), s]));

    const NROWS = provinceList.length;   // 56
    const NCOLS = activityList.length;   // 46

    // Mapas provincia→región→macrozona y actividad→pibr13→industria
    const provToRegion = new Map(), provToMacro = new Map();
    domesticLocs.forEach(l => { provToRegion.set(l.nom_provincia, l.nom_region); provToMacro.set(l.nom_provincia, l.nom_macrozona); });
    const actToPibr13 = new Map(), actToIndustry = new Map(), actToIndName = new Map();
    sectors.forEach(s => {
      const a = String(s.cod_SECTOR46);
      actToPibr13.set(a, String(s.cod_PIBR13));
      actToIndustry.set(a, String(s.cod_industria));
      actToIndName.set(a, s.nom_industria);
    });

    // nodo j → {row, col, loc}
    const nodeGrid = nodes.map(node => {
      if (Number(node.cod_ubicacion) === 57) return null;
      const loc = locByUbic.get(String(node.cod_ubicacion).padStart(2, "0"));
      if (!loc) return null;
      const row = provinceIdx.get(loc.nom_provincia);
      const col = activityIdx.get(String(node.cod_sector));
      return (row !== undefined && col !== undefined) ? { row, col, loc } : null;
    });

    // ── Domar weights λⱼ = Σₖ βₖ·Ψ[k,j] ──────────────────────────────────
    const lambda = new Float32Array(N);
    let jMax = 0, lambdaMaxVal = 0;
    for (let j = 0; j < N; j++) {
      let sum = 0;
      for (let k = 0; k < N; k++) sum += beta[k] * psi[k * N + j];
      lambda[j] = sum;
      if (sum > lambdaMaxVal) { lambdaMaxVal = sum; jMax = j; }
    }

    // ── Productor por defecto: mayor Domar weight ────────────────────────
    function nodeAt(prov, actCode) {
      const j = nodes.findIndex(n => {
        const g = nodeGrid[nodes.indexOf(n)];
        return false;
      });
      return j;
    }
    function findJ(prov, actCode) {
      for (let j = 0; j < N; j++) {
        const g = nodeGrid[j];
        if (g && g.loc.nom_provincia === prov && activityList[g.col] === String(actCode)) return j;
      }
      return -1;
    }

    // ── Descomposición por celda (province×activity) para un productor j ──
    // Devuelve { total, direct, own, indirect } como Float32Array(NROWS*NCOLS),
    // en participación de λⱼ (%). Σ total = 100.
    function decompose(j) {
      const lam = lambda[j] || 1;
      const total = new Float32Array(NROWS * NCOLS);
      const direct = new Float32Array(NROWS * NCOLS);
      const own = new Float32Array(NROWS * NCOLS);
      for (let k = 0; k < N; k++) {
        const g = nodeGrid[k]; if (!g) continue;
        const idx = g.row * NCOLS + g.col;
        const tot = beta[k] * psi[k * N + j];
        if (tot > 0) total[idx] += (tot / lam) * 100;
        const dir = beta[k] * ad[k * N + j];
        if (dir > 0) direct[idx] += (dir / lam) * 100;
        if (k === j) own[idx] += (beta[k] / lam) * 100;
      }
      const indirect = new Float32Array(NROWS * NCOLS);
      for (let i = 0; i < indirect.length; i++) {
        const v = total[i] - direct[i] - own[i];
        indirect[i] = v > 0 ? v : 0;
      }
      return { total, direct, own, indirect };
    }

    // Resumen propio/directo/indirecto (escalares, % de λ) para el header
    function summary(dec) {
      let own = 0, dir = 0, tot = 0;
      for (let i = 0; i < dec.total.length; i++) { own += dec.own[i]; dir += dec.direct[i]; tot += dec.total[i]; }
      const ind = Math.max(0, tot - dir - own);
      return { ownPct: own, directPct: dir, indirectPct: ind, totalPct: tot };
    }

    // ── Agregación de filas (geo) y columnas (sector) ────────────────────
    function geoKeyArray(level) {
      if (level === "macrozone") return provinceList.map(p => provToMacro.get(p));
      if (level === "region")    return provinceList.map(p => provToRegion.get(p));
      return provinceList.slice();
    }
    function geoOrder(level) {
      return level === "macrozone" ? macroList : level === "region" ? regionList : provinceList;
    }
    function secKeyArray(level) {
      if (level === "industry") return activityList.map(a => actToIndustry.get(a));
      if (level === "pibr13")   return activityList.map(a => actToPibr13.get(a));
      return activityList.slice();
    }
    function secOrder(level) {
      const opts = level === "industry" ? industryOpts : level === "pibr13" ? pibr13Opts : activityOpts;
      return opts.map(o => String(o.value));
    }
    function secLabel(level, key) {
      return sectorLabel(level, key);
    }

    // Totales por grupo geográfico (Map clave→valor)
    function geoTotals(level, grid) {
      const keys = geoKeyArray(level), m = new Map();
      for (let r = 0; r < NROWS; r++) {
        let t = 0; for (let c = 0; c < NCOLS; c++) t += grid[r * NCOLS + c];
        m.set(keys[r], (m.get(keys[r]) || 0) + t);
      }
      return m;
    }
    // Totales por grupo sectorial (devuelve [{code,label,v,industryName}] ordenado por orden oficial)
    function secTotals(level, grid) {
      const keys = secKeyArray(level), m = new Map();
      for (let c = 0; c < NCOLS; c++) {
        let t = 0; for (let r = 0; r < NROWS; r++) t += grid[r * NCOLS + c];
        m.set(keys[c], (m.get(keys[c]) || 0) + t);
      }
      const order = secOrder(level);
      return order.filter(k => m.has(k)).map(k => {
        const indName = level === "industry"
          ? secLabelEs(level, k)
          : indNameForSecKey(level, k);
        return { code: k, label: secLabel(level, k), v: m.get(k) || 0, industryName: indName };
      });
    }
    function secLabelEs(level, key) {
      const f = level === "industry" ? "cod_industria" : level === "pibr13" ? "cod_PIBR13" : "cod_SECTOR46";
      const row = sectors.find(s => String(s[f]) === String(key));
      return row ? row.nom_industria : "";
    }
    function indNameForSecKey(level, key) {
      const f = level === "pibr13" ? "cod_PIBR13" : "cod_SECTOR46";
      const row = sectors.find(s => String(s[f]) === String(key));
      return row ? row.nom_industria : "";
    }

    // Matriz agregada para el heatmap: filas=geo activos, cols=sector activos
    function matrix(geoLevel, secLevel, grid) {
      const gk = geoKeyArray(geoLevel), sk = secKeyArray(secLevel);
      const rowsAll = geoOrder(geoLevel), colsAll = secOrder(secLevel);
      const rowSet = new Set(gk), colSet = new Set(sk);
      const rows = rowsAll.filter(r => rowSet.has(r));
      const cols = colsAll.filter(c => colSet.has(c));
      const rIdx = new Map(rows.map((r, i) => [r, i])), cIdx = new Map(cols.map((c, i) => [c, i]));
      const out = new Float32Array(rows.length * cols.length);
      for (let r = 0; r < NROWS; r++) {
        const ri = rIdx.get(gk[r]); if (ri == null) continue;
        for (let c = 0; c < NCOLS; c++) {
          const ci = cIdx.get(sk[c]); if (ci == null) continue;
          out[ri * cols.length + ci] += grid[r * NCOLS + c];
        }
      }
      return {
        rows, cols, grid: out,
        colLabels: cols.map(c => secLabel(secLevel, c)),
        nC: cols.length, nR: rows.length
      };
    }

    return {
      N, nodes, nodeGrid, lambda, jMax,
      provinceList, regionList, macroList, NROWS, NCOLS,
      activityList, activityOpts, pibr13Opts, industryOpts,
      provToRegion, provToMacro, domesticLocs,
      industryColorFor: (secKey, secLevel) => null, // set by app
      findJ, decompose, summary,
      geoTotals, secTotals, matrix, geoKeyArray, secKeyArray, geoOrder, secOrder, secLabel
    };
  }

  window.M4Engine = { init };
})();
