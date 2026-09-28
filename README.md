# Genshi Studio (源始)

An experimental browser-based tool for drawing and generating patterns (including traditional Japanese patterns), written in React/TypeScript with a Canvas/WebGL renderer.

伝統文様などをブラウザ上で描画・生成する実験的なグラフィックツール（2025年7月にマルチエージェントAIで試作。未完成）。

## Status

**Experimental prototype — not finished, not maintained.** The code was produced in about one week (July 9–16, 2025) by the author's multi-agent AI development system, as an experiment in agent-driven development. The code base is large (roughly 58k lines of TypeScript), but many modules were never fully integrated or tested in a browser. Several features described in earlier versions of this README were not reachable in the deployed app, or were not backed by any measurement. Those claims have been removed.

The owner has further local work that was never pushed. This repository only reflects the state on GitHub as of 2025-07-16.

**Works (as far as the code and deploy history show)**
- Vite + React app, deployed to GitHub Pages by GitHub Actions (last successful deployment 2025-07-16)
- Home / Gallery / About pages
- `/studio`: a unified canvas with Draw / Parametric / Code / Growth modes. If the WebGL-based system fails to initialise, it falls back to a simplified 2D drawing mode
- Pattern definitions for eight Japanese patterns (Asanoha, Seigaiha, Shippo, Kikkoumon, Ichimatsu, Kagome, Sayagata, Tatewaku) in `src/patterns/JapanesePatterns.ts`
- Export from the studio dialog to PNG, SVG and JSON
- Brush size and opacity respond to pointer pressure (`PointerEvent.pressure`), with a separate `/pressure-test` page for trying it out

**Partial / not wired into the live UI**
- Monaco-based code editor, parametric pattern editor and "Interactive Growth Studio" components exist, but they are only used by `StudioPage.tsx`, which is not routed. The live `/studio` route uses `StudioPageUnified.tsx`
- `VectorExportService.ts` contains PDF (jsPDF + svg2pdf) and EPS export code, but the export dialog only offers PNG/SVG/JSON
- Pen tilt and twist are hard-coded to 0 in the main canvas. Only pressure is read
- Bidirectional "code ⇄ drawing" translation and sync engines (`src/core/`) exist as modules and demos. Whether they behave correctly end-to-end has not been checked
- Pattern selector: applying a pattern with the current parameters is marked `TODO` (`PatternSelector.tsx`)
- PWA: a manifest and service worker are included, but offline behaviour was never verified

**Not implemented**
- Real-time collaboration, pattern sharing, mobile app (these appeared in an earlier roadmap)
- No performance benchmarks exist. Earlier claims such as "40% faster rendering" are not supported by any measurement in this repository

**Known issues**
- The last recorded Playwright run (2025-07-11) had 10 passing and 16 failing tests
- Earlier agent reports in the repo describe white screens, initialisation timeouts and mobile layout problems. Later commits tried to fix these, but the fixes were not re-verified
- The repository root has many agent-generated reports, logs and scripts (`*_SUMMARY.md`, `*_REPORT.md`, `developer_*.py`, `*.json`). They record the agents' process and claims. They are **not** verified documentation
- Links in the old README to `CONTRIBUTING.md` and to a hosted `/docs/` page pointed to files that do not exist

## Demo

https://bob-takuya.github.io/genshi-studio/ — deployed 2025-07-16. Expect rough edges. The studio may start in fallback mode depending on the browser/GPU.

## Background

Built in July 2025 as a test case for the author's multi-agent AI system ("AI Creative Team"). In that system, coordinator, architect, developer, tester and reviewer agents planned and implemented the app. It was inspired by @baku89's idea of programmable creativity, and by `ichimatsu_gen`, which served as a reference for pattern generation. The project mainly documents what that workflow produced, not a finished product.

## Development

```bash
npm ci
npm run dev       # dev server (port 3001)
npm run build     # production build into dist/ (base path /genshi-studio/)
npm run preview
```

E2E tests are under `tests/` (Playwright, config in `playwright.config.ts`). They were not passing when development stopped.

Main structure:

```
src/
  pages/            HomePage, StudioPageUnified (live /studio), StudioPage (unrouted), Gallery, About, PressureTest
  components/studio canvas, toolbar, export dialog, editors
  graphics/         canvas / WebGL engine, pattern generators
  core/             unified editing system, code⇄drawing translation, sync
  patterns/         Japanese pattern definitions
  services/         pattern storage, vector export
```

## Related

- [archi-site](https://github.com/bob-takuya/archi-site) — built with the same AI-agent workflow in the same period

## License

MIT — see [LICENSE](LICENSE).
