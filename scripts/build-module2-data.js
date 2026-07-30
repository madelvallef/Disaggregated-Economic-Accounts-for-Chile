#!/usr/bin/env node
/**
 * build-module2-data.js — Generador de web_materiales/data/module2_distribution.js
 *
 * Fuente canónica: downloads/en_chile_2022_dea_economic_accounts.csv (MUSD 2022)
 * Taxonomía:       scripts/source/taxonomy.json (ubicaciones, sectores, geojson, colores)
 *
 * Convenciones del payload emitido:
 *   - Nombres de campo = nombres oficiales de columna del CSV español publicado
 *     (exportaciones, ventas_intermedias, insumos_intermedios_importados, ...).
 *   - Valores monetarios en PESOS CHILENOS de 2022 crudos (CLP), convertidos desde
 *     MUSD con USD_RATE. El sitio los reescala a Billones de CLP (ES) o MUSD (EN).
 *   - empleo en PERSONAS (la columna employment del CSV está en miles).
 *   - Solo celdas domésticas (location_code <= 56): N = 2576 = 56 provincias x 46 sectores.
 *
 * USD_RATE = 782.75 es la tasa implícita de anclar el total de valor agregado en CLP
 * al PIB 2022 de Chile en USD corrientes (~301.260 MUSD). No es tasa de mercado.
 *
 * El generador FALLA (exit 1) si los datos emitidos no cuadran con el CSV fuente.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CSV_EN = path.join(ROOT, "downloads", "en_chile_2022_dea_economic_accounts.csv");
const TAXONOMY = path.join(__dirname, "source", "taxonomy.json");
const OUT = path.join(ROOT, "web_materiales", "data", "module2_distribution.js");

const USD_RATE = 782.75;           // CLP por USD (convención de anclaje al PIB en USD)
const CLP_PER_MUSD = USD_RATE * 1e6;
const N_EXPECTED = 2576;           // 56 provincias x 46 sectores
const GDP_MUSD_EXPECTED = 301260;  // ancla (±1%)

// Columnas del CSV EN -> nombre oficial español (= columnas del CSV ES publicado)
const FIELD_MAP = {
  employment: "empleo",
  domestic_intermediate_inputs: "insumos_intermedios_domesticos",
  imported_intermediate_inputs: "insumos_intermedios_importados",
  exports: "exportaciones",
  intermediate_sales: "ventas_intermedias",
  domestic_sales: "ventas_domesticas",
  gross_output: "produccion_bruta",
  total_intermediate_inputs: "insumos_intermedios_totales",
  value_added: "valor_agregado",
  wages: "remuneraciones",
  consumer_sales: "ventas_consumo_final"
};

// Métricas expuestas en el selector de M2 (mismas 9 etiquetas visibles de siempre,
// ahora cada una respaldada por su columna homónima del CSV publicado).
const METRICS = {
  valor_agregado: { label_es: "PIB", label_en: "GDP", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  empleo: { label_es: "Empleo", label_en: "Employment", unit_es: "Personas", unit_en: "Jobs" },
  produccion_bruta: { label_es: "Ventas totales", label_en: "Total sales", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  insumos_intermedios_totales: { label_es: "Gastos totales", label_en: "Total inputs", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  ventas_domesticas: { label_es: "Ventas nacionales", label_en: "Domestic sales", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  ventas_intermedias: { label_es: "Ventas intermedias", label_en: "Intermediate sales", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  exportaciones: { label_es: "Exportaciones", label_en: "Exports", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  insumos_intermedios_importados: { label_es: "Importaciones", label_en: "Imports", unit_es: "Billones de CLP", unit_en: "MUSD$" },
  remuneraciones: { label_es: "Remuneraciones", label_en: "Compensation", unit_es: "Billones de CLP", unit_en: "MUSD$" }
};

const MACROZONA_EN = {
  "Norte": "North",
  "Centro": "Central",
  "RM": "Metropolitan Region",
  "Centro Sur": "Central-South",
  "Sur": "South",
  "Austral": "Austral",
  "Otro": "Other"
};

function fail(msg) {
  console.error("[build-module2-data] ERROR: " + msg);
  process.exit(1);
}

function parseCsv(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const parts = line.split(",");
    const row = {};
    header.forEach((h, i) => { row[h] = Number(parts[i]); });
    return row;
  });
}

function main() {
  const csv = parseCsv(CSV_EN);
  const tax = JSON.parse(fs.readFileSync(TAXONOMY, "utf8"));

  for (const col of Object.keys(FIELD_MAP)) {
    if (!(col in csv[0])) fail(`columna faltante en el CSV fuente: ${col}`);
  }

  const locByCode = new Map(tax.locations.map((l) => [Number(l.cod_ubicacion), l]));
  const secByCode = new Map(tax.sectors.map((s) => [Number(s.cod_SECTOR46), s]));

  // Traducciones de macrozona (hallazgo BAJA #24)
  const locations = tax.locations.map((l) => ({
    ...l,
    nom_macrozona_eng: MACROZONA_EN[l.nom_macrozona] || l.nom_macrozona
  }));
  const locEngByCode = new Map(locations.map((l) => [Number(l.cod_ubicacion), l]));

  const domestic = csv.filter((r) => r.location_code <= 56);
  if (domestic.length !== N_EXPECTED) fail(`celdas domésticas = ${domestic.length}, esperadas ${N_EXPECTED}`);

  const econRows = domestic.map((r) => {
    const loc = locEngByCode.get(r.location_code);
    const sec = secByCode.get(r.sector_code);
    if (!loc) fail(`ubicación sin taxonomía: ${r.location_code}`);
    if (!sec) fail(`sector sin taxonomía: ${r.sector_code}`);
    const row = {
      cod_ubicacion: Number(loc.cod_ubicacion),
      cod_provincia: loc.cod_provincia,
      cod_provincia_sort: loc.cod_provincia_sort,
      nom_provincia: loc.nom_provincia,
      cod_region_sort: loc.cod_region_sort,
      nom_region: loc.nom_region,
      nom_macrozona: loc.nom_macrozona,
      nom_macrozona_eng: loc.nom_macrozona_eng,
      cod_sector: Number(sec.cod_SECTOR46),
      cod_SECTOR46: sec.cod_SECTOR46,
      nom_SECTOR46: sec.nom_SECTOR46,
      nom_SECTOR46_eng: sec.nom_SECTOR46_eng,
      cod_PIBR13: sec.cod_PIBR13,
      nom_PIBR13: sec.nom_PIBR13,
      nom_PIBR13_eng: sec.nom_PIBR13_eng,
      cod_industria: sec.cod_industria,
      nom_industria: sec.nom_industria,
      nom_industria_eng: sec.nom_industria_eng
    };
    for (const [enCol, esName] of Object.entries(FIELD_MAP)) {
      row[esName] = esName === "empleo" ? r[enCol] * 1000 : r[enCol] * CLP_PER_MUSD;
    }
    return row;
  });

  // ── Aserciones contra la fuente ─────────────────────────────────────────
  // 1) Cada campo monetario reproduce su columna del CSV al reconvertir a MUSD.
  const byKey = new Map(domestic.map((r) => [r.location_code + "_" + r.sector_code, r]));
  let worst = 0;
  for (const row of econRows) {
    const src = byKey.get(row.cod_ubicacion + "_" + row.cod_sector);
    for (const [enCol, esName] of Object.entries(FIELD_MAP)) {
      const back = esName === "empleo" ? row[esName] / 1000 : row[esName] / CLP_PER_MUSD;
      const ref = src[enCol];
      const err = Math.abs(back - ref) / Math.max(Math.abs(ref), 1e-12);
      if (Math.abs(ref) > 1e-12 && err > worst) worst = err;
      if (Math.abs(ref) > 1e-12 && err > 1e-9) {
        fail(`métrica ${esName} no cuadra con ${enCol} en celda ${row.cod_ubicacion}_${row.cod_sector} (relErr ${err})`);
      }
    }
  }

  // 2) Identidades contables por celda (en MUSD, tolerancia numérica).
  for (const r of domestic) {
    const idErr = Math.max(
      Math.abs(r.value_added - (r.gross_output - r.total_intermediate_inputs)),
      Math.abs(r.total_intermediate_inputs - (r.domestic_intermediate_inputs + r.imported_intermediate_inputs)),
      Math.abs(r.gross_output - (r.domestic_sales + r.exports)),
      Math.abs(r.domestic_sales - (r.intermediate_sales + r.consumer_sales))
    );
    if (idErr > 1e-4) fail(`identidad contable rota en ${r.location_code}_${r.sector_code} (err ${idErr})`);
  }

  // 3) Ancla del PIB.
  const gdpMusd = domestic.reduce((a, r) => a + r.value_added, 0);
  if (Math.abs(gdpMusd - GDP_MUSD_EXPECTED) / GDP_MUSD_EXPECTED > 0.01) {
    fail(`PIB total ${gdpMusd.toFixed(1)} MUSD fuera del ancla ${GDP_MUSD_EXPECTED} (±1%)`);
  }

  // ── Payload ─────────────────────────────────────────────────────────────
  const payload = {
    metrics: METRICS,
    macroColors: tax.macroColors,
    usdRate: USD_RATE,
    locations,
    sectors: tax.sectors,
    sectorDefinitions: tax.sectorDefinitions,
    geojson: tax.geojson,
    econRows
  };

  const banner =
    "// Generado por scripts/build-module2-data.js -- NO EDITAR A MANO.\n" +
    `// Fuente: downloads/en_chile_2022_dea_economic_accounts.csv | Generado: ${new Date().toISOString().slice(0, 10)}\n` +
    `// Unidades: valores monetarios en CLP 2022 crudos (MUSD x ${USD_RATE}e6); empleo en personas.\n` +
    `// Tasa ${USD_RATE} CLP/USD: implicita de anclar el VAB en CLP al PIB 2022 en USD (~${GDP_MUSD_EXPECTED} MUSD). No es tasa de mercado.\n` +
    `// N = ${econRows.length} celdas domesticas (56 provincias x 46 sectores). PIB = ${gdpMusd.toFixed(2)} MUSD.\n`;

  fs.writeFileSync(OUT, banner + "window.module2Data = " + JSON.stringify(payload) + ";\n");

  const mb = (fs.statSync(OUT).size / 1e6).toFixed(2);
  console.log(`[build-module2-data] OK: ${econRows.length} celdas | PIB ${gdpMusd.toFixed(2)} MUSD | relErr max ${worst.toExponential(1)} | ${OUT} (${mb} MB)`);
}

main();
