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
| Connect a public pathofexile.com profile and pick a character | v0.2.0 |
| Character dashboard calculated by Path of Building: Atlas Rating, DPS, EHP | v0.2.0 |
| Scholar's Verdict and Threat Register with level-aware rules | v0.2.0 |
| Refresh when you change zone (reads the game's `Client.txt`) | v0.2.0 |
| Guides from PoB codes, pobb.in or pastebin links, with stages (Maxroll-style) | v0.2.0 |
| Recommended Artifact: guide items ranked by measured DPS/EHP gain | v0.2.0 |
| Passive tree and gem comparison against the guide | v0.2.0 |
| Desktop app with a custom title bar (Windows portable) | v0.1 |
| League meta and prices (poe.ninja) | Planned |
| Official OAuth account connection | Planned |
| Build snapshots and history | Planned |

## Visual identity: the Atlas Archivist

The application is not a game UI, and it is not a SaaS dashboard. It is an **Atlas research tool**: an exiled
scholar studying character builds through ancient codices, celestial maps and recovered artifacts.

- Problems are presented as **threats**; solutions as **remedies**.
- Items are presented as **artifacts**; builds as **archived records**.
- Materials: black iron, dark vellum, aged bronze and old bone. No bright blues, plastic surfaces or neon.

The full guide lives in [`docs/visual_language.md`](docs/visual_language.md).

## Roadmap

- **v0.1** Atlas Archive UI, desktop app
- **v0.2.0** Live character, Path of Building engine, guides with stages, upgrade advisor
- **Next** League meta and prices, official OAuth, visual passive tree

See [`docs/roadmap.md`](docs/roadmap.md) and the RFCs in [`rfc/`](rfc).

## Getting started

Requirements: [Node.js](https://nodejs.org/) 22 or newer.

```bash
cd frontend/frontend
npm install
npm run dev
```

Then open http://localhost:5173.

### How the calculations work

Damage and defence numbers come from [Path of Building Community](https://github.com/PathOfBuildingCommunity/PathOfBuilding)
(MIT licence), run headless by `src-tauri/engine/pobh_engine.lua`. Its version is pinned in
`src-tauri/engine/engine.lock.json`; bump it each league. Diagnostic thresholds live in
`src/data/rules/poe1.json`, so patch changes are data edits, not code changes.

### Desktop app

The desktop app is built with [Tauri](https://tauri.app/). It opens in its own window with a themed title bar,
custom window controls and a bronze border on Windows 11.

To run it locally you also need [Rust](https://www.rust-lang.org/tools/install) and, once, the calculation
engine (Linux or macOS; needs git, make and a C compiler):

```bash
cd frontend/frontend
scripts/setup-engine.sh
```

```bash
npm run desktop:dev
```

To build it locally:

```bash
npm run desktop:build
```

The executable is written to `frontend/frontend/src-tauri/target/release/`.

**Portable Windows build without installing Rust:** run the **Desktop app (Windows portable)** workflow from
the **Actions** tab, or push a version tag such as `v0.2.0`. Download the `PathOfBuildingForHumans-windows-portable`
artifact: a folder with `PathOfBuildingForHumans.exe` and its `engine` folder. Keep them together; no
installation is needed on Windows 10 and 11 (it uses the WebView2 runtime that ships with Windows).

## Project structure

```
docs/                  Vision, roadmap, competitor analysis and visual language
rfc/                   Design proposals (MVP, dashboard, visual identity)
frontend/frontend/     React + TypeScript + Vite + Tailwind app
  src/analysis/        Diagnostic rules engine
  src/assets/atlas/    Original painted art, frames and textures (WebP)
  src/components/      Atlas frames, medallions, cards, shared controls (ui.tsx)
  src/data/rules/      Per-patch diagnostic thresholds
  src/pages/           Character dashboard, guide, atlas and about pages
  src/state/           Account, character and guide state
  src-tauri/           Desktop app (Tauri): PoE profiles, guide decoding, Client.txt watcher
  src-tauri/engine/    Path of Building bridge and pinned engine versions
  scripts/             Engine setup for development
.github/workflows/     Windows portable build
```

## Disclaimer

Path of Building for Humans is a fan-made project. It is not affiliated with or endorsed by Grinding Gear Games
or the Path of Building Community. Path of Exile is a trademark of Grinding Gear Games.
