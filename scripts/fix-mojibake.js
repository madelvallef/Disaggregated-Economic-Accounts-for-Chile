"use strict";

// Repara mojibake por doble encoding (UTF-8 leido como Windows-1252 y
// re-guardado como UTF-8): "Ã¡" -> "á", "â€œ" -> comillas tipograficas, etc.
// El mapa de reemplazos se genera programaticamente desde una lista curada de
// caracteres objetivo, por lo que solo se tocan secuencias que son el resultado
// exacto de corromper uno de esos caracteres. Uso:
//   node scripts/fix-mojibake.js          repara los archivos objetivo
//   node scripts/fix-mojibake.js --dry    solo reporta, no escribe nada

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry");

// Archivos que se reparan (hoy con mojibake conocido).
const FIX_FILES = ["sitio.html", "web_materiales/data/module3_app.js"];
// Archivos que solo se escanean: si aparece mojibake se reporta pero no se toca
// (agregarlos a FIX_FILES si algun dia se corrompen).
const SCAN_FILES = [
  "web_materiales/data/module4_app.js",
  "web_materiales/data/module4_engine.js",
];

// Windows-1252: los bytes 0x80-0x9F mapean a estos code points; el resto es
// identidad Latin-1. Los slots indefinidos (0x81, 0x8D, 0x8F, 0x90, 0x9D)
// caen a la identidad C1, igual que los decoders WHATWG de los navegadores.
const CP1252_HIGH = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};

function byteToCp1252Char(byte) {
  const mapped = CP1252_HIGH[byte];
  return String.fromCharCode(mapped !== undefined ? mapped : byte);
}

// Caracteres objetivo: espanol, tipografia, simbolos usados en el sitio
// (matematicos, flechas, box-drawing de comentarios) y griego de formulas.
const TARGET_CHARS =
  "áéíóúÁÉÍÓÚñÑüÜäëïöâêîôûàèìòùÀÈÌÒÙçÇ" +
  "¿¡ºª°§¶©®µ" +
  "·×÷±≈≠≤≥∞∑∏√∂∆−∙" +
  "–—‘’“”‚„…•‹›«»" +
  "€™†‡‰" +
  "→←↑↓⇒⇐⇔↔↗↘↖↙" +
  "✓✗✔✘★☆●○◦▪▫▶◀▸◂▾▴" +
  "─│┌┐└┘├┤┬┴┼═║╌" +
  "αβγδεζηθικλμνξπρστυφχψω" +
  "ΓΔΘΛΞΠΣΦΨΩ" +
  " "; // NBSP: corrupto aparece como "Â " + NBSP

// moji -> original. Generado, no escrito a mano.
const REPLACEMENTS = new Map();
for (const ch of new Set(Array.from(TARGET_CHARS))) {
  const bytes = Buffer.from(ch, "utf8");
  const moji = Array.from(bytes, byteToCp1252Char).join("");
  if (moji !== ch) REPLACEMENTS.set(moji, ch);
}

// Reemplazo longest-first para que "Ã‰" no sea comido por una clave mas corta.
const sortedKeys = Array.from(REPLACEMENTS.keys()).sort(
  (a, b) => b.length - a.length,
);
const escaped = sortedKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const REPLACE_RE = new RegExp(escaped.join("|"), "g");

// Misma regex que scripts/validate-sitio.js usa para detectar mojibake.
const VALIDATE_RE = /(?:Ã.|Â.|â[-￿]?|Î.)/;

function fixText(text) {
  const counts = new Map();
  let current = text;
  // Punto fijo (max 3 pasadas) por si alguna zona sufrio doble corrupcion.
  for (let pass = 0; pass < 3; pass += 1) {
    const next = current.replace(REPLACE_RE, (moji) => {
      counts.set(moji, (counts.get(moji) || 0) + 1);
      return REPLACEMENTS.get(moji);
    });
    if (next === current) break;
    current = next;
  }
  return { text: current, counts };
}

function residualLines(text) {
  const lines = [];
  text.split(/\r?\n/).forEach((line, index) => {
    if (VALIDATE_RE.test(line)) lines.push(index + 1);
  });
  return lines;
}

let totalReplacements = 0;
let totalResiduals = 0;

for (const relative of [...FIX_FILES, ...SCAN_FILES]) {
  const filePath = path.join(projectRoot, relative);
  if (!fs.existsSync(filePath)) {
    console.error(`AVISO: no existe ${relative}, se omite.`);
    continue;
  }
  const original = fs.readFileSync(filePath, "utf8");
  const scanOnly = SCAN_FILES.includes(relative);

  if (scanOnly) {
    const lines = residualLines(original);
    if (lines.length) {
      totalResiduals += lines.length;
      console.error(
        `SCAN ${relative}: mojibake en ${lines.length} linea(s) ` +
          `(${lines.slice(0, 10).join(", ")}${lines.length > 10 ? ", ..." : ""}). ` +
          "Agregar a FIX_FILES para repararlo.",
      );
    } else {
      console.log(`SCAN ${relative}: limpio.`);
    }
    continue;
  }

  const { text: fixed, counts } = fixText(original);
  const replaced = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  totalReplacements += replaced;

  if (replaced === 0) {
    console.log(`FIX  ${relative}: sin secuencias que reparar.`);
  } else {
    const detail = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([moji, count]) => `${JSON.stringify(moji)}->${JSON.stringify(REPLACEMENTS.get(moji))} x${count}`)
      .join(", ");
    console.log(`FIX  ${relative}: ${replaced} reemplazo(s). ${detail}`);
  }

  const residuals = residualLines(fixed);
  if (residuals.length) {
    totalResiduals += residuals.length;
    console.error(
      `RESIDUO ${relative}: ${residuals.length} linea(s) siguen matcheando la ` +
        `regex de validate tras la reparacion: ${residuals.slice(0, 20).join(", ")}` +
        `${residuals.length > 20 ? ", ..." : ""}. Revisar a mano (posible secuencia ` +
        "no mapeada: agregar el caracter a TARGET_CHARS).",
    );
  }

  if (!dryRun && fixed !== original) {
    fs.writeFileSync(filePath, fixed, "utf8");
  }
}

console.log(
  `${dryRun ? "[dry-run] " : ""}Total: ${totalReplacements} reemplazo(s), ` +
    `${totalResiduals} linea(s) residual(es).`,
);
if (!dryRun && totalReplacements > 0) {
  console.log("Ahora corre: npm.cmd run validate");
}
process.exit(totalResiduals > 0 ? 1 : 0);
