#!/usr/bin/env node
/**
 * build-es-downloads.js — Regenera los CSV españoles de downloads/ desde los ingleses.
 *
 * Conversión: valores monetarios = MUSD × USD_RATE (782.75, la tasa implícita de anclar
 * el VAB en CLP al PIB 2022 en USD; misma constante que scripts/build-module2-data.js).
 * Unidad resultante: MILLONES de pesos chilenos de 2022 (MMCLP$ 2022).
 * El empleo queda igual (miles de trabajadores en ambos idiomas).
 *
 * Falla (exit 1) si la reconversión no reproduce el archivo inglés.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const ROOT = path.join(__dirname, "..");
const DL = path.join(ROOT, "downloads");
const USD_RATE = 782.75;
const BOM = "﻿";

const ES_ACC_HEADER = "cod_ubicacion,cod_sector,empleo,excedente,insumos_intermedios_domesticos,insumos_intermedios_importados,exportaciones,ventas_intermedias,ventas_domesticas,produccion_bruta,insumos_intermedios_totales,valor_agregado,remuneraciones,ventas_consumo_final";
const ES_FLOWS_HEADER = "cod_ubicacion_vendedora,cod_ubicacion_compradora,cod_sector_vendedor,cod_sector_comprador,flujo";

function fail(msg) { console.error("[build-es-downloads] ERROR: " + msg); process.exit(1); }

function convertAccounts() {
  const src = fs.readFileSync(path.join(DL, "en_chile_2022_dea_economic_accounts.csv"), "utf8").replace(/^﻿/, "");
  const lines = src.trim().split(/\r?\n/);
  const out = [ES_ACC_HEADER];
  let sumVaEs = 0;
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length !== 14) fail(`fila ${i + 1}: ${parts.length} columnas`);
    const conv = parts.map((v, idx) => {
      if (idx <= 2) return v; // códigos y empleo sin conversión
      const num = Number(v) * USD_RATE;
      return String(num);
    });
    if (Number(parts[0]) <= 56) sumVaEs += Number(parts[11]) * USD_RATE;
    out.push(conv.join(","));
  }
  fs.writeFileSync(path.join(DL, "es_chile_2022_dea_cuentas_economicas.csv"), BOM + out.join("\n") + "\n");
  console.log(`cuentas ES: ${out.length - 1} filas | VA doméstico = ${(sumVaEs / 1e6).toFixed(3)} billones de CLP (esperado ~235,811)`);
  if (Math.abs(sumVaEs / 1e6 - 235.811363) > 0.01) fail("total en CLP fuera del ancla");
}

function convertFlows() {
  return new Promise((resolve, reject) => {
    const srcPath = path.join(DL, "en_chile_2022_dea_spatial_io_flows.csv");
    const dstPath = path.join(DL, "es_chile_2022_dea_flujos_io_espaciales.csv");
    const rl = readline.createInterface({ input: fs.createReadStream(srcPath), crlfDelay: Infinity });
    const ws = fs.createWriteStream(dstPath);
    let first = true, n = 0, sum = 0;
    ws.write(BOM + ES_FLOWS_HEADER + "\n");
    rl.on("line", (l) => {
      if (first) { first = false; return; }
      const i = l.lastIndexOf(",");
      const codes = l.slice(0, i);
      const v = Number(l.slice(i + 1)) * USD_RATE;
      sum += v; n++;
      ws.write(codes + "," + String(v) + "\n");
    });
    rl.on("close", () => {
      ws.end(() => {
        console.log(`flujos ES: ${n} filas | suma = ${(sum / 1e6).toFixed(3)} billones de CLP`);
        resolve();
      });
    });
    rl.on("error", reject);
  });
}

(async () => {
  convertAccounts();
  await convertFlows();
  console.log(`[build-es-downloads] OK. Tasa ${USD_RATE} CLP/USD; unidad: millones de CLP 2022 (MMCLP$).`);
})();
