/** Quick symptom chips for the scanner Diagnose tab. Labels are sent to the diagnosis API verbatim. */
export const SYMPTOM_CHIPS = [
  "Yellow leaves",
  "Brown spots",
  "White powder",
  "Bugs",
  "Webbing",
  "Wilting",
  "Curling leaves",
  "Crispy edges",
  "Mold",
  "Slow growth",
  "Dropping leaves",
] as const;

export type SymptomChip = (typeof SYMPTOM_CHIPS)[number];
