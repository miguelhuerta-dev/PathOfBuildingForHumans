# Roadmap

What has shipped, what comes next and what waits on others. Details of each
version are in the [CHANGELOG](../CHANGELOG.md).

## Shipped

| Version | What it brought |
|---|---|
| v0.1 | The Atlas Archive interface and the desktop app |
| v0.2.0 | Live character from the public profile, the Path of Building engine, guides with stages, the upgrade advisor |
| v0.3.0 | Passive and Atlas tree maps with the game's own icons; the single-file portable app |
| v0.4.0 | Guide tracking per stage: gear, gem links and their sources, ascension, bandits, pantheon, glossary |
| v0.5.0 | The Forge, modifiers by kind, Best Next Passives, progress, Spanish and the visual tour |

## Since v0.5.0 (not released yet)

- The class or ascendancy picture beside the character's name, read from the game.
- The Atlas page explains why the player's Atlas is marked by hand.
- Quality checks on every push, tests for the diagnostic rules and for Spanish
  coverage, and the [new league checklist](new-league.md).

## Next

- **Atlas, faster by hand:** a guide's Atlas link applies as soon as it is
  pasted, and one click marks the whole path to a passive.
- **Keep up with each league** following [`new-league.md`](new-league.md):
  engine, trees, rules, gem sources and game files.
- **More tests** where a league change would hurt most: guide imports and the
  engine bridge.

## Waiting on others

- **Reading the player's Atlas.** GGG's API has it (`account:league_accounts`),
  but only through their official login, and GGG is not accepting new
  applications right now. The app will offer it once they do.
- **Code signing.** Wired in the release workflow with SignPath Foundation;
  it starts once the project is accepted. Until then Windows SmartScreen warns
  on first launch.

## Later, if players ask

- League meta and prices beyond the Forge (poe.ninja).
- macOS and Linux builds.
