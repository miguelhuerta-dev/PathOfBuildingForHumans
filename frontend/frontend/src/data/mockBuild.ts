import type { Build } from "../types/Build";

export const mockBuild: Build = {
  name: "Spark Inquisitor",
  ascendancy: "Inquisitor",
  level: 95,
  quote: "Through knowledge, even the Atlas yields.",

  health: "Excellent",
  priority: "Fix Chaos Resistance",

  dps: 8200000,
  ehp: 52000,
  movementSpeed: 145,

  score: 8.4,

  analysis: {
    summary:
      "A strong mapping build with high damage and survivability. Your main weakness is Chaos Resistance, which leaves you vulnerable in high-tier content.",
    mappingPerformance: "Excellent",
    primaryWeakness: "Chaos Resistance",
    estimatedGain: "+18% Survivability",
    recommendedAction: "Replace Current Ring",
  },

  issues: [
    {
      id: "1",
      title: "Chaos Resistance",
      description: "High Chaos Damage Taken",
      severity: "high",
    },
    {
      id: "2",
      title: "Chance to Hit",
      description: "Reduced Damage Output",
      severity: "medium",
    },
  ],

  recommendedUpgrade: {
    title: "Rare Ring",
    rarity: "rare",
    dpsIncrease: 12,
    ehpIncrease: 6,
    description: "Adds chaos resistance and life",
  },
};
