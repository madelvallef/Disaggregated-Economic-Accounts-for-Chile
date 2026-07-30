"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");
const sitioPath = path.join(projectRoot, "sitio.html");
const html = fs.readFileSync(sitioPath, "utf8");
const failures = [];
const mojibakeSources = [
  "sitio.html",
  "web_materiales/js/tree-select.js",
  "web_materiales/data/module2_distribution.js",
  "web_materiales/data/module3_app.js",
  "web_materiales/data/module4_app.js",
  "web_materiales/data/module4_engine.js",
  "web_materiales/data/spatial_io_flows_data.js",
  "web_materiales/data/spatial_io_network_data.js",
];

const requiredIds = [
  "home",
  "explorar",
  "module-1",
  "module-2",
  "module-3",
  "module-4",
  "datos",
  "citacion",
  "research-paper",
  "research-team",
  "contacto",
  "acknowledgements",
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) failures.push(`Falta la seccion #${id}.`);
}

function hasMojibake(text) {
  // Familias cubiertas: \u00c3/\u00c2 + continuaci\u00f3n (vocales acentuadas y signos); la familia de
  // puntuaci\u00f3n tipogr\u00e1fica corrupta \u00e2\u20ac\u0153 / \u00e2\u20ac\u2122 / \u00e2\u20ac\u201c / \u00e2\u20ac\u00a6 (\u00e2 seguido de \u20ac U+20AC u otros
  // caracteres FUERA de [\u0080-\u00BF]); \u00ce+continuaci\u00f3n (griegas corruptas); y U+FFFD.
  return /(?:\u00c3[\u0080-\u00BF]|\u00c2[\u0080-\u00BF]|\u00e2[\u0080-\u00BF\u20ac\u2018\u2019\u201c\u201d\u2013\u2014\u2020\u2021\u2022\u2026\u02c6\u2030\u0152\u0153\u2039\u203a\u0160\u0161\u017d\u017e\u0192\u02dc\u2122][\u0080-\u00BF\u20ac\u2018\u2019\u201c\u201d\u2013\u2014\u2020\u2021\u2022\u2026\u02c6\u2030\u0152\u0153\u2039\u203a\u0160\u0161\u017d\u017e\u0192\u02dc\u2122]?|\u00ce[\u0080-\u00BF\u2018\u2019\u201c\u201d]|\uFFFD)/.test(text);
}

for (const source of mojibakeSources) {
  const sourcePath = path.join(projectRoot, source);
  if (!fs.existsSync(sourcePath)) {
    failures.push(`Fuente activa inexistente para revisar codificacion: ${source}`);
    continue;
  }
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  sourceText.split(/\r?\n/).forEach((line, index) => {
    if (hasMojibake(line)) {
      failures.push(`Posible mojibake en ${source}:${index + 1}`);
    }
  });
  if (source.endsWith(".js")) {
    try {
      new vm.Script(sourceText, { filename: source });
    } catch (error) {
      failures.push(`Error de sintaxis en ${source}: ${error.message}`);
    }
  }
}

const ids = new Map();
for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
  ids.set(match[1], (ids.get(match[1]) || 0) + 1);
}
for (const [id, occurrences] of ids) {
  if (occurrences > 1) failures.push(`ID duplicado: #${id} (${occurrences}).`);
}

const tagPairs = [
  ["script", /<script\b/g, /<\/script>/g],
  ["style", /<style\b/g, /<\/style>/g],
  ["section", /<section\b/g, /<\/section>/g],
];
for (const [tag, openPattern, closePattern] of tagPairs) {
  const open = (html.match(openPattern) || []).length;
  const close = (html.match(closePattern) || []).length;
  if (open !== close) failures.push(`<${tag}> desbalanceado: ${open}/${close}.`);
}

let inlineScriptIndex = 0;
for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
  inlineScriptIndex += 1;
  try {
    new vm.Script(match[1], { filename: `sitio-inline-${inlineScriptIndex}.js` });
  } catch (error) {
    failures.push(`Script inline ${inlineScriptIndex}: ${error.message}`);
  }
}

// Todo href="#x" debe apuntar a un id existente (evita enlaces fantasma como el
// href="#module-5" que quedó tras eliminar el módulo 5).
for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
  const anchor = match[1];
  if (!ids.has(anchor)) failures.push(`Ancla sin destino: href="#${anchor}" no tiene id correspondiente.`);
}

for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  const reference = match[1];
  if (
    !reference ||
    reference.startsWith("#") ||
    reference.startsWith("http://") ||
    reference.startsWith("https://") ||
    reference.startsWith("mailto:") ||
    reference.startsWith("data:")
  ) {
    continue;
  }
  const cleanReference = reference.split(/[?#]/)[0];
  const localPath = path.join(projectRoot, cleanReference);
  if (!fs.existsSync(localPath)) failures.push(`Recurso local inexistente: ${reference}`);
}

if (failures.length) {
  console.error(`Validacion FAIL: ${failures.length} problema(s).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  if (failures.some((failure) => failure.includes("mojibake"))) {
    console.error(
      "- Alerta de encoding: revisa que el archivo siga en UTF-8 y que caracteres como á, é, í, ó, ú, ñ, ¿, ¡ no se hayan convertido en secuencias como Ã¡, Ã± o Â¿.",
    );
  }
  process.exit(1);
}

console.log(
  `Validacion OK: ${requiredIds.length} secciones, ${inlineScriptIndex} scripts inline, recursos locales disponibles y sin mojibake en fuentes activas.`,
);
