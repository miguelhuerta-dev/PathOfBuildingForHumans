/** Shapes returned by the Path of Building engine bridge (src-tauri/engine). */

export interface EngineItem {
  slot: string;
  name: string;
  base?: string;
  rarity?: string;
  implicits: string[];
  explicits: string[];
}

export interface EngineGem {
  name: string;
  level?: number;
  quality?: number;
  enabled: boolean;
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
}

export interface Upgrade {
  slot: string;
  item: Omit<EngineItem, "slot">;
  current?: string;
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
