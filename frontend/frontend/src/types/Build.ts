export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface Upgrade {
  title: string;
  rarity: "normal" | "magic" | "rare" | "unique";
  dpsIncrease: number;
  ehpIncrease: number;
  description: string;
}

export interface BuildAnalysis {
  summary: string;
  mappingPerformance: string;
  primaryWeakness: string;
  estimatedGain: string;
  recommendedAction: string;
}

export interface Build {
  name: string;
  ascendancy: string;
  level: number;
  quote: string;

  health: string;
  priority: string;

  dps: number;
  ehp: number;
  movementSpeed: number;

  score: number;

  analysis: BuildAnalysis;

  issues: Issue[];

  recommendedUpgrade: Upgrade;
}
