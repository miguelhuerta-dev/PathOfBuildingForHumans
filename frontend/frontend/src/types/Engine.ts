/** Shapes returned by the Path of Building engine bridge (src-tauri/engine). */

export interface EngineItem {
  slot: string;
  name: string;
  base?: string;
  rarity?: string;
  /** Official icon URL (web.poecdn.com); only present for the character's own items. */
  icon?: string;
  implicits: string[];
  explicits: string[];
}

export interface EngineGem {
  name: string;
  level?: number;
  quality?: number;
  enabled: boolean;
  /** Official icon URL (web.poecdn.com), when known. */
  icon?: string;
}

export interface EngineSkillGroup {
  label?: string;
  slot?: string;
  main: boolean;
  gems: EngineGem[];
}

export interface EngineStats {
  DPS: number;
  Life?: number;
  LifeUnreserved?: number;
  EnergyShield?: number;
  Mana?: number;
  Ward?: number;
  FireResist?: number;
  ColdResist?: number;
  LightningResist?: number;
  ChaosResist?: number;
  TotalEHP?: number;
  Armour?: number;
  Evasion?: number;
  BlockChance?: number;
  SpellBlockChance?: number;
  SpellSuppressionChance?: number;
  HitChance?: number;
  CritChance?: number;
  EffectiveMovementSpeedMod?: number;
  [key: string]: number | undefined;
}

export interface GuideStage {
  index: number;
  title: string;
  minLevel?: number;
  maxLevel?: number;
  active?: boolean;
}

export interface EngineBuild {
  character: {
    name?: string;
    league?: string;
    class?: string;
    ascendancy?: string;
    level?: number;
    mainSkill?: string;
  };
  keystones: string[];
  stats: EngineStats;
  items: EngineItem[];
  skills: EngineSkillGroup[];
  stages?: GuideStage[];
  /** Guides only: the order the ascendancy passives are taken in. */
  ascendancyPlan?: AscendancyStep[];
  /** Guides only: the bandit quest choice. */
  bandit?: BanditChoice;
  /** Guides only: the Pantheon powers. */
  pantheon?: { major?: PantheonGod; minor?: PantheonGod };
  /** Guides only: the guide has no gear at all for this stage. */
  noStageItems?: boolean;
  /** Guides only: this stage has no gear of its own; the gear shown is that stage's (the nearest one). */
  itemsFromStage?: string;
}

export interface AscendancyStep {
  id: number;
  name: string;
  notable: boolean;
  /** Game icon path, e.g. "Art/2DArt/SkillIcons/passives/Necromancer/….png". */
  icon?: string;
  stats?: string[];
  /** 1 to 4: the Labyrinth whose points first allow this passive. */
  lab: number;
  labName: string;
}

/** The Act 2 bandit choice, as Path of Building names it ("None" = killed all three). */
export type Bandit = "None" | "Oak" | "Kraityn" | "Alira";

export interface BanditChoice {
  /** "None" (kill all three), "Oak", "Kraityn" or "Alira". */
  choice: string;
  label: string;
  reward: string;
}

export interface PantheonSoul {
  name: string;
  lines: string[];
  /** Upgrades are unlocked by capturing that soul's map boss. */
  upgrade: boolean;
}

export interface PantheonGod {
  id: string;
  name: string;
  major: boolean;
  souls: PantheonSoul[];
}

export interface Upgrade {
  slot: string;
  item: Omit<EngineItem, "slot">;
  current?: string;
  currentIcon?: string;
  dps: number;
  ehp: number;
  dpsChange: number;
  ehpChange: number;
  chaosResist?: number;
  fireResist?: number;
  coldResist?: number;
  lightningResist?: number;
}

export interface PassiveNode {
  id?: number;
  name: string;
  type: "Notable" | "Keystone" | "Mastery" | "Normal" | string;
  ascendancy?: boolean;
}

/** The character's passive tree compared with the guide's tree at the chosen stage. */
export interface PassiveComparison {
  guidePoints: number;
  characterPoints: number;
  shared: number;
  extra: number;
  missing: PassiveNode[];
  /** Allocated node ids of each tree, for the passive tree map. */
  guideNodes?: number[];
  characterNodes?: number[];
  /** Chosen mastery effect id by mastery node id. */
  guideMasteries?: Record<string, number>;
  characterMasteries?: Record<string, number>;
}

/** What `load_character`, `load_guide` and `select_guide_stage` return. */
export interface EngineResult {
  character?: EngineBuild;
  guide?: EngineBuild;
  upgrades?: Upgrade[];
  passives?: PassiveComparison;
}

export interface CharacterSummary {
  name: string;
  class: string;
  league: string;
  level: number;
  realm?: string;
}
