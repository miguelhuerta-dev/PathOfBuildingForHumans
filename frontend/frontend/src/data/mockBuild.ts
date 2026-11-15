import type { Build } from "../types/Build";

export const mockBuild: Build = {
  name: "Spark Inquisitor",

  ascendancy: "Inquisitor",

  level: 95,

  dps: 8200000,

  ehp: 52000,

  movementSpeed: 145,

  score: 8.4,

  issues: [
    {
      id: "1",
      title: "Chaos Resistance",
      description: "Below resistance cap",
      severity: "high",
    },
    {
      id: "2",
      title: "Chance To Hit",
      description: "Only 89%",
      severity: "medium",
    },
  ],

  recommendedUpgrade: {
    title: "Rare Ring",
    dpsIncrease: 12,
    ehpIncrease: 6,
    description: "Adds chaos resistance and life",
  },
};