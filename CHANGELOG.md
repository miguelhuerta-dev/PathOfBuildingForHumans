# Changelog

## v0.3.0

### New

- **Passive tree map on the Guide page.** Your character's tree is drawn next to the guide's: what you have
  taken (gold), what the guide still asks for (verdigris) and what the guide does not use (bronze). The map opens
  framing both, masteries show the effect each of you chose, and "Next on your path" lists the closest
  notables, keystones, masteries and jewel sockets you are missing. A note warns when the guide is for another
  class.
- **Atlas page.** The Atlas passive tree drawn over the star atlas. Follow a guide's official Atlas tree link,
  mark the passives you have, and see what comes next and your progress per mechanic, kept per league.
- **The game's own icons.** Both trees show each passive's icon, read from your Path of Exile installation
  (Steam or Epic, any drive). They are never bundled with the app nor downloaded.
- **Official item icons** for your gear, the guide's items and the recommended artifacts.
- **One-file portable app.** The Windows app is a single ~25 MB executable with the calculation engine inside.
  Tables only some builds need (timeless and abyss jewels, ~170 MB) are downloaded the first time a build uses
  one.

### Changed

- The chaos skull emblem stands for every exile in the character header and list, instead of class portraits.
- `Client.txt` is found in any Steam library, not only on drive C:.

### Fixed

- A stuck calculation is stopped after two minutes instead of waiting forever.
- Guide links and every other download have a time limit.
- An older result no longer replaces a newer one when you change guide stage or zone quickly.
- Zone names with accents in `Client.txt` are read correctly.

## v0.2.0

- Connect a public pathofexile.com profile and pick a character.
- Character dashboard calculated by Path of Building: Atlas Rating, DPS, EHP.
- Scholar's Verdict and Threat Register with level-aware rules.
- Refresh when you change zone.
- Guides from PoB codes, pobb.in or pastebin links, with stages.
- Recommended Artifact: guide items ranked by measured DPS/EHP gain.
- Passive tree and gem comparison against the guide.

## v0.1

- Atlas Archive interface and the desktop app with its own title bar.
