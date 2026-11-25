# New league checklist

What to update when a Path of Exile league starts, in this order. Each step
names the file to change and how to check it. Run `npm run check` at the end;
it runs every test, the lint, the type check, the build and the desktop tests.

## 1. Calculation engine (Path of Building)

- Read Path of Building Community's release notes for the new league.
- Bump `pathOfBuilding.tag` in `src-tauri/engine/engine.lock.json`.
- Run `./scripts/setup-engine.ps1` and load a character and a guide in the app
  (`npm run desktop:dev`). The numbers should match Path of Building itself.
- LuaJIT and lua-utf8 only change when Path of Building asks for it.

## 2. Passive and Atlas trees

- GGG publishes them as `grindinggear/skilltree-export` and
  `grindinggear/atlastree-export`, tagged by patch (for example `3.31.0`).
- Bump `tag` in `src/data/passives/passives.lock.json`, then run
  `node scripts/update-passive-tree.mjs`.
- Bump `tag` in `src/data/atlas/atlas.lock.json`, then run
  `node scripts/update-atlas-tree.mjs`.
- Check the Atlas page in the app: the map draws, a guide's Atlas link loads,
  and new nodes show their icons (read from the game, after it has patched).
- If GGG changes the tree link format, `src/atlas/treeLink.ts` and its tests
  (`tests/treeLink.test.ts`) need the new version.

## 3. Diagnostic rules

- `src/data/rules/poe1.json` holds every threshold of the Threat Register:
  resist caps, effective HP and damage per stage, hit chance and more.
- Change only what the patch changed, then set `patch` to the new version.
- `tests/analyze.test.ts` checks the rules still behave; adjust a test only when
  the patch really changed that rule.

## 4. Gem sources

- Bump `commit` in `src/data/gems/gems.lock.json` to exile-leveling's commit for
  the new league, then run `node scripts/update-gem-sources.mjs`.
- Check a guide's Gem Links: each gem says which quest or vendor gives it.

## 5. Leagues and mechanics

- New league mechanic: add it to `ATLAS_ICON` in `src/data/leagues.ts` with the
  icon key from the new Atlas tree, if the Atlas has one.
- New ascendancies: add them to `class_art_folder` in
  `src-tauri/src/game_files/mod.rs` and to its game test.

## 6. Game files

The app reads icons and item art from the player's own installation. A patch
can move them.

- With the patched game installed, run
  `cd src-tauri; cargo test --release game_files -- --ignored --nocapture`.
- It reads every passive, Atlas, item and class picture the app uses. A failure
  names what moved.

## 7. Release

- Add the version's section to `CHANGELOG.md`.
- Only when the version is decided: bump the version, push the tag, and let
  `desktop.yml` build the app.
