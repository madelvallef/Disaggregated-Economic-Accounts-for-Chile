"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { chromium } = require("playwright");

const projectRoot = path.resolve(__dirname, "..");
const failures = [];
const browserErrors = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".csv": "text/csv; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".otf": "font/otf",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
  }[extension] || "application/octet-stream";
}

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const requested = pathname === "/" ? "sitio.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(projectRoot, requested);
  const relative = path.relative(projectRoot, filePath);

  if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": contentType(filePath) });
  fs.createReadStream(filePath).pipe(response);
});

async function run() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch();

  try {
    for (const viewport of [
      { name: "desktop", width: 1280, height: 720 },
      { name: "mobile", width: 390, height: 844 },
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      page.on("console", (message) => {
        if (message.type() === "error") {
          browserErrors.push(`${viewport.name}: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => browserErrors.push(`${viewport.name}: ${error.message}`));
      page.on("requestfailed", (request) => {
        browserErrors.push(`${viewport.name}: ${request.failure()?.errorText || "failed"} ${request.url()}`);
      });

      await page.goto(`${baseUrl}/sitio.html`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);

      const state = await page.evaluate(() => {
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
        const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
        const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
        const shellHeights = [2, 3, 4].map((module) => {
          const selector = module === 4 ? ".m4-shell" : ".module-two-shell";
          return Math.round(
            document.querySelector(`#module-${module} ${selector}`).getBoundingClientRect().height,
          );
        });
        return {
          missing: requiredIds.filter((id) => !document.getElementById(id)),
          duplicates,
          m2Paths: document.querySelectorAll("#module-2 svg path").length,
          m3Paths: document.querySelectorAll("#module-3 svg path").length,
          m4Children: document.querySelector("#module-4 .m4-shell").children.length,
          shellHeights,
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          headerLayoutOk: (() => {
            const brand = document.querySelector(".site-header .brand").getBoundingClientRect();
            const nav = document.querySelector(".site-header .site-nav").getBoundingClientRect();
            return nav.left >= brand.right - 1;
          })(),
        };
      });

      assert(!state.missing.length, `${viewport.name}: faltan secciones ${state.missing.join(", ")}`);
      assert(!state.duplicates.length, `${viewport.name}: IDs duplicados ${state.duplicates.join(", ")}`);
      assert(state.m2Paths > 0, `${viewport.name}: M2 no dibujo el mapa`);
      assert(state.m3Paths > 0, `${viewport.name}: M3 no dibujo el mapa`);
      assert(state.m4Children > 0, `${viewport.name}: M4 no se inicializo`);
      assert(state.overflowX <= 2, `${viewport.name}: overflow horizontal de ${state.overflowX}px`);
      assert(state.headerLayoutOk, `${viewport.name}: header con marca y navegacion solapadas`);

      if (viewport.name === "desktop") {
        const spread = Math.max(...state.shellHeights) - Math.min(...state.shellHeights);
        assert(spread <= 2, `desktop: alturas M2/M3/M4 no coinciden (${state.shellHeights.join("/")})`);
      } else {
        const english = page.locator('.site-header [data-lang="en"]');
        assert(await english.count() === 1, "mobile: selector EN no es unico");
        await english.click();
        await page.waitForTimeout(150);
        const englishState = await page.evaluate(() => {
          const nav = document.querySelector(".site-header .site-nav");
          const brand = document.querySelector(".site-header .brand").getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          return {
            lang: document.documentElement.lang,
            hasExplore: [...nav.querySelectorAll("a")].some((link) => link.textContent.trim() === "Explore"),
            mobileInline: navRect.left >= brand.right - 1,
            overflowX: document.documentElement.scrollWidth - window.innerWidth,
          };
        });
        assert(englishState.lang === "en" && englishState.hasExplore, "mobile: cambio a EN incompleto");
        assert(englishState.mobileInline, "mobile: header EN solapa la marca y la navegacion");
        assert(englishState.overflowX <= 2, `mobile EN: overflow horizontal de ${englishState.overflowX}px`);

        const spanish = page.locator('.site-header [data-lang="es"]');
        assert(await spanish.count() === 1, "mobile: selector ES no es unico");
        await spanish.click();
        await page.waitForTimeout(150);

        await page.locator("#module-2").scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        const controls = page.locator(".mob-ctrl-fab.is-on");
        const top = page.locator(".mob-top-fab.is-on");
        assert(await controls.isVisible(), "mobile: boton Controles no visible");
        assert(await top.isVisible(), "mobile: boton Top no visible");

        await controls.click();
        assert(
          await page.locator("#module-2 .m2-panel.is-drawer-open").isVisible(),
          "mobile: drawer de Controles no abre",
        );
        await page.locator(".mob-drawer-close").click();

        await top.click();
        assert(
          await page.locator(".mobile-top-panel.is-open").isVisible(),
          "mobile: vista Top no abre",
        );
        const rows = await page.locator(".mobile-top-panel .rank-chip").count();
        assert(rows > 0, "mobile: vista Top no contiene ranking");
        await page.locator(".mobile-top-close").click();

        // Las tres perspectivas de cada módulo deben poder verse sin que la
        // página se ensanche. Una matriz puede conservar scroll interno o
        // ajustarse íntegramente al visor, siempre que no pierda legibilidad.
        const mobileViews = [
          { module: "#module-2", tab: '#module-2 .module-tab[data-view="sector"]', figure: "#module-2 #sector-bars", label: "M2 sectorial" },
          { module: "#module-2", tab: '#module-2 .module-tab[data-view="matrix"]', figure: "#module-2 .matrix-scroll", matrix: true, label: "M2 territorial-sectorial" },
          { module: "#module-3", tab: '#module-3 .module-tab[data-module3-view="sector"]', figure: "#module-3 #m3-sector-bars", label: "M3 sectorial" },
          { module: "#module-3", tab: '#module-3 .module-tab[data-module3-view="matrix"]', figure: "#module-3 .matrix-scroll", matrix: true, label: "M3 territorial-sectorial" },
          { module: "#module-4", tab: "#module-4 .m4d-tab:nth-child(2)", figure: "#module-4 #m4d-bars", label: "M4 sectorial" },
          { module: "#module-4", tab: "#module-4 .m4d-tab:nth-child(3)", figure: "#module-4 .m4d-hm-scroll", matrix: true, label: "M4 territorial-sectorial" },
        ];
        for (const view of mobileViews) {
          await page.locator(view.module).scrollIntoViewIfNeeded();
          await page.locator(view.tab).click();
          await page.waitForTimeout(300);
          const result = await page.locator(view.figure).evaluate((element, matrix) => {
            const rect = element.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              scrollWidth: element.scrollWidth,
              scrollHeight: element.scrollHeight,
              svgWidth: element.querySelector("svg")?.getBoundingClientRect().width || 0,
              svgHeight: element.querySelector("svg")?.getBoundingClientRect().height || 0,
              overflowX: document.documentElement.scrollWidth - window.innerWidth,
              matrix,
            };
          }, view.matrix || false);
          assert(result.width > 220 && result.height > 100, `mobile: ${view.label} no tiene una figura util`);
          assert(result.overflowX <= 2, `mobile: ${view.label} genera overflow horizontal de ${result.overflowX}px`);
          if (view.matrix) {
            assert(
              result.scrollWidth > result.width ||
              result.scrollHeight > result.height ||
              (result.svgWidth > 0 && result.svgWidth <= result.width + 2 && result.svgHeight <= result.height + 2),
              `mobile: ${view.label} no tiene una matriz desplazable ni ajustada al visor`,
            );
          }
        }
      }

      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  failures.push(...browserErrors);
  if (failures.length) {
    console.error(`QA FAIL: ${failures.length} problema(s).`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log("QA OK: sitio.html funciona en desktop y mobile.");
}

run().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
