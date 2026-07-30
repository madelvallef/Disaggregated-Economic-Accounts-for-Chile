#!/usr/bin/env node
/**
 * qa-data-assertions.js — Aserciones numéricas permanentes del sitio.
 *
 * Verifica, contra downloads/en_*.csv (fuente canónica publicada):
 *   1. Cada métrica del payload de M2 = su columna homóloga del CSV (celda a celda).
 *   2. N = 2576 celdas domésticas; PIB ≈ 301.260 MUSD (±1%); usdRate = 782.75.
 *   3. CSV español = CSV inglés × 782.75 uniforme en columnas monetarias (empleo ×1).
 *   4. Identidad M4↔M2: λ = b'Ψ reproduce produccion_bruta/PIB (precisión Float32).
 *
 * Estas aserciones habrían detectado los hallazgos ALTA #1 (métricas mal rotuladas),
 * el 2,0008x de Antofagasta-Minería y el zoológico de tasas de la auditoría jul-2026.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const USD_RATE = 782.75;
const failures = [];

function parseCsv(p) {
  const t = fs.readFileSync(p, "utf8").replace(/^﻿/, "");
  const lines = t.trim().split(/\r?\n/);
  const h = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const parts = l.split(",");
    const o = {};
    h.forEach((k, i) => { o[k] = Number(parts[i]); });
    return o;
  });
}

const en = parseCsv(path.join(ROOT, "downloads", "en_chile_2022_dea_economic_accounts.csv"));
const es = parseCsv(path.join(ROOT, "downloads", "es_chile_2022_dea_cuentas_economicas.csv"));

global.window = {};
eval(fs.readFileSync(path.join(ROOT, "web_materiales", "data", "module2_distribution.js"), "utf8"));
const m2 = global.window.module2Data;

// ── 1-2: métricas del payload vs CSV ────────────────────────────────────────
if (m2.usdRate !== USD_RATE) failures.push(`usdRate del payload = ${m2.usdRate}, esperado ${USD_RATE}`);
const econ = m2.econRows || [];
if (econ.length !== 2576) failures.push(`econRows = ${econ.length}, esperado 2576`);

const FIELDS = {
  empleo: ["employment", 1000],
  insumos_intermedios_domesticos: ["domestic_intermediate_inputs", USD_RATE * 1e6],
  insumos_intermedios_importados: ["imported_intermediate_inputs", USD_RATE * 1e6],
  exportaciones: ["exports", USD_RATE * 1e6],
  ventas_intermedias: ["intermediate_sales", USD_RATE * 1e6],
  ventas_domesticas: ["domestic_sales", USD_RATE * 1e6],
  produccion_bruta: ["gross_output", USD_RATE * 1e6],
  insumos_intermedios_totales: ["total_intermediate_inputs", USD_RATE * 1e6],
  valor_agregado: ["value_added", USD_RATE * 1e6],
  remuneraciones: ["wages", USD_RATE * 1e6],
  ventas_consumo_final: ["consumer_sales", USD_RATE * 1e6],
};
const enKey = new Map(en.map((r) => [r.location_code + "_" + r.sector_code, r]));
for (const row of econ) {
  const src = enKey.get(row.cod_ubicacion + "_" + row.cod_sector);
  if (!src) { failures.push(`celda sin fuente: ${row.cod_ubicacion}_${row.cod_sector}`); continue; }
  for (const [field, [col, scale]] of Object.entries(FIELDS)) {
    const expected = src[col] * scale;
    const got = Number(row[field] || 0);
    if (Math.abs(expected) < 1e-9 && Math.abs(got) < 1e-9) continue;
    const rel = Math.abs(got - expected) / Math.max(Math.abs(expected), 1e-12);
    if (rel > 1e-9) {
      failures.push(`métrica ${field} != ${col} en ${row.cod_ubicacion}_${row.cod_sector} (relErr ${rel.toExponential(1)})`);
      break;
    }
  }
}
const gdp = econ.reduce((a, r) => a + Number(r.valor_agregado || 0), 0) / (USD_RATE * 1e6);
if (Math.abs(gdp - 301260) / 301260 > 0.01) failures.push(`PIB = ${gdp.toFixed(0)} MUSD, fuera de 301.260 ±1%`);

// ── 3: paridad ES = EN × tasa ───────────────────────────────────────────────
const esKey = new Map(es.map((r) => [r.cod_ubicacion + "_" + r.cod_sector, r]));
const MONETARY = Object.entries(FIELDS).filter(([f]) => f !== "empleo");
let rMin = Infinity, rMax = -Infinity;
for (const r of en) {
  const e = esKey.get(r.location_code + "_" + r.sector_code);
  if (!e) { failures.push(`fila ES faltante: ${r.location_code}_${r.sector_code}`); break; }
  for (const [esField, [enCol]] of MONETARY) {
    if (Math.abs(r[enCol]) < 1e-9) continue;
    const ratio = e[esField] / r[enCol];
    if (ratio < rMin) rMin = ratio;
    if (ratio > rMax) rMax = ratio;
  }
  if (Math.abs(e.empleo - r.employment) > 1e-6 * Math.max(1, Math.abs(r.employment))) {
    failures.push(`empleo ES != EN en ${r.location_code}_${r.sector_code}`);
  }
}
if (Math.abs(rMin - USD_RATE) > 1e-6 || Math.abs(rMax - USD_RATE) > 1e-6) {
  failures.push(`ratio ES/EN no uniforme: [${rMin}, ${rMax}], esperado ${USD_RATE}`);
}

// ── 4: identidad M4↔M2 (λ = b'Ψ = produccion_bruta/PIB) ────────────────────
(async () => {
  try {
    eval(fs.readFileSync(path.join(ROOT, "web_materiales", "data", "spatial_io_network_data.js"), "utf8"));
    const nd = await global.window.spatialIoNetworkDataPromise;
    const { nodeCount: N, psi, beta, gdp: gdpNd, nodes } = nd;
    const domar = new Map(econ.map((r) => [Number(r.cod_ubicacion) * 100 + Number(r.cod_sector), Number(r.produccion_bruta) / (USD_RATE * 1e6) / gdpNd]));
    let maxAbs = 0;
    for (let j = 0; j < N; j++) {
      let lam = 0;
      for (let i = 0; i < N; i++) lam += beta[i] * psi[i * N + j];
      const dm = domar.get(Number(nodes[j].cod_ubicacion) * 100 + Number(nodes[j].cod_sector));
      if (dm === undefined) continue;
      const diff = Math.abs(lam - dm);
      if (diff > maxAbs) maxAbs = diff;
    }
    if (maxAbs > 1e-6) failures.push(`identidad λ=b'Ψ vs Domar M2 rota: |diff| máx = ${maxAbs.toExponential(2)} (> 1e-6)`);

    if (failures.length) {
      console.error(`QA-datos FAIL: ${failures.length} problema(s).`);
      failures.slice(0, 20).forEach((f) => console.error("- " + f));
      process.exit(1);
    }
    console.log(`QA-datos OK: 2576 celdas × 11 métricas = CSV; PIB ${gdp.toFixed(1)} MUSD; ES/EN = ${USD_RATE} uniforme; λ=b'Ψ |diff| máx ${maxAbs.toExponential(1)}.`);
  } catch (err) {
    console.error("QA-datos FAIL:", err.message);
    process.exit(1);
  }
})();
