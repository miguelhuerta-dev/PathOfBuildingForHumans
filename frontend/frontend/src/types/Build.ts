export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface Upgrade {
  title: string;
  dpsIncrease: number;
  ehpIncrease: number;
  description: string;
}

export interface Build {
  name: string;
  ascendancy: string;
  level: number;

  dps: number;
  ehp: number;
  movementSpeed: number;

  score: number;

  issues: Issue[];

  recommendedUpgrade: Upgrade;
}