"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "dist");

// El sitio es una sola pagina: sitio.html. En dist/ se publica ademas como
// index.html para que el servidor la sirva en la raiz.
const pages = ["sitio.html"];

const publicDirectories = [
  "web_materiales",
  "vendor",
  "downloads",
  "uploads",
];

const securityFiles = [
  "_headers",
  ".htaccess",
  "nginx-security-headers.conf",
];

const designSystemHref = "web_materiales/css/design-system.css";

function assertInsideProject(targetPath) {
  const relative = path.relative(projectRoot, targetPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Ruta de build no permitida: ${targetPath}`);
  }
}

function assertExists(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Falta un insumo requerido para el build: ${sourcePath}`);
  }
}

function copyFile(sourcePath, destinationPath) {
  assertExists(sourcePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

function assertPageUsesDesignSystem(pagePath) {
  const html = fs.readFileSync(pagePath, "utf8");
  if (!html.includes(`href="${designSystemHref}"`)) {
    throw new Error(
      `La pagina ${path.basename(pagePath)} no enlaza el Design System central.`,
    );
  }
}

function assertSitioIntegrity(pagePath) {
  const html = fs.readFileSync(pagePath, "utf8");
  const count = (pattern) => (html.match(pattern) || []).length;
  const requiredSingleTags = [
    ["<body", /<body\b/g],
    ["</body>", /<\/body>/g],
    ["</html>", /<\/html>/g],
  ];

  for (const [label, pattern] of requiredSingleTags) {
    const occurrences = count(pattern);
    if (occurrences !== 1) {
      throw new Error(`sitio.html contiene ${occurrences} ocurrencias de ${label}.`);
    }
  }

  const openScripts = count(/<script\b/g);
  const closeScripts = count(/<\/script>/g);
  const openSections = count(/<section\b/g);
  const closeSections = count(/<\/section>/g);
  if (openScripts !== closeScripts || openSections !== closeSections) {
    throw new Error(
      `sitio.html esta desbalanceado: scripts ${openScripts}/${closeScripts}, secciones ${openSections}/${closeSections}.`,
    );
  }

  const ids = new Map();
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) {
    ids.set(match[1], (ids.get(match[1]) || 0) + 1);
  }
  const duplicates = [...ids.entries()]
    .filter(([, occurrences]) => occurrences > 1)
    .map(([id]) => id);
  if (duplicates.length) {
    throw new Error(`sitio.html contiene IDs duplicados: ${duplicates.join(", ")}.`);
  }
}

function copyDirectory(sourcePath, destinationPath) {
  assertExists(sourcePath);
  fs.cpSync(sourcePath, destinationPath, {
    recursive: true,
    force: true,
    filter: (entry) => path.basename(entry) !== ".DS_Store",
  });
  removeStaleEntries(sourcePath, destinationPath);
}

function removePath(targetPath) {
  assertInsideProject(targetPath);
  fs.rmSync(targetPath, {
    recursive: true,
    force: true,
    maxRetries: 8,
    retryDelay: 250,
  });
}

function removeStaleEntries(sourceDirectory, destinationDirectory) {
  for (const entry of fs.readdirSync(destinationDirectory, { withFileTypes: true })) {
    const sourceEntry = path.join(sourceDirectory, entry.name);
    const destinationEntry = path.join(destinationDirectory, entry.name);

    if (!fs.existsSync(sourceEntry)) {
      removePath(destinationEntry);
      continue;
    }

    if (entry.isDirectory() && fs.statSync(sourceEntry).isDirectory()) {
      removeStaleEntries(sourceEntry, destinationEntry);
    }
  }
}

assertInsideProject(distDir);
assertExists(path.join(projectRoot, designSystemHref));
fs.mkdirSync(distDir, { recursive: true });

const expectedTopLevel = new Set([
  ...pages,
  "index.html",
  ...publicDirectories,
  ...securityFiles,
]);

for (const entry of fs.readdirSync(distDir)) {
  if (!expectedTopLevel.has(entry)) {
    removePath(path.join(distDir, entry));
  }
}

for (const page of pages) {
  const sourcePage = path.join(projectRoot, page);
  assertPageUsesDesignSystem(sourcePage);
  if (page === "sitio.html") assertSitioIntegrity(sourcePage);
  copyFile(sourcePage, path.join(distDir, page));
}

// La misma pagina se sirve en la raiz del sitio.
copyFile(path.join(distDir, "sitio.html"), path.join(distDir, "index.html"));

for (const directory of publicDirectories) {
  copyDirectory(
    path.join(projectRoot, directory),
    path.join(distDir, directory),
  );
}

for (const securityFile of securityFiles) {
  copyFile(
    path.join(projectRoot, "security", securityFile),
    path.join(distDir, securityFile),
  );
}

console.log("Build completado: dist/ fue reconstruida desde las fuentes del proyecto.");
console.log(`Paginas: ${pages.join(", ")}`);
console.log(`Carpetas publicas: ${publicDirectories.join(", ")}`);
console.log(`Seguridad: ${securityFiles.join(", ")}`);
