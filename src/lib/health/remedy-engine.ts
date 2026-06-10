/**
 * Remedy engine — safe, structured action plans for common plant health
 * issues, plus a rule-based diagnosis used when AI is unavailable or fails.
 *
 * All copy is cautious and compliance-safe: no cure guarantees, no pesticide
 * or legal claims. Product guidance is always "label-safe" and deferential to
 * local regulations and licensed professionals.
 */
import type {
  HealthIssueId,
  HealthSeverity,
  HealthUrgency,
  ProDiagnosis,
  ProDiagnosisInput,
  RemedyPlan,
  SpreadRisk,
  SymptomId,
} from "@/lib/types/health";
import { buildEvidence, deriveConfidenceTier } from "./evidence";

interface IssueDefinition {
  id: HealthIssueId;
  label: string;
  /** Symptom ids that suggest this issue, with weights. */
  signals: Partial<Record<SymptomId, number>>;
  /** Keywords matched against environment text (humidity, watering, etc.). */
  envKeywords?: { pattern: RegExp; weight: number }[];
  defaultSeverity: HealthSeverity;
  spreadRisk: SpreadRisk;
  urgency: HealthUrgency;
  actionWindow: string;
  causes: string[];
  remedy: Omit<RemedyPlan, "issueId" | "issueLabel">;
}

const ESCALATE_DEFAULT =
  "If symptoms spread to more than a third of the plant, or a high-value crop is at risk, consider verification by a licensed professional.";

export const HEALTH_ISSUES: Record<HealthIssueId, IssueDefinition> = {
  powdery_mildew: {
    id: "powdery_mildew",
    label: "Powdery Mildew",
    signals: { white_powder: 5, mold_fungus: 3, curling_leaves: 1, slow_growth: 1 },
    envKeywords: [
      { pattern: /high humid|humid/i, weight: 2 },
      { pattern: /poor airflow|no airflow|stagnant|dense/i, weight: 2 },
    ],
    defaultSeverity: "moderate",
    spreadRisk: "high",
    urgency: "act_soon",
    actionWindow: "Within 48–72 hours",
    causes: [
      "Fungal spores favored by high humidity and still air",
      "Dense canopy limiting light and airflow",
      "Large day–night temperature swings",
    ],
    remedy: {
      immediate: [
        "Isolate the plant from others if possible.",
        "Remove the most affected leaves with clean, sanitized tools and discard away from plants.",
        "Increase airflow — open space around the plant or add gentle circulation.",
      ],
      next72Hours: [
        "Monitor nearby leaves and plants daily for new white patches.",
        "Keep humidity moderate and avoid wetting foliage.",
        "Consider a label-safe fungicidal option suitable for your plant; follow the label exactly.",
      ],
      day7Plan: [
        "Thin dense growth lightly to improve light penetration and airflow.",
        "Continue daily checks; remove any newly affected leaves promptly.",
        "Re-scan with PlantPal to track whether coverage is shrinking.",
      ],
      day14Plan: [
        "Maintain spacing between plants and steady airflow.",
        "Water at the base, early in the day, so foliage dries quickly.",
        "Keep monitoring weekly — mildew often returns when conditions repeat.",
      ],
      avoid: [
        "Overhead watering or misting foliage.",
        "Crowding plants together while symptoms persist.",
        "Heavy nitrogen feeding, which pushes soft, susceptible growth.",
      ],
      escalation:
        "If white patches keep spreading after 7–10 days of corrections, or the crop is high-value, consider verification by a licensed professional.",
    },
  },
  spider_mites: {
    id: "spider_mites",
    label: "Spider Mites",
    signals: { webbing: 5, speckling: 4, pests_visible: 2, yellow_leaves: 1, curling_leaves: 1 },
    envKeywords: [
      { pattern: /hot|heat|dry|low humid/i, weight: 2 },
    ],
    defaultSeverity: "moderate",
    spreadRisk: "high",
    urgency: "urgent",
    actionWindow: "Within 24–48 hours",
    causes: [
      "Hot, dry conditions that favor mite reproduction",
      "Introduction from new plants or tools",
      "Stressed plants with reduced natural defenses",
    ],
    remedy: {
      immediate: [
        "Isolate the plant — mites move between touching plants easily.",
        "Rinse leaf undersides with a firm spray of water to knock down populations.",
        "Remove heavily webbed leaves and discard them sealed.",
      ],
      next72Hours: [
        "Check leaf undersides daily with a bright light or magnifier.",
        "Raise humidity slightly if the plant tolerates it — mites prefer dry air.",
        "Consider a label-safe horticultural soap or oil; test on one leaf first and follow the label.",
      ],
      day7Plan: [
        "Repeat rinses or label-safe treatments at the interval the label allows.",
        "Inspect neighboring plants closely — early catches are much easier.",
        "Take a progress photo to compare speckling week over week.",
      ],
      day14Plan: [
        "Keep new plants quarantined for 1–2 weeks before placing near others.",
        "Maintain moderate humidity and avoid heat stress.",
        "Continue weekly underside checks for a month.",
      ],
      avoid: [
        "Broad-spectrum sprays not labeled for your plant or location.",
        "Moving the affected plant through rooms with other plants.",
        "Letting the plant dry out repeatedly — drought stress favors mites.",
      ],
      escalation:
        "Persistent webbing after two treatment cycles suggests an established population — consider a licensed professional, especially for high-value crops.",
    },
  },
  aphids: {
    id: "aphids",
    label: "Aphids",
    signals: { pests_visible: 4, sticky_residue: 4, curling_leaves: 2, slow_growth: 1 },
    defaultSeverity: "mild",
    spreadRisk: "moderate",
    urgency: "act_soon",
    actionWindow: "Within 2–4 days",
    causes: [
      "Soft new growth attracting colonies",
      "Nearby infested plants or fresh outdoor exposure",
      "Excess nitrogen producing lush, tender shoots",
    ],
    remedy: {
      immediate: [
        "Dislodge visible clusters with a firm water spray.",
        "Pinch off heavily infested shoot tips and discard.",
        "Check stems and leaf undersides for hidden groups.",
      ],
      next72Hours: [
        "Re-check new growth daily — colonies rebound from a few survivors.",
        "Consider a label-safe insecticidal soap; follow the label exactly.",
        "Watch for sticky residue (honeydew) and clean it off leaves.",
      ],
      day7Plan: [
        "Continue spot-treating new clusters as they appear.",
        "Encourage or tolerate beneficial insects outdoors (ladybugs, lacewings).",
        "Ease off high-nitrogen feeding while populations persist.",
      ],
      day14Plan: [
        "Inspect weekly, focusing on tender new growth.",
        "Keep plants spaced and healthy — stressed plants attract aphids.",
      ],
      avoid: [
        "Spraying products not labeled for edible crops if you plan to harvest.",
        "Heavy nitrogen fertilizer during an active infestation.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  thrips: {
    id: "thrips",
    label: "Thrips",
    signals: { speckling: 3, pests_visible: 2, curling_leaves: 2, slow_growth: 2, brown_spots: 1 },
    defaultSeverity: "moderate",
    spreadRisk: "high",
    urgency: "act_soon",
    actionWindow: "Within 48–72 hours",
    causes: [
      "Silvery feeding scars from thrips rasping leaf surfaces",
      "Introduction on new plants, flowers, or through open windows",
      "Warm, dry conditions speeding their life cycle",
    ],
    remedy: {
      immediate: [
        "Isolate the plant and shake a few leaves over white paper to confirm tiny slender insects.",
        "Remove the most damaged leaves and any spent flowers.",
        "Place blue or yellow sticky cards near the canopy to monitor.",
      ],
      next72Hours: [
        "Check sticky cards and leaf undersides daily.",
        "Consider a label-safe insecticidal soap or oil; repeat per the label since eggs hatch in waves.",
      ],
      day7Plan: [
        "Continue card monitoring; repeat treatments per the label interval.",
        "Inspect nearby plants — thrips spread by flying short distances.",
      ],
      day14Plan: [
        "Quarantine new plants for 1–2 weeks before mixing them in.",
        "Keep cards in place for a month to confirm the trend is down.",
      ],
      avoid: [
        "Reusing potting mix from affected plants — thrips pupate in soil.",
        "Treating once and assuming it's done; staggered hatches need follow-up.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  whiteflies: {
    id: "whiteflies",
    label: "Whiteflies",
    signals: { pests_visible: 3, sticky_residue: 3, yellow_leaves: 2, slow_growth: 1 },
    defaultSeverity: "mild",
    spreadRisk: "moderate",
    urgency: "act_soon",
    actionWindow: "Within 2–4 days",
    causes: [
      "Tiny white insects flying up when foliage is disturbed",
      "Warm, sheltered growing areas with little air movement",
      "Introduction from infested nursery stock",
    ],
    remedy: {
      immediate: [
        "Hang yellow sticky cards just above the canopy.",
        "Rinse leaf undersides where eggs and nymphs sit.",
        "Isolate the plant if practical.",
      ],
      next72Hours: [
        "Vacuum or shake adults off in the cool morning when they're slow.",
        "Consider a label-safe insecticidal soap on leaf undersides; follow the label.",
      ],
      day7Plan: [
        "Repeat underside treatments per the label — eggs hatch over days.",
        "Track sticky card counts to confirm the population is declining.",
      ],
      day14Plan: [
        "Keep cards up for several weeks.",
        "Improve airflow around plants to make conditions less inviting.",
      ],
      avoid: [
        "Moving infested plants near healthy ones.",
        "Stopping treatment after adults disappear — nymphs may remain.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  mealybugs: {
    id: "mealybugs",
    label: "Mealybugs",
    signals: { white_powder: 2, pests_visible: 3, sticky_residue: 3, slow_growth: 1 },
    defaultSeverity: "moderate",
    spreadRisk: "moderate",
    urgency: "act_soon",
    actionWindow: "Within 2–4 days",
    causes: [
      "White cottony clusters at stem joints and leaf bases",
      "Spread from infested plants or contaminated tools",
      "Warm indoor conditions year-round",
    ],
    remedy: {
      immediate: [
        "Dab visible clusters with a cotton swab dipped in isopropyl alcohol (test one leaf first).",
        "Isolate the plant — mealybugs migrate slowly but steadily.",
        "Check crevices: stem joints, leaf undersides, and pot rims.",
      ],
      next72Hours: [
        "Re-inspect daily; remove any new cottony spots immediately.",
        "Consider a label-safe insecticidal soap for wider coverage.",
      ],
      day7Plan: [
        "Repeat spot treatments — eggs hide in protected crevices.",
        "Wipe down pot, saucer, and nearby surfaces.",
      ],
      day14Plan: [
        "Inspect weekly for a month; mealybugs are persistent.",
        "Quarantine new plants before introducing them.",
      ],
      avoid: [
        "Overwatering and heavy feeding, which produce soft growth they prefer.",
        "Assuming one cleaning is enough — follow-up matters most.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  scale: {
    id: "scale",
    label: "Scale Insects",
    signals: { pests_visible: 3, sticky_residue: 3, yellow_leaves: 2, slow_growth: 1, brown_spots: 1 },
    defaultSeverity: "moderate",
    spreadRisk: "moderate",
    urgency: "act_soon",
    actionWindow: "Within 3–5 days",
    causes: [
      "Small brown bumps fixed along stems and leaf veins",
      "Sticky honeydew dripping onto lower leaves",
      "Slow buildup that often goes unnoticed for weeks",
    ],
    remedy: {
      immediate: [
        "Scrape off visible scales gently with a fingernail or soft brush.",
        "Wipe stems with a damp cloth; alcohol swab for stubborn spots (test first).",
        "Isolate the plant if others are nearby.",
      ],
      next72Hours: [
        "Check for crawlers (tiny moving dots) — that's the treatable stage.",
        "Consider a label-safe horticultural oil to smother remaining scales; follow the label.",
      ],
      day7Plan: [
        "Repeat oil application per the label if crawlers persist.",
        "Prune heavily encrusted twigs and discard sealed.",
      ],
      day14Plan: [
        "Monitor monthly — scale rebounds from missed spots.",
        "Keep the plant unstressed: steady water, no heavy feeding.",
      ],
      avoid: [
        "Spraying oils in direct hot sun or on drought-stressed plants.",
        "Ignoring honeydew — it invites sooty mold.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  root_rot: {
    id: "root_rot",
    label: "Root Rot",
    signals: { soggy_soil: 5, wilting: 3, yellow_leaves: 2, leaf_drop: 2, mold_fungus: 1 },
    envKeywords: [
      { pattern: /daily|every day|overwater|soggy|wet/i, weight: 3 },
      { pattern: /no drainage|poor drainage/i, weight: 2 },
    ],
    defaultSeverity: "severe",
    spreadRisk: "low",
    urgency: "urgent",
    actionWindow: "Within 24–48 hours",
    causes: [
      "Roots sitting in waterlogged soil without oxygen",
      "Poor drainage or an oversized pot holding excess moisture",
      "Fungal pathogens thriving in constantly wet media",
    ],
    remedy: {
      immediate: [
        "Stop watering now and remove any standing water from saucers.",
        "Gently slide the plant out and inspect roots: healthy roots are firm and light; rotten ones are brown, soft, and may smell sour.",
        "Trim clearly rotten roots with sterilized scissors.",
      ],
      next72Hours: [
        "Repot into fresh, well-draining mix in a clean pot with drainage holes.",
        "Keep the plant in bright, indirect light — no fertilizer.",
        "Water lightly only when the top inch of soil is dry.",
      ],
      day7Plan: [
        "Watch for new growth — a good sign roots are recovering.",
        "Keep watering minimal and consistent.",
      ],
      day14Plan: [
        "Resume a normal watering schedule based on soil dryness, not the calendar.",
        "Consider a moisture meter if overwatering has been a pattern.",
      ],
      avoid: [
        "Fertilizing while roots are damaged.",
        "Repotting into a much larger pot — extra soil stays wet longer.",
        "Watering on a fixed schedule regardless of soil moisture.",
      ],
      escalation:
        "If most of the root mass is soft and brown, recovery is uncertain — consider taking healthy cuttings as a backup and consulting a professional for valuable plants.",
    },
  },
  overwatering: {
    id: "overwatering",
    label: "Overwatering",
    signals: { yellow_leaves: 3, soggy_soil: 4, wilting: 2, leaf_drop: 2, mold_fungus: 1 },
    envKeywords: [
      { pattern: /daily|every day|twice a day|overwater/i, weight: 3 },
    ],
    defaultSeverity: "moderate",
    spreadRisk: "low",
    urgency: "act_soon",
    actionWindow: "Within 2–3 days",
    causes: [
      "Watering on a schedule rather than by soil dryness",
      "Pot or soil draining too slowly",
      "Cool or low-light conditions slowing water uptake",
    ],
    remedy: {
      immediate: [
        "Skip the next watering and empty any saucer water.",
        "Check soil 2 inches deep — only water when it's dry at that depth.",
        "Move the plant to brighter, indirect light if possible to speed drying.",
      ],
      next72Hours: [
        "Watch whether yellowing stabilizes — older yellow leaves won't re-green, but new damage should stop.",
        "Inspect the root zone if the soil stays wet for more than 4–5 days.",
      ],
      day7Plan: [
        "Re-establish watering by feel: dry top inch → water deeply → drain fully.",
        "Remove fully yellow leaves to let the plant focus on healthy growth.",
      ],
      day14Plan: [
        "Track watering dates in PlantPal to spot over-frequent patterns.",
        "Consider better-draining soil or a pot with more drainage at next repot.",
      ],
      avoid: [
        "Fertilizing a waterlogged plant.",
        "“Compensating” with even more water when leaves droop — droop can mean wet roots too.",
      ],
      escalation:
        "If soil smells sour or stems soften at the base, treat as possible root rot and act within 24–48 hours.",
    },
  },
  underwatering: {
    id: "underwatering",
    label: "Underwatering",
    signals: { wilting: 4, curling_leaves: 2, leaf_drop: 2, brown_spots: 1, slow_growth: 1 },
    envKeywords: [
      { pattern: /rarely|forget|once a month|dry/i, weight: 2 },
    ],
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "act_soon",
    actionWindow: "Today",
    causes: [
      "Soil drying out completely between long watering gaps",
      "Root-bound pot drying faster than expected",
      "Heat or wind increasing water demand",
    ],
    remedy: {
      immediate: [
        "Water slowly and deeply until water drains from the bottom.",
        "If soil repels water, soak the whole pot in a basin for 15–20 minutes.",
      ],
      next72Hours: [
        "Check soil daily — recovery watering may be needed again sooner than usual.",
        "Expect crisp brown edges to remain; look for firm new growth instead.",
      ],
      day7Plan: [
        "Set a consistent check-in rhythm (PlantPal tasks help here).",
        "Trim fully dried leaves once the plant has rehydrated.",
      ],
      day14Plan: [
        "If the pot dries within 1–2 days, consider repotting into a slightly larger pot or more water-retentive mix.",
      ],
      avoid: [
        "Flooding a bone-dry pot repeatedly in one day — water, drain, then resume normal rhythm.",
        "Fertilizing a drought-stressed plant for at least a week.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  nitrogen_deficiency: {
    id: "nitrogen_deficiency",
    label: "Possible Nitrogen Deficiency",
    signals: { yellow_leaves: 3, slow_growth: 3, leaf_drop: 1 },
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "monitor",
    actionWindow: "Within 1–2 weeks",
    causes: [
      "Older, lower leaves yellowing first while new growth stays small",
      "Depleted potting mix that hasn't been fed in months",
      "Leaching from frequent heavy watering",
    ],
    remedy: {
      immediate: [
        "Confirm the pattern: nitrogen shortage usually starts with the oldest, lowest leaves.",
        "Rule out overwatering first — it causes similar yellowing.",
      ],
      next72Hours: [
        "Apply a balanced, label-safe fertilizer at half strength.",
        "Note the date so you can compare new growth in 2 weeks.",
      ],
      day7Plan: [
        "Look for greener, larger new leaves — old leaves won't recover.",
        "Maintain normal watering; nutrients need moisture to move.",
      ],
      day14Plan: [
        "Resume a regular feeding schedule for the growing season.",
        "Refresh or top-dress potting mix annually.",
      ],
      avoid: [
        "Doubling fertilizer doses to “catch up” — that risks nutrient burn.",
        "Feeding a plant with damaged or soggy roots.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  potassium_deficiency: {
    id: "potassium_deficiency",
    label: "Possible Potassium Deficiency",
    signals: { brown_spots: 3, yellow_leaves: 2, curling_leaves: 1 },
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "monitor",
    actionWindow: "Within 1–2 weeks",
    causes: [
      "Yellow or brown edges on older leaves while veins stay green",
      "Sandy or heavily leached soil",
      "Imbalanced feeding focused on nitrogen only",
    ],
    remedy: {
      immediate: [
        "Photograph affected leaves to track edge browning over time.",
        "Check that watering is consistent — drought mimics potassium issues.",
      ],
      next72Hours: [
        "Apply a balanced fertilizer that includes potassium (the K in N-P-K), at label rates.",
      ],
      day7Plan: [
        "Watch new leaves — improvement shows in fresh growth first.",
      ],
      day14Plan: [
        "Keep a regular, balanced feeding rhythm during active growth.",
      ],
      avoid: [
        "High-dose single-nutrient products without a soil test.",
        "Removing many leaves at once — the plant still uses partly damaged ones.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  magnesium_deficiency: {
    id: "magnesium_deficiency",
    label: "Possible Magnesium Deficiency",
    signals: { yellow_leaves: 3, brown_spots: 1, leaf_drop: 1 },
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "monitor",
    actionWindow: "Within 1–2 weeks",
    causes: [
      "Yellowing between veins on older leaves (veins stay green)",
      "Acidic or heavily leached growing media",
      "High potassium feeding blocking magnesium uptake",
    ],
    remedy: {
      immediate: [
        "Confirm interveinal yellowing on older leaves — a classic magnesium sign.",
      ],
      next72Hours: [
        "Consider a magnesium supplement (e.g. Epsom salt at label-safe rates) or a cal-mag product made for plants.",
      ],
      day7Plan: [
        "Track whether new leaves emerge fully green.",
      ],
      day14Plan: [
        "Use a balanced fertilizer with micronutrients going forward.",
      ],
      avoid: [
        "Stacking multiple supplements at once — change one variable at a time.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  calcium_deficiency: {
    id: "calcium_deficiency",
    label: "Possible Calcium Deficiency",
    signals: { brown_spots: 3, curling_leaves: 2, slow_growth: 1 },
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "monitor",
    actionWindow: "Within 1–2 weeks",
    causes: [
      "Distorted or brown-edged new growth (calcium doesn't move within the plant)",
      "Inconsistent watering interrupting calcium transport",
      "Blossom-end rot patterns on fruiting crops",
    ],
    remedy: {
      immediate: [
        "Even out watering — calcium moves with water, so consistency matters most.",
      ],
      next72Hours: [
        "Consider a cal-mag supplement at label rates if growth stays distorted.",
      ],
      day7Plan: [
        "Watch new leaves and fruit set for improvement.",
      ],
      day14Plan: [
        "Maintain steady moisture; mulch outdoor plants to buffer swings.",
      ],
      avoid: [
        "Letting pots swing between bone-dry and soaked.",
        "Excess nitrogen during fruiting.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  nutrient_burn: {
    id: "nutrient_burn",
    label: "Nutrient Burn",
    signals: { nutrient_burn: 5, brown_spots: 2, curling_leaves: 2, yellow_leaves: 1 },
    envKeywords: [
      { pattern: /fertiliz|feed|nutrient/i, weight: 3 },
    ],
    defaultSeverity: "moderate",
    spreadRisk: "low",
    urgency: "act_soon",
    actionWindow: "Within 24–48 hours",
    causes: [
      "Recent fertilizing at higher-than-label strength",
      "Salt buildup from repeated feeding without flushing",
      "Strong fertilizer on dry roots",
    ],
    remedy: {
      immediate: [
        "Stop all feeding now.",
        "Flush the pot: water slowly with 2–3× the pot's volume, letting it drain fully.",
      ],
      next72Hours: [
        "Watch leaf tips — existing burn won't reverse, but spreading should stop.",
        "Keep watering plain (no additives) until new growth looks normal.",
      ],
      day7Plan: [
        "Resume feeding at half the label rate once new growth is healthy.",
      ],
      day14Plan: [
        "Flush pots every 4–6 weeks if you feed regularly.",
        "Log fertilizer dates and doses in PlantPal to avoid stacking.",
      ],
      avoid: [
        "“Fixing” burn with more or different fertilizer.",
        "Fertilizing dry soil — water first, then feed.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  heat_stress: {
    id: "heat_stress",
    label: "Heat Stress",
    signals: { wilting: 3, curling_leaves: 3, leaf_drop: 1, brown_spots: 1 },
    envKeywords: [
      { pattern: /hot|heat|9\d°|over 90|100°/i, weight: 3 },
    ],
    defaultSeverity: "moderate",
    spreadRisk: "low",
    urgency: "act_soon",
    actionWindow: "Today",
    causes: [
      "Temperatures above the plant's comfort range",
      "Afternoon sun combined with dry soil",
      "Containers heating up faster than ground soil",
    ],
    remedy: {
      immediate: [
        "Move containers to afternoon shade, or shade in-ground plants with cloth.",
        "Water deeply in the early morning or evening — not at peak heat.",
      ],
      next72Hours: [
        "Check soil moisture daily during the heat event.",
        "Hold off on fertilizing and pruning until temperatures moderate.",
      ],
      day7Plan: [
        "Mulch outdoor root zones to buffer soil temperature.",
        "Trim only clearly dead, crispy growth once heat passes.",
      ],
      day14Plan: [
        "Plan placement for the season: morning sun, afternoon protection for sensitive plants.",
      ],
      avoid: [
        "Midday watering of foliage in full sun.",
        "Transplanting or heavy pruning during a heat wave.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  cold_stress: {
    id: "cold_stress",
    label: "Cold Stress",
    signals: { wilting: 2, leaf_drop: 3, brown_spots: 2, curling_leaves: 1 },
    envKeywords: [
      { pattern: /cold|frost|freez|draft/i, weight: 3 },
    ],
    defaultSeverity: "moderate",
    spreadRisk: "low",
    urgency: "act_soon",
    actionWindow: "Within 24 hours",
    causes: [
      "Exposure below the plant's hardiness range",
      "Cold drafts near windows, doors, or AC vents indoors",
      "Sudden temperature drops without acclimation",
    ],
    remedy: {
      immediate: [
        "Move the plant away from the cold source, or cover outdoor plants overnight.",
        "Don't prune damaged growth yet — it can protect tissue underneath.",
      ],
      next72Hours: [
        "Keep the plant in stable, moderate temperatures.",
        "Water sparingly — cold-stressed roots take up less water.",
      ],
      day7Plan: [
        "Assess which growth recovers; mushy black tissue won't.",
      ],
      day14Plan: [
        "Prune clearly dead growth once new growth shows where the live wood is.",
        "Plan frost protection (covers, relocation) before the next cold night.",
      ],
      avoid: [
        "Fertilizing or repotting right after cold damage.",
        "Placing tropical plants near drafty windows in winter.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  sunburn: {
    id: "sunburn",
    label: "Sunburn / Light Burn",
    signals: { brown_spots: 3, yellow_leaves: 2, curling_leaves: 1 },
    envKeywords: [
      { pattern: /direct sun|full sun|moved outside|grow light/i, weight: 2 },
    ],
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "monitor",
    actionWindow: "Within 2–3 days",
    causes: [
      "Sudden move from low light to direct sun without acclimation",
      "Bleached or papery patches on the most exposed leaves",
      "Grow lights positioned too close to the canopy",
    ],
    remedy: {
      immediate: [
        "Move the plant out of direct sun, or raise/dim grow lights.",
        "Leave damaged leaves on for now — they still photosynthesize partially.",
      ],
      next72Hours: [
        "Reintroduce stronger light gradually: 1–2 hours more every few days.",
      ],
      day7Plan: [
        "Trim fully bleached leaves once new growth appears.",
      ],
      day14Plan: [
        "Acclimate any plant over 7–10 days when moving it to brighter conditions.",
      ],
      avoid: [
        "Misting leaves in direct sun.",
        "Moving plants straight from indoors to full summer sun.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  transplant_shock: {
    id: "transplant_shock",
    label: "Transplant Shock",
    signals: { wilting: 3, leaf_drop: 3, slow_growth: 2, yellow_leaves: 1 },
    envKeywords: [
      { pattern: /repot|transplant|just planted|moved/i, weight: 3 },
    ],
    defaultSeverity: "mild",
    spreadRisk: "low",
    urgency: "monitor",
    actionWindow: "Ongoing — give it 1–2 weeks",
    causes: [
      "Root disturbance during repotting or planting",
      "Sudden change in light, temperature, or humidity",
      "Roots not yet established in the new medium",
    ],
    remedy: {
      immediate: [
        "Keep conditions stable: same light, steady moisture, no drafts.",
        "Water thoroughly once, then let the top inch dry before watering again.",
      ],
      next72Hours: [
        "Expect some droop or leaf drop — avoid reacting with fertilizer or another move.",
      ],
      day7Plan: [
        "Look for firming stems and new growth as roots take hold.",
      ],
      day14Plan: [
        "Resume normal care once new growth appears.",
        "Wait at least a month before fertilizing a freshly repotted plant.",
      ],
      avoid: [
        "Fertilizing right after transplant.",
        "Moving the plant again while it's adjusting.",
        "Daily watering “to help it settle” — soggy soil slows rooting.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  poor_airflow: {
    id: "poor_airflow",
    label: "Poor Airflow",
    signals: { mold_fungus: 3, white_powder: 2, wilting: 1, slow_growth: 1 },
    envKeywords: [
      { pattern: /no airflow|poor airflow|stagnant|closed|dense canopy/i, weight: 4 },
    ],
    defaultSeverity: "mild",
    spreadRisk: "moderate",
    urgency: "act_soon",
    actionWindow: "Within 2–3 days",
    causes: [
      "Still, humid air around dense foliage",
      "Plants packed tightly together",
      "Closed rooms or grow spaces without circulation",
    ],
    remedy: {
      immediate: [
        "Create gentle air movement: open a window, add a small fan on low (not blowing directly at plants).",
        "Space plants so leaves aren't touching.",
      ],
      next72Hours: [
        "Watch humidity-sensitive spots: dense inner foliage, soil surface, lower leaves.",
      ],
      day7Plan: [
        "Lightly thin overly dense growth to let air through the canopy.",
      ],
      day14Plan: [
        "Keep steady, gentle circulation as a default — it prevents most fungal issues.",
      ],
      avoid: [
        "Strong fans pointed directly at foliage, which dry and stress leaves.",
        "Misting in a room with no air movement.",
      ],
      escalation: ESCALATE_DEFAULT,
    },
  },
  botrytis_risk: {
    id: "botrytis_risk",
    label: "Mold / Botrytis Risk",
    signals: { mold_fungus: 5, brown_spots: 2, wilting: 1, soggy_soil: 1 },
    envKeywords: [
      { pattern: /high humid|humid|damp|wet/i, weight: 3 },
      { pattern: /poor airflow|stagnant|dense/i, weight: 2 },
    ],
    defaultSeverity: "severe",
    spreadRisk: "high",
    urgency: "urgent",
    actionWindow: "Within 24–48 hours",
    causes: [
      "Gray, fuzzy mold on flowers, buds, or soft tissue",
      "High humidity with poor airflow, especially in dense canopies",
      "Decaying plant matter left on or near the plant",
    ],
    remedy: {
      immediate: [
        "Remove affected flowers, buds, or leaves with sanitized tools — bag and discard immediately, away from plants.",
        "Lower humidity and increase airflow around the plant now.",
        "Isolate the plant from dense groupings.",
      ],
      next72Hours: [
        "Inspect daily, especially dense flower clusters and inner canopy.",
        "Keep foliage dry; water at the base only.",
        "Remove fallen debris from the soil surface.",
      ],
      day7Plan: [
        "Continue daily checks — botrytis spreads fast in the right conditions.",
        "Thin the canopy lightly where air can't move.",
      ],
      day14Plan: [
        "Hold humidity at moderate levels with steady circulation.",
        "Keep a strict cleanup habit: no dead material left on or around plants.",
      ],
      avoid: [
        "Misting or overhead watering while mold is present.",
        "Composting infected material near growing areas.",
        "Sealing plants in unventilated spaces (tents, closed rooms) while symptoms persist.",
      ],
      escalation:
        "Botrytis near harvest on a high-value crop warrants urgent professional verification — spread within dense flowers can be rapid.",
    },
  },
};

export const SUPPORTED_ISSUE_IDS = Object.keys(HEALTH_ISSUES) as HealthIssueId[];

/** Full remedy plan for an issue. Falls back to a generic monitoring plan. */
export function getRemedyPlan(issueId: HealthIssueId | null, issueLabel?: string): RemedyPlan {
  if (issueId && HEALTH_ISSUES[issueId]) {
    const def = HEALTH_ISSUES[issueId];
    return { issueId: def.id, issueLabel: def.label, ...def.remedy };
  }
  return {
    issueId: null,
    issueLabel: issueLabel ?? "General plant stress",
    immediate: [
      "Photograph the affected areas in good light for comparison.",
      "Check soil moisture 2 inches deep and inspect leaf undersides for pests.",
      "Remove clearly dead or heavily damaged material with clean tools.",
    ],
    next72Hours: [
      "Keep light, watering, and temperature stable — change one variable at a time.",
      "Monitor whether symptoms are spreading, stable, or improving.",
    ],
    day7Plan: [
      "Re-scan with PlantPal and compare against your first photos.",
      "If symptoms progressed, run a new diagnosis with updated details.",
    ],
    day14Plan: [
      "Maintain consistent care and weekly visual checks.",
    ],
    avoid: [
      "Applying multiple treatments at once — it hides what's working.",
      "Fertilizing a stressed plant before the cause is known.",
    ],
    escalation: ESCALATE_DEFAULT,
  };
}

// ── Rule-based diagnosis (AI fallback) ─────────────────────────────────────

function envBlob(input: ProDiagnosisInput): string {
  const env = input.environment;
  return [
    env.temperature,
    env.humidity,
    env.airflow,
    env.lightIntensity,
    env.wateringFrequency,
    env.fertilizerUsed,
    env.pruningHistory,
    input.otherSymptom ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

function scoreIssue(def: IssueDefinition, input: ProDiagnosisInput): number {
  let score = 0;
  for (const symptom of input.symptoms) {
    score += def.signals[symptom] ?? 0;
  }
  const blob = envBlob(input);
  for (const kw of def.envKeywords ?? []) {
    if (kw.pattern.test(blob)) score += kw.weight;
  }
  return score;
}

function severityFromScore(def: IssueDefinition, score: number): HealthSeverity {
  if (score >= 9 && def.defaultSeverity !== "mild") return "severe";
  if (score >= 6) return def.defaultSeverity;
  return def.defaultSeverity === "severe" ? "moderate" : "mild";
}

const URGENCY_RANK: Record<HealthUrgency, number> = {
  monitor: 0,
  act_soon: 1,
  urgent: 2,
};

/**
 * Symptom + environment pattern matching. Used when AI is unavailable or
 * fails — always produces a real, structured diagnosis (never mock data).
 */
export function ruleBasedDiagnosis(input: ProDiagnosisInput): ProDiagnosis {
  const scored = SUPPORTED_ISSUE_IDS.map((id) => {
    const def = HEALTH_ISSUES[id];
    return { def, score: scoreIssue(def, input) };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const photoCount = input.photoCount ?? 0;
  const evidence = buildEvidence(input);

  if (scored.length === 0) {
    return {
      likelyIssue: "General plant stress — pattern unclear",
      issueId: null,
      confidence: 30,
      confidenceTier: deriveConfidenceTier(30, photoCount),
      evidence,
      visualNotes: [],
      possibleCauses: [
        "Symptoms don't match a single common pattern yet",
        "Possible early-stage issue not fully visible",
        "Environment factors may be combining (light, water, airflow)",
      ],
      severity: "mild",
      spreadRisk: "low",
      urgency: "monitor",
      actionWindow: "Monitor over the next 5–7 days",
      prognosisSummary:
        "Signs suggest mild, non-specific stress. Stabilize care, monitor closely, and re-scan if symptoms develop further.",
      expertVerificationRecommended: false,
      source: "rules",
    };
  }

  const top = scored[0];
  const maxPossible =
    Object.values(top.def.signals).reduce((a, b) => a + (b ?? 0), 0) +
    (top.def.envKeywords?.reduce((a, k) => a + k.weight, 0) ?? 0);
  const confidence = Math.min(88, Math.max(35, Math.round((top.score / Math.max(maxPossible, 1)) * 100)));
  const severity = severityFromScore(top.def, top.score);

  const causes = [...top.def.causes];
  for (const alt of scored.slice(1, 3)) {
    causes.push(`Possible ${alt.def.label.toLowerCase()} (some overlapping signs)`);
  }

  const urgent = severity === "severe" || top.def.spreadRisk === "high";

  return {
    likelyIssue: top.def.label,
    issueId: top.def.id,
    confidence,
    confidenceTier: deriveConfidenceTier(confidence, photoCount),
    evidence,
    visualNotes: [],
    possibleCauses: causes.slice(0, 3),
    severity,
    spreadRisk: top.def.spreadRisk,
    urgency: urgent && URGENCY_RANK[top.def.urgency] < 2 ? "act_soon" : top.def.urgency,
    actionWindow: top.def.actionWindow,
    prognosisSummary: buildPrognosisSummary(top.def.label, severity, top.def.spreadRisk),
    expertVerificationRecommended: severity === "severe" || (input.commercial?.enabled ?? false),
    source: "rules",
  };
}

function buildPrognosisSummary(
  label: string,
  severity: HealthSeverity,
  spread: SpreadRisk
): string {
  const spreadText =
    spread === "high"
      ? "If untreated, this may spread quickly — especially in dense canopies with poor airflow and high humidity."
      : spread === "moderate"
        ? "If untreated, this may gradually affect more of the plant or nearby plants."
        : "This issue typically stays contained to the affected plant.";
  const severityText =
    severity === "severe"
      ? "Signs suggest a significant issue — acting within the recommended window matters."
      : severity === "moderate"
        ? "Signs suggest a manageable issue if addressed promptly."
        : "Signs suggest an early or mild issue with a good outlook.";
  return `Likely ${label.toLowerCase()}. ${severityText} ${spreadText}`;
}
