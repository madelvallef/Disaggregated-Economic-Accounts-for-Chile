# Instructions for AI agents (Codex, Claude, Copilot, etc.)

This file is intentionally ASCII-only so it can never be corrupted by
encoding issues. Read it fully before editing anything in this repo.

## CRITICAL RULE 1 - ENCODING (UTF-8, NO MOJIBAKE)

This site has lots of Spanish text (accents, enye, inverted punctuation).
Encoding regressions happen constantly and are treated as serious bugs.

- ALL text files in this repo are UTF-8. `sitio.html` is UTF-8 with BOM.
  Never re-save any file as Windows-1252 / Latin-1 / UTF-16.
- NEVER introduce broken sequences like: A-tilde + acute (the classic
  "mojibake" you get when UTF-8 is read as CP1252). If Spanish text you
  are writing looks like `A~n` garbage instead of a clean accented
  character, STOP and fix your tooling before saving.
- On Windows PowerShell 5.1, `Out-File` and `Set-Content` write UTF-16
  by default. Always pass `-Encoding utf8`. Prefer editing with tools
  that read and write UTF-8 natively.
- AFTER EVERY EDIT that touches copy, labels, translations or long
  HTML/JS blocks, run:

      npm.cmd run validate

  It fails loudly on any mojibake line. Do not finish a task with a
  failing validate.
- If mojibake ever appears (yours or pre-existing), repair it with:

      npm.cmd run fix:mojibake

  (deterministic repair script: `scripts/fix-mojibake.js`; it also
  reports residual lines it could not map). Then re-run validate.

## CRITICAL RULE 2 - NO SCREENSHOTS OF THE PAGE

Do NOT try to screenshot or eval-JS this page (heavy DOM + strict CSP
without 'unsafe-eval'; capture tools time out). For any visual check,
ask the user to share an image of the relevant module/state.

## Project layout (short version)

- `sitio.html` - THE site. Single page, all modules, inline CSS/JS.
- `web_materiales/data/module3_app.js`, `module4_app.js`,
  `module4_engine.js` - module apps loaded by sitio.html. They consume
  globals defined in sitio.html's inline script.
- `web_materiales/data/module2_distribution.js` - data payload
  (`window.module2Data`). Do not hand-edit.
- `scripts/build.js` - copies the site into `dist/`.
- `scripts/validate-sitio.js` - structure + encoding validation.
- `qa/sitio-smoke.js` - Playwright smoke test (`npm.cmd run smoke`).
- `_archivo/` - archived/legacy material. Never ship or link to it.

## Workflow expectations

- Run `npm.cmd run validate` after every meaningful edit.
- Run `npm.cmd run build` before checking the served site in `dist/`.
- See `CLAUDE.md` for design decisions (module layout, topbar, copy
  that must not change without asking).
