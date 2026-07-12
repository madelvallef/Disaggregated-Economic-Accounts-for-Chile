"use strict";
/*
 * CedTreeSelect — selector jerarquico con busqueda por texto, arbol siempre
 * visible (macrozona>region>provincia / industria>sector>actividad) y modo
 * multi-seleccion (checkboxes tri-state) o single-seleccion (una hoja).
 *
 * Vanilla JS, sin dependencias, CSP-safe (sin eval). En modo multi NO
 * gestiona el estado de seleccion: emite/lee los mismos checkboxes
 * <input type="checkbox" data-filter-group="<groupPrefix>-<level>" value="...">
 * que ya consume el listener delegado existente en `.filter-stack`
 * (ver updateFilterOptions/syncGeoSelections en sitio.html), asi que el
 * cascadeo padre->hijos y el resto de la logica de estado no se tocan.
 */
(function (global) {
  function normalize(text) {
    // Quita marcas diacriticas combinantes (codepoints 0x0300-0x036f) tras
    // NFD, sin usar un literal de rango Unicode en el regex (evita que un
    // editor con encoding CP1252 lo corrompa; ver AGENTS.md).
    const decomposed = String(text == null ? "" : text).normalize("NFD").toLowerCase();
    let out = "";
    for (const ch of decomposed) {
      const code = ch.codePointAt(0);
      if (code >= 0x0300 && code <= 0x036f) continue;
      out += ch;
    }
    return out;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function flatten(tree, level, out) {
    for (const node of tree) {
      out.push({ node, level });
      if (node.children && node.children.length) flatten(node.children, level + 1, out);
    }
  }

  function create(opts) {
    const {
      mount,
      mode = "multi",
      levels,
      groupPrefix = null,
      tree: initialTree,
      getSelection = () => ({}),
      onSelect = null,
      onAfterToggle = null,
      showActions = true,
      i18n = () => ({}),
    } = opts;

    let tree = initialTree || [];
    let open = false;
    let searchTerm = "";

    const root = document.createElement("div");
    root.className = "ts-select";
    root.dataset.mode = mode;
    root.innerHTML = `
      <button type="button" class="ts-trigger" aria-haspopup="true" aria-expanded="false">
        <span class="ts-summary"></span><span class="ts-caret" aria-hidden="true">&#9662;</span>
      </button>
      <div class="ts-pop" hidden>
        <div class="ts-tools">
          <input type="search" class="ts-search" autocomplete="off" spellcheck="false">
          <div class="ts-actions"></div>
        </div>
        <div class="ts-tree" role="tree"></div>
        <div class="ts-empty" hidden></div>
      </div>
    `;
    mount.innerHTML = "";
    mount.appendChild(root);

    const trigger = root.querySelector(".ts-trigger");
    const summaryEl = root.querySelector(".ts-summary");
    const pop = root.querySelector(".ts-pop");
    const searchInput = root.querySelector(".ts-search");
    const actionsEl = root.querySelector(".ts-actions");
    const treeEl = root.querySelector(".ts-tree");
    const emptyEl = root.querySelector(".ts-empty");

    if (mode === "multi" && showActions) {
      actionsEl.innerHTML = `
        <button type="button" class="ts-act" data-ts-act="all"></button>
        <button type="button" class="ts-act" data-ts-act="clear"></button>
      `;
    }

    function nodeGroup(level) {
      return groupPrefix ? `${groupPrefix}-${level}` : level;
    }

    function renderNodeHtml(node, level, depth) {
      const levelKey = levels[level];
      const hasKids = node.children && node.children.length > 0;
      const group = nodeGroup(levelKey);
      const rowInner = mode === "multi"
        ? `<label class="ts-check">
             <input type="checkbox" data-filter-group="${escapeHtml(group)}" value="${escapeHtml(String(node.value))}">
             <span class="ts-lbl">${escapeHtml(node.label)}</span>
           </label>`
        : `<button type="button" class="ts-opt" data-ts-level="${escapeHtml(levelKey)}" data-ts-value="${escapeHtml(String(node.value))}" data-ts-label="${escapeHtml(node.label)}">${escapeHtml(node.label)}</button>`;
      const toggleBtn = hasKids
        ? `<button type="button" class="ts-tog" tabindex="-1" aria-expanded="false"><svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg></button>`
        : `<span class="ts-tog ts-tog-spacer"></span>`;
      const childrenHtml = hasKids
        ? `<div class="ts-children" hidden>${node.children.map((child) => renderNodeHtml(child, level + 1, depth + 1)).join("")}</div>`
        : "";
      return `<div class="ts-node" data-ts-node-level="${escapeHtml(levelKey)}" data-ts-node-value="${escapeHtml(String(node.value))}" data-ts-depth="${depth}">
        <div class="ts-row" style="padding-left:${depth * 16}px">
          ${toggleBtn}
          ${rowInner}
        </div>
        ${childrenHtml}
      </div>`;
    }

    function renderTreeHtml() {
      treeEl.innerHTML = tree.map((node) => renderNodeHtml(node, 0, 0)).join("");
    }

    function labelSummary() {
      const t = i18n();
      if (mode === "single") return summaryEl.textContent || t.summaryNone || "";
      const selection = getSelection();
      const leafLevel = levels[levels.length - 1];
      // El nivel hoja (provincia/actividad) siempre queda poblado cuando hay
      // algo seleccionado en cualquier nivel (el cascadeo padre->hijos de
      // syncGeoSelections/syncSectorSelections lo garantiza), asi que basta
      // con mirar el array del nivel hoja para saber cuanto hay seleccionado.
      const leafSelected = (selection[leafLevel] || []).length;
      if (leafSelected === 0) return t.summaryAll || "";
      const flat = [];
      flatten(tree, 0, flat);
      const allLeafCount = flat.filter((entry) => entry.level === levels.length - 1).length;
      if (leafSelected >= allLeafCount) return t.summaryAll || "";
      return (t.summaryN || "{n} seleccionados").replace("{n}", String(leafSelected));
    }

    function refresh() {
      if (mode === "multi") {
        const selection = getSelection();
        // Primera pasada: checked = valor presente en el nivel correspondiente
        // del objeto de seleccion externo (unica fuente de verdad).
        const allNodes = Array.from(treeEl.querySelectorAll(".ts-node"));
        allNodes.forEach((nodeEl) => {
          const level = nodeEl.dataset.tsNodeLevel;
          const value = nodeEl.dataset.tsNodeValue;
          const cb = nodeEl.querySelector(":scope > .ts-row .ts-check input");
          if (!cb) return;
          cb.checked = (selection[level] || []).includes(value);
          cb.indeterminate = false;
        });
        // Segunda pasada, de hojas hacia la raiz (orden inverso del DOM: los
        // nodos mas profundos aparecen despues en document order): un padre
        // no marcado queda indeterminate si algun descendiente SI lo esta
        // (marcado o ya calculado como indeterminate en esta misma pasada).
        for (let i = allNodes.length - 1; i >= 0; i -= 1) {
          const nodeEl = allNodes[i];
          const childrenWrap = nodeEl.querySelector(":scope > .ts-children");
          if (!childrenWrap) continue;
          const cb = nodeEl.querySelector(":scope > .ts-row .ts-check input");
          if (!cb || cb.checked) continue;
          cb.indeterminate = !!childrenWrap.querySelector(
            'input[type="checkbox"]:checked, input[type="checkbox"]:indeterminate'
          );
        }
      }
      summaryEl.textContent = labelSummary();
      applySearch();
    }

    function applySearch() {
      const t = i18n();
      const term = normalize(searchTerm.trim());
      let anyVisible = false;
      if (!term) {
        treeEl.querySelectorAll(".ts-node").forEach((el) => { el.hidden = false; });
        treeEl.querySelectorAll(".ts-lbl, .ts-opt").forEach((el) => { el.innerHTML = escapeHtml(el.textContent); });
        anyVisible = true;
      } else {
        const matchCache = new Map();
        const selfMatches = (el) => normalize(el.dataset.tsNodeValue + " " + (el.querySelector(":scope > .ts-row .ts-lbl, :scope > .ts-row .ts-opt")?.textContent || "")).includes(term);
        const descendantMatches = (el) => {
          if (matchCache.has(el)) return matchCache.get(el);
          let found = selfMatches(el);
          el.querySelectorAll(":scope > .ts-children > .ts-node").forEach((child) => {
            if (descendantMatches(child)) found = true;
          });
          matchCache.set(el, found);
          return found;
        };
        treeEl.querySelectorAll(".ts-node").forEach((el) => {
          const visible = descendantMatches(el);
          el.hidden = !visible;
          if (visible) {
            anyVisible = true;
            const children = el.querySelector(":scope > .ts-children");
            if (children && children.hasChildNodes()) {
              children.hidden = false;
              const tog = el.querySelector(":scope > .ts-row .ts-tog");
              if (tog && !tog.classList.contains("ts-tog-spacer")) {
                tog.setAttribute("aria-expanded", "true");
                tog.classList.add("is-open");
              }
            }
          }
        });
        treeEl.querySelectorAll(".ts-lbl, .ts-opt").forEach((el) => {
          const raw = el.textContent;
          if (!normalize(raw).includes(term)) { el.innerHTML = escapeHtml(raw); return; }
          const idx = normalize(raw).indexOf(term);
          const before = raw.slice(0, idx);
          const hit = raw.slice(idx, idx + term.length);
          const after = raw.slice(idx + term.length);
          el.innerHTML = `${escapeHtml(before)}<mark class="ts-hit">${escapeHtml(hit)}</mark>${escapeHtml(after)}`;
        });
      }
      emptyEl.hidden = anyVisible;
      if (!anyVisible) emptyEl.textContent = t.noResults || "Sin resultados";
    }

    function setLang() {
      const t = i18n();
      searchInput.placeholder = t.search || "Buscar…";
      if (mode === "multi") {
        const allBtn = actionsEl.querySelector('[data-ts-act="all"]');
        const clearBtn = actionsEl.querySelector('[data-ts-act="clear"]');
        if (allBtn) allBtn.textContent = t.all || "Todos";
        if (clearBtn) clearBtn.textContent = t.clear || "Limpiar";
      }
      summaryEl.textContent = labelSummary();
    }

    function openPop() {
      if (open) return;
      open = true;
      pop.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      root.classList.add("is-open");
      positionPop();
      searchTerm = "";
      searchInput.value = "";
      applySearch();
      requestAnimationFrame(() => searchInput.focus());
    }

    function closePop() {
      if (!open) return;
      open = false;
      pop.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      root.classList.remove("is-open");
    }

    function positionPop() {
      const rect = trigger.getBoundingClientRect();
      const viewportH = window.innerHeight;
      pop.style.left = Math.round(rect.left) + "px";
      pop.style.width = Math.max(240, Math.round(rect.width)) + "px";
      const spaceBelow = viewportH - rect.bottom;
      const maxH = Math.min(360, Math.max(180, spaceBelow - 12));
      if (spaceBelow < 220 && rect.top > spaceBelow) {
        pop.style.top = "";
        pop.style.bottom = Math.round(viewportH - rect.top + 4) + "px";
      } else {
        pop.style.bottom = "";
        pop.style.top = Math.round(rect.bottom + 4) + "px";
      }
      pop.style.maxHeight = maxH + "px";
    }

    trigger.addEventListener("click", () => { open ? closePop() : openPop(); });
    // mousedown (no "click") para cerrar al tocar afuera: es el patron
    // estandar en este tipo de popup (Bootstrap, Radix, etc.) porque se
    // dispara antes que cualquier efecto secundario del click (foco,
    // scroll-into-view del navegador) que podria alterar el target a
    // mitad de la interaccion.
    document.addEventListener("mousedown", (event) => {
      if (!open) return;
      if (root.contains(event.target)) return;
      closePop();
    }, true);
    window.addEventListener("resize", () => { if (open) positionPop(); }, { passive: true });
    window.addEventListener("scroll", () => { if (open) positionPop(); }, { passive: true, capture: true });
    document.addEventListener("keydown", (event) => {
      if (!open) return;
      if (event.key === "Escape") { closePop(); trigger.focus(); }
    });

    searchInput.addEventListener("input", () => { searchTerm = searchInput.value; applySearch(); });

    treeEl.addEventListener("click", (event) => {
      const tog = event.target.closest(".ts-tog");
      if (tog && !tog.classList.contains("ts-tog-spacer")) {
        const nodeEl = tog.closest(".ts-node");
        const children = nodeEl.querySelector(":scope > .ts-children");
        if (children) {
          const willOpen = children.hidden;
          children.hidden = !willOpen;
          tog.classList.toggle("is-open", willOpen);
          tog.setAttribute("aria-expanded", String(willOpen));
        }
        return;
      }
      if (mode === "single") {
        const opt = event.target.closest(".ts-opt");
        if (!opt) return;
        const value = opt.dataset.tsValue;
        const label = opt.dataset.tsLabel;
        summaryEl.textContent = label;
        if (typeof onSelect === "function") onSelect(value, label, opt.dataset.tsLevel);
        closePop();
      }
    });

    if (mode === "multi") {
      treeEl.addEventListener("change", () => {
        if (typeof onAfterToggle === "function") onAfterToggle();
      });
      actionsEl.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-ts-act]");
        if (!btn) return;
        const isAll = btn.dataset.tsAct === "all";
        treeEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
          if (cb.checked !== isAll) {
            cb.checked = isAll;
            cb.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
      });
    }

    function setTree(nextTree) {
      tree = nextTree || [];
      renderTreeHtml();
      refresh();
    }

    // Modo single: fija el texto mostrado en el trigger sin simular un click
    // (para inicializar con una seleccion por defecto, p.ej. el productor de
    // mayor Domar weight en Modulo 4).
    function setValue(label) {
      summaryEl.textContent = label || "";
    }

    setTree(tree);
    setLang();

    return {
      refresh,
      setTree,
      setLang,
      setValue,
      open: openPop,
      close: closePop,
      destroy() { mount.innerHTML = ""; },
    };
  }

  global.CedTreeSelect = { create };
})(window);
