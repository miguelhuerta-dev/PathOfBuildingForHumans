/**
 * The archive's glossary: Path of Exile terms and the app's own words, explained
 * in plain language. Written for this app; numbers are those of the current game.
 */

export type GlossaryCategory =
  | "Attributes"
  | "Defence"
  | "Offence"
  | "Ailments"
  | "Passive Tree"
  | "Items & Gems"
  | "Campaign & Endgame"
  | "This Archive";

export interface GlossaryEntry {
  term: string;
  category: GlossaryCategory;
  text: string;
}

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  "Attributes",
  "Defence",
  "Offence",
  "Ailments",
  "Passive Tree",
  "Items & Gems",
  "Campaign & Endgame",
  "This Archive",
];

export const GLOSSARY: GlossaryEntry[] = [
  // Attributes
  { term: "Strength", category: "Attributes", text: "Red attribute. Every 10 points give +5 maximum life and 2% increased melee physical damage. Red gems and heavy armour ask for it." },
  { term: "Dexterity", category: "Attributes", text: "Green attribute. Every 10 points give +20 accuracy and 2% increased evasion. Green gems, bows and evasion gear ask for it." },
  { term: "Intelligence", category: "Attributes", text: "Blue attribute. Every 10 points give +5 maximum mana and 2% increased energy shield. Blue gems, wands and energy shield gear ask for it." },
  { term: "Requirements", category: "Attributes", text: "Gems and items need enough of an attribute (and a level) before you can use them. Short of one, the item does nothing until you reach it." },

  // Defence
  { term: "Life", category: "Defence", text: "Your health. Reaching zero kills you. Most builds stack it from gear and passives." },
  { term: "Energy Shield", category: "Defence", text: "A blue barrier taken before life. It recharges by itself a couple of seconds after you stop taking damage." },
  { term: "Effective HP (EHP)", category: "Defence", text: "How much damage you can take before dying once your life, shields, mitigation and resistances are counted. The higher, the safer." },
  { term: "Resistances", category: "Defence", text: "Reduce fire, cold, lightning and chaos damage. Capped at 75%. The campaign lowers them as you go (to -60% after Act 10), so endgame gear must bring them back up." },
  { term: "Armour", category: "Defence", text: "Reduces physical damage from hits. Works best against many small hits, less against one huge blow." },
  { term: "Evasion", category: "Defence", text: "A chance to dodge attacks entirely. It does not help against spells." },
  { term: "Block", category: "Defence", text: "A chance to stop a hit completely. Attack block comes from shields and passives; spell block is separate." },
  { term: "Spell Suppression", category: "Defence", text: "A chance to take half damage from spells. Most often found on Dexterity gear and passives; 100% is the goal for builds that use it." },

  // Offence
  { term: "DPS", category: "Offence", text: "Damage per second: how fast your main skill kills. The archive takes it from Path of Building's full calculation." },
  { term: "Hit", category: "Offence", text: "Damage dealt at once by an attack or spell. Hits can be critical and apply ailments." },
  { term: "Damage over Time", category: "Offence", text: "Damage dealt steadily for a while (burning, poison, bleeding, degeneration). It cannot be a critical strike." },
  { term: "Critical Strike", category: "Offence", text: "A hit that deals extra damage: its chance to happen and its multiplier both matter. Many builds ignore it entirely." },
  { term: "Accuracy / Chance to Hit", category: "Offence", text: "Attacks can miss. Accuracy raises your chance to hit; below about 90% you lose a lot of damage. Spells always hit." },
  { term: "Attack vs Spell", category: "Offence", text: "Attacks use your weapon and attack speed; spells use the gem's own damage and cast speed. Many bonuses only help one of the two." },
  { term: "Minions", category: "Offence", text: "Creatures that fight for you (zombies, spectres, raging spirits). Their damage and life come from minion bonuses, not your own." },

  // Ailments
  { term: "Ignite", category: "Ailments", text: "Fire hits can set enemies burning, dealing fire damage over time." },
  { term: "Freeze & Chill", category: "Ailments", text: "Cold hits slow enemies (chill) or stop them in place (freeze)." },
  { term: "Shock", category: "Ailments", text: "Lightning hits make enemies take more damage for a few seconds." },
  { term: "Bleed", category: "Ailments", text: "Physical attack damage over time; it hurts more while the enemy moves." },
  { term: "Poison", category: "Ailments", text: "Chaos damage over time that stacks: every hit can add another poison." },
  { term: "Stun", category: "Ailments", text: "A big hit interrupts what you were doing. Stun recovery and avoidance keep you acting." },

  // Passive tree
  { term: "Passive Point", category: "Passive Tree", text: "One per level after the first, plus some from quests. Each one allocates a passive next to one you already have." },
  { term: "Notable", category: "Passive Tree", text: "A larger passive with a name and a stronger effect, usually at the end of a cluster." },
  { term: "Keystone", category: "Passive Tree", text: "A huge passive that changes how your character works, with a drawback. Builds are often planned around them." },
  { term: "Mastery", category: "Passive Tree", text: "The centre of a cluster. Once you take a notable nearby, it lets you pick one of several effects." },
  { term: "Jewel Socket", category: "Passive Tree", text: "A passive that holds a jewel. Some jewels (timeless, cluster) change the passives around them." },
  { term: "Ascendancy", category: "Passive Tree", text: "Your class's specialisation, chosen in the first Labyrinth. Its points come two at a time, from the four Labyrinths." },
  { term: "Labyrinth", category: "Passive Tree", text: "A trap-filled dungeon run four times (Normal, Cruel, Merciless, Eternal). Each completion grants two ascendancy points." },

  // Items & gems
  { term: "Rarity", category: "Items & Gems", text: "Normal (white), Magic (blue, up to two mods), Rare (yellow, up to six) and Unique (orange, fixed special mods)." },
  { term: "Implicit & Explicit", category: "Items & Gems", text: "Implicit mods come with the item's base type; explicit mods are the random ones rolled on top." },
  { term: "Sockets & Links", category: "Items & Gems", text: "Gems sit in item sockets. Linked sockets let support gems change the skill they are linked to: a 6-link is six connected sockets." },
  { term: "Skill & Support Gems", category: "Items & Gems", text: "Skill gems give an ability; support gems improve the skill they are linked with. Their colour matches the attribute they need." },
  { term: "Flask", category: "Items & Gems", text: "Refillable potions on your belt: life, mana and utility flasks with timed effects. They refill as you kill." },
  { term: "Gem Vendor", category: "Items & Gems", text: "Quests reward gems, and town vendors sell more once a quest is done. Lilly Roth (Act 6) sells almost every gem to any class." },

  // Campaign & endgame
  { term: "Bandits", category: "Campaign & Endgame", text: "In Act 2 you may help one bandit lord (Oak, Kraityn or Alira) for a bonus, or kill all three for an extra passive point." },
  { term: "Pantheon", category: "Campaign & Endgame", text: "Gods you unlock from Act 6 on: one major and one minor power at a time. Capturing map bosses' souls with a Divine Vessel upgrades them." },
  { term: "Atlas", category: "Campaign & Endgame", text: "The endgame map system after Act 10. Its own passive tree changes which content and rewards you find." },
  { term: "Atlas Passive Tree", category: "Campaign & Endgame", text: "Points earned by completing maps, spent on the mechanics you want to see more of." },

  // The app's own words
  { term: "Atlas Rating", category: "This Archive", text: "The archive's score from 1 to 10 for how ready your build is for its stage of the game, from its damage and defences." },
  { term: "Scholar's Verdict", category: "This Archive", text: "A short reading of your build: where it stands and its main weakness." },
  { term: "Threat Register", category: "This Archive", text: "The problems found in your build, worst first, with what each one costs you and how to fix it." },
  { term: "Recommended Artifact", category: "This Archive", text: "The single item from your guide that would improve your build the most, measured by Path of Building." },
  { term: "Equipped Artifacts", category: "This Archive", text: "Your worn gear, laid out like the in-game inventory." },
  { term: "Guide Stage", category: "This Archive", text: "Guides plan the build in steps (levelling trees, early and late gear). The archive picks the step for your progress; you can choose another." },
];
