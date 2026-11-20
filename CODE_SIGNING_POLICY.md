# Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by
[SignPath Foundation](https://signpath.org/).

Windows releases of Path of Building for Humans are signed so Windows can tell that the app
comes from this project and has not been changed since it was built.

## How releases are signed

- Every release binary is built by GitHub Actions from this repository's source
  (`.github/workflows/desktop.yml`), never on a personal machine.
- The build sends the unsigned app to SignPath, which signs it only after a project approver
  confirms the request.
- Only builds of version tags (`v*`) are signed with the release certificate.

## Team roles

| Role | Members |
| --- | --- |
| Committers and reviewers | [miguelhuerta-dev](https://github.com/miguelhuerta-dev) |
| Approvers | [miguelhuerta-dev](https://github.com/miguelhuerta-dev) |

All team members use multi-factor authentication on GitHub and SignPath.

## Privacy policy

This program will not transfer any information to other networked systems unless
specifically requested by the user or the person installing or operating it.

What the app connects to, and when:

- **pathofexile.com:** when you connect an account, to read the public character data
  you ask for. The app never asks for your password.
- **poe.ninja:** when you open an item in the Forge, to read its market price.
- **The guide's site** (pobb.in, Maxroll, poe.ninja, pastebin and others): when you
  paste a link to load a guide.
- **GitHub (Path of Building Community's public data):** to download jewel data the
  calculation engine needs, the first time a build uses it.

Everything the app remembers (characters, guides, progress, settings) stays on your computer.

## Components

The app and its artwork are original and published under the [MIT licence](LICENSE).
It includes open-source components under their own licences, among them
[Path of Building Community](https://github.com/PathOfBuildingCommunity/PathOfBuilding) (MIT),
[LuaJIT](https://luajit.org/) (MIT), [Tauri](https://tauri.app/) (MIT / Apache-2.0) and
[exile-leveling](https://github.com/HeartofPhos/exile-leveling) data (MIT).
Path of Exile's art is never included: the app reads it from your own game installation.
