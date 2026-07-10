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
  "acknowledgements",
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) failures.push(`Falta la seccion #${id}.`);
}

function hasMojibake(text) {
  return /(?:Ã.|Â.|â[\u0080-\uFFFF]?|Î.)/.test(text);
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
