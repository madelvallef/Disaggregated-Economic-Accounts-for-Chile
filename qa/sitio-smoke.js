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
            if (window.matchMedia("(max-width: 820px)").matches) {
              const actions = document.querySelector(".site-header .header-actions").getBoundingClientRect();
              const toggle = document.querySelector("[data-mobile-menu-toggle]").getBoundingClientRect();
              const navStyle = getComputedStyle(document.querySelector(".site-header .site-nav"));
              return actions.left >= brand.right - 1
                && toggle.width >= 44
                && toggle.height >= 44
                && navStyle.visibility === "hidden";
            }
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

        await page.locator("#module-4").scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        const producerChange = await page.evaluate(async () => {
          const selectedTerritory = document.getElementById("m4d-sel-prov");
          const selectedSector = document.getElementById("m4d-sel-sec");
          const impact = document.getElementById("m4d-impact");
          const map = document.getElementById("m4d-map");
          const tabs = [...document.querySelectorAll("#module-4 .m4d-tab")];
          const bars = document.getElementById("m4d-bars");
          const heatmap = document.getElementById("m4d-hm");
          if (!selectedTerritory || !selectedSector || !impact || !map || !bars || !heatmap || tabs.length !== 3) return null;

          const renderView = async (index, element) => {
            tabs[index].click();
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return element.innerHTML;
          };

          const before = {
            territory: selectedTerritory.value,
            sector: selectedSector.value,
            impact: impact.textContent.trim(),
            map: map.innerHTML,
            bars: await renderView(1, bars),
            heatmap: await renderView(2, heatmap),
          };
          tabs[0].click();
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          selectedTerritory.value = "Antofagasta";
          selectedTerritory.dispatchEvent(new Event("change", { bubbles: true }));
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          return {
            before,
            after: {
              territory: selectedTerritory.value,
              sector: selectedSector.value,
              impact: impact.textContent.trim(),
              map: map.innerHTML,
              bars: await renderView(1, bars),
              heatmap: await renderView(2, heatmap),
            },
          };
        });
        assert(producerChange, "desktop: no se encontraron los controles de productor M4");
        if (producerChange) {
          assert(producerChange.after.territory === "Antofagasta", "desktop: M4 no acepta cambiar el territorio");
          assert(producerChange.after.sector === producerChange.before.sector, "desktop: M4 cambió el sector al seleccionar un territorio");
          assert(producerChange.after.impact !== producerChange.before.impact, "desktop: M4 no actualiza la elasticidad al cambiar territorio");
          assert(producerChange.after.map !== producerChange.before.map, "desktop: M4 no actualiza el mapa al cambiar territorio");
          assert(producerChange.after.bars !== producerChange.before.bars, "desktop: M4 no actualiza las barras al cambiar territorio");
          assert(producerChange.after.heatmap !== producerChange.before.heatmap, "desktop: M4 no actualiza el heatmap al cambiar territorio");
        }
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
            mobileHeaderClear: (() => {
              const actions = document.querySelector(".site-header .header-actions").getBoundingClientRect();
              const toggle = document.querySelector("[data-mobile-menu-toggle]").getBoundingClientRect();
              return actions.left >= brand.right - 1 && toggle.width >= 44 && toggle.height >= 44;
            })(),
            panelClosed: getComputedStyle(nav).visibility === "hidden",
            overflowX: document.documentElement.scrollWidth - window.innerWidth,
          };
        });
        assert(englishState.lang === "en" && englishState.hasExplore, "mobile: cambio a EN incompleto");
        assert(englishState.mobileHeaderClear, "mobile: header EN solapa la marca y las acciones");
        assert(englishState.panelClosed, "mobile: menu de navegacion debe iniciar cerrado");
        assert(englishState.overflowX <= 2, `mobile EN: overflow horizontal de ${englishState.overflowX}px`);

        const menuToggle = page.locator("[data-mobile-menu-toggle]");
        await menuToggle.click();
        await page.waitForFunction(() => {
          const header = document.querySelector(".site-header");
          const nav = document.querySelector("#site-navigation");
          return header.classList.contains("mobile-nav-open")
            && getComputedStyle(nav).visibility === "visible";
        });
        assert(await menuToggle.getAttribute("aria-expanded") === "true", "mobile: menu no abre");
        assert(await page.locator("#site-navigation").getByText("Explore", { exact: true }).isVisible(), "mobile: menu EN no traduce enlaces");
        await page.keyboard.press("Escape");
        assert(await menuToggle.getAttribute("aria-expanded") === "false", "mobile: Escape no cierra el menu");

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
