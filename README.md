<p align="center">
  <img src="docs/assets/chaos-skull.png" alt="Path of Building for Humans emblem: a bronze skull holding a chaos orb" width="220" />
</p>

<h1 align="center">Path of Building for Humans</h1>

<p align="center">
  <em>Same builds. A deeper understanding.</em>
</p>

<p align="center">
  A build planning companion for Path of Exile focused on clarity, guidance and actionable recommendations.
</p>

---

## Why this exists

[Path of Building](https://pathofbuilding.community/) is an incredibly powerful tool. It tracks every damage
multiplier, every defensive layer and every interaction in a build, and the community could not theorycraft
without it.

But it speaks the language of spreadsheets. It tells you **what the numbers are**, not **what they mean** or
**what to do next**. A new or returning player can open a build and see hundreds of stats, tabs and toggles,
and still not know:

- Is my build actually good?
- What is wrong with it?
- What single change would help the most?

Path of Building has the power. It lacks the human touch.

**Path of Building for Humans** keeps the same builds and turns them into answers: a clear verdict, the
problems that matter, and the next upgrade worth chasing.

## The 10-second rule

The dashboard is the first screen every player sees. It must answer three questions within ten seconds:

1. **How strong is my build?** An overall build score from 1 to 10, plus core metrics (DPS, EHP).
2. **What is wrong with my build?** Detected issues, ranked by severity, with their expected impact.
3. **What should I improve next?** The single highest-impact upgrade, with its estimated gain.

## Features

| Feature | Status |
|---|---|
| Dashboard with build health, score and core metrics | Prototype (mock data) |
| Scholar's Verdict: plain-language build summary | Prototype (mock data) |
| Critical issues with severity and expected impact | Prototype (mock data) |
| Next best upgrade recommendation | Prototype (mock data) |
| Desktop app with a custom title bar (Windows portable `.exe`) | Available |
| Path of Building import | Planned (v0.2) |
| Item comparison | Planned (v0.2) |
| Build analysis and upgrade advisor | Planned (v0.3) |
| Build snapshots and history | Planned |

## Visual identity: the Atlas Archivist

The application is not a game UI, and it is not a SaaS dashboard. It is an **Atlas research tool**: an exiled
scholar studying character builds through ancient codices, celestial maps and recovered artifacts.

- Problems are presented as **threats**; solutions as **remedies**.
- Items are presented as **artifacts**; builds as **archived records**.
- Materials: black iron, dark vellum, aged bronze and old bone. No bright blues, plastic surfaces or neon.

The full guide lives in [`docs/visual_language.md`](docs/visual_language.md).

## Roadmap

- **v0.1** Dashboard, mock data, Atlas Archive UI, desktop app
- **v0.2** Path of Building import, item comparison
- **v0.3** Build analysis, upgrade advisor

See [`docs/roadmap.md`](docs/roadmap.md) and the RFCs in [`rfc/`](rfc).

## Getting started

Requirements: [Node.js](https://nodejs.org/) 22 or newer.

```bash
cd frontend/frontend
npm install
npm run dev
```

Then open http://localhost:5173.

### Desktop app

The desktop app is built with [Tauri](https://tauri.app/). It opens in its own window with a themed title bar,
custom window controls and a bronze border on Windows 11.

To run it locally you also need [Rust](https://www.rust-lang.org/tools/install):

```bash
cd frontend/frontend
npm run desktop:dev
```

To build it locally:

```bash
npm run desktop:build
```

The executable is written to `frontend/frontend/src-tauri/target/release/`.

**Portable Windows build without installing Rust:** every push that changes the frontend runs the
**Desktop app (Windows portable)** workflow in GitHub Actions. Open the run in the **Actions** tab and download
the `PathOfBuildingForHumans-windows-portable` artifact. It is a single `.exe` that runs without installation
on Windows 10 and 11 (it uses the WebView2 runtime that ships with Windows).

## Project structure

```
docs/                  Vision, roadmap, competitor analysis and visual language
rfc/                   Design proposals (MVP, dashboard, visual identity)
frontend/frontend/     React + TypeScript + Vite + Tailwind app
  src/assets/atlas/    Painted art, frames and textures (WebP)
  src/components/      Atlas frames, medallions, cards and window controls
  src/pages/           Dashboard
  src-tauri/           Desktop app (Tauri)
.github/workflows/     Windows portable build
```

## Disclaimer

Path of Building for Humans is a fan-made project. It is not affiliated with or endorsed by Grinding Gear Games
or the Path of Building Community. Path of Exile is a trademark of Grinding Gear Games.
