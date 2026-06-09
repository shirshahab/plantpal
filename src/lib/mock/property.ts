import type { Property } from "@/lib/types/phase6";

export const MOCK_PROPERTY: Property = {
  id: "prop-1",
  name: "Home Garden",
  zipCode: "91107",
  zones: [
    {
      id: "zone-front",
      name: "Front Yard",
      type: "front_yard",
      plantIds: [],
      tasks: ["Deep water trees", "Deadhead roses", "Check mulch depth"],
    },
    {
      id: "zone-back",
      name: "Backyard",
      type: "back_yard",
      plantIds: [],
      tasks: ["Harvest citrus", "Fertilize vegetables", "Inspect for pests"],
    },
    {
      id: "zone-patio",
      name: "Patio",
      type: "patio",
      plantIds: [],
      tasks: ["Water containers", "Rotate pots for even sun", "Wipe leaves"],
    },
  ],
};

export const SEASONAL_TASKS = [
  "Apply slow-release fertilizer to trees",
  "Refresh container potting mix",
  "Prune dead branches before heat wave",
  "Set up shade cloth for sensitive plants",
];
