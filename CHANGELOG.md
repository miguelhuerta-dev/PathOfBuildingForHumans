# Changelog

## v0.5.0

### New

- **The Forge.** Open any item to see what its base can roll, with tiers, odds and free prefix and suffix slots,
  essences and bench crafts, and how much DPS and EHP each modifier would add to your character, measured by
  Path of Building. Uniques say which league they come from, how to get them and their poe.ninja market price.
- **Modifiers by kind.** Item modifiers are coloured as prefix, suffix, crafted, fractured, implicit and more,
  with their tier, a colour key beside them and league marks on league-specific mods. Items open on click.
- **Best Next Passives.** Every notable and keystone within reach is tried on your character with the path to
  it, and ranked by what it adds per point spent.
- **Your Progress.** Your DPS, EHP and level over the league, charted from every change.
- **Spanish.** The whole app in English or Spanish, chosen on first launch and switchable from the bar.
- **A visual tour** after the language pick: connecting a character, making the profile public, what the app
  keeps, loading a guide and reading your build. It can be seen again from About.
- **More guide sites.** Links from Maxroll, poe.ninja, pob.codes, rentry and poedb, besides pobb.in and pastebin.

### Changed

- The window is the iron frame itself: no square window behind it, and maximised it fills the screen.
- The navigation bar stays at hand when you scroll, inside the frame, with the window buttons.
- The engine stays loaded: characters open in about a second, the last one of each account shows at once while
  fresh numbers load, and the Best Next Passives search is about six times faster.
- The Act 2 bandit is chosen per character (public profiles do not say it), so resistances are no longer 15% off.
- The Threat Register uses each character's own resistance cap and checks more problems.
- Error messages show in the chosen language.

### Fixed

- "Load a guide" no longer shows while a guide is already loaded.
- Pasting a Maxroll Path of Building code works.

## v0.4.0

### New

- **Guide stages, all of them.** Choosing a stage updates everything: its gear, gem links, passive tree, ascension
  and the comparison with your character. A stage without gear of its own shows the gear of the nearest stage
  that has it, and says so.
- **Artifacts of this Stage.** The guide's items for the stage laid out like the in-game inventory, with real
  icons (flasks and jewels included), a gold mark on what you already wear and an ember mark on what to find.
- **Gem Links.** Each gem group drawn as linked sockets with every gem's icon. Gems you still lack say where your
  class gets them in the campaign (act, quest and vendor). Beside each group, the item it goes in: the one the
  guide names, or one worked out from its links (6 links: body armour; 4: helmet, gloves or boots).
- **Ascension Path, Bandits and Pantheon.** The ascendancy passives in the order to take them per Labyrinth, who to
  help or kill in Act 2 and why, and the guide's pantheon powers.
- **Guide library.** Guides you load are remembered; the last one opens by itself with your last character.
- **Glossary.** Path of Exile's terms and the archive's own words, searchable.
- **Item art from your own game.** Items without an official icon (magic flasks, many guide bases) show the
  picture your Path of Exile installation has for them. Nothing is bundled or downloaded.

### Changed

- The pillars beside the window stand whole and sharp in the margins; a narrow window is all frame.
- The Passive Tree comes before "You and the Guide" on the Guide page.

### Fixed

- The Equipped Artifacts panel no longer jumps while you move the mouse over the item descriptions.
- Tall weapons no longer spill out of their inventory slot.

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
