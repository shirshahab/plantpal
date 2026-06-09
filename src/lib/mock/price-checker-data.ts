import type { PlantPriceProfile, SizePricing } from "@/lib/types/price-checker";

function p(
  lo: number,
  hi: number,
  mult = 1
): Omit<SizePricing, never> {
  const m = mult;
  return {
    bigBoxRange: [Math.round(lo * 0.7 * m), Math.round(hi * 0.85 * m)],
    nurseryRange: [Math.round(lo * m), Math.round(hi * m)],
    onlineRange: [Math.round(lo * 1.1 * m), Math.round(hi * 1.4 * m)],
    premiumRange: [Math.round(hi * 1.1 * m), Math.round(hi * 1.8 * m)],
    buyUnderPrice: Math.round(hi * 0.95 * m),
    overpricedAbove: Math.round(hi * 1.25 * m),
  };
}

function profile(
  id: string,
  displayName: string,
  aliases: string[],
  opts: {
    checklist: string[];
    redFlags: string[];
    alternatives: string[];
    regionalNotes: string;
    sizes: PlantPriceProfile["sizes"];
  }
): PlantPriceProfile {
  return { id, displayName, aliases, ...opts };
}

const AVOCADO_CHECKLIST = [
  "Grafted tree, not seed-grown",
  "Strong central trunk",
  "No black spots on leaves",
  "No major yellowing",
  "No circling roots",
  "Moist but not swampy soil",
  "Leaves should not be crispy",
  "Look for variety tag: Hass, Lamb Hass, Fuerte, Reed, Bacon, Pinkerton",
];

const AVOCADO_FLAGS = [
  "Root-bound roots circling the pot",
  "Mushy trunk base",
  "Heavy leaf drop",
  "Burnt leaf edges",
  "No variety tag",
  "Seedling avocado sold as fruiting tree",
  "Soil smells rotten",
  "Plant is leaning badly",
];

const AVOCADO_ALTS = [
  "Hass avocado",
  "Reed avocado",
  "Lamb Hass avocado",
  "Fuerte avocado",
  "Pinkerton avocado",
];

const AVOCADO_NOTES =
  "Avocados usually need good drainage and protection from extreme heat when young. In Pasadena / Southern California, Hass and Reed perform well.";

export const PLANT_PRICE_PROFILES: PlantPriceProfile[] = [
  profile("hass-avocado", "Hass Avocado Tree", ["avocado", "hass", "blank avocado", "avocado tree"], {
    checklist: AVOCADO_CHECKLIST,
    redFlags: AVOCADO_FLAGS,
    alternatives: AVOCADO_ALTS,
    regionalNotes: AVOCADO_NOTES,
    sizes: {
      "1 gallon": p(18, 35),
      "3 gallon": p(35, 75),
      "5 gallon": p(55, 110),
      "15 gallon": p(120, 220),
    },
  }),
  profile("meyer-lemon", "Meyer Lemon Tree", ["meyer", "lemon", "lemon tree", "citrus lemon"], {
    checklist: ["Grafted citrus on strong rootstock", "Dark green leaves", "No pest webbing", "Firm trunk", "Tag shows Meyer or Improved Meyer"],
    redFlags: ["Yellowing with wet soil", "Scale on stems", "Sucker growth below graft", "Leggy weak trunk"],
    alternatives: ["Eureka lemon", "Lisbon lemon", "Improved Meyer"],
    regionalNotes: "Excellent for SoCal patios. Meyer lemons are sweeter and more cold-tolerant than Eureka.",
    sizes: { "1 gallon": p(15, 30), "3 gallon": p(30, 65), "5 gallon": p(50, 95), "15 gallon": p(110, 200) },
  }),
  profile("lime-tree", "Lime Tree", ["lime", "key lime", "persian lime", "lime tree"], {
    checklist: ["Grafted tree", "Thornless preferred for home", "Compact shape", "No leaf curl"],
    redFlags: ["Citrus leafminer trails", "Root circling", "No graft visible"],
    alternatives: ["Bearss lime", "Key lime (Mexican)", "Kaffir lime"],
    regionalNotes: "Limes love heat. Protect young trees from frost in inland valleys.",
    sizes: { "1 gallon": p(14, 28), "3 gallon": p(28, 60), "5 gallon": p(45, 90), "15 gallon": p(100, 185) },
  }),
  profile("orange-tree", "Orange Tree", ["orange", "navel", "valencia", "orange tree"], {
    checklist: ["Grafted navel or Valencia", "Even canopy", "No gumming on trunk"],
    redFlags: ["HLB-style mottled leaves", "Heavy fruit drop", "Weak graft union"],
    alternatives: ["Cara Cara navel", "Blood orange", "Mandarin/tangerine"],
    regionalNotes: "Navels are popular in California home gardens. Buy from reputable citrus nurseries.",
    sizes: { "1 gallon": p(16, 32), "3 gallon": p(32, 70), "5 gallon": p(55, 100), "15 gallon": p(115, 210) },
  }),
  profile("olive-tree", "Olive Tree", ["olive", "olive tree", "fruitless olive"], {
    checklist: ["Single trunk or multi-trunk form", "Silvery-green foliage", "No scale", "Fruitless vs fruiting tag clear"],
    redFlags: ["Olive knot swellings", "Severe leaf drop", "Tiny pot for tree size"],
    alternatives: ["Arbequina", "Mission olive", "Swan Hill (fruitless)"],
    regionalNotes: "Olive trees thrive in Pasadena heat. Fruitless varieties reduce mess.",
    sizes: { "1 gallon": p(12, 25), "3 gallon": p(25, 55), "5 gallon": p(40, 85), "15 gallon": p(95, 175) },
  }),
  profile("japanese-maple", "Japanese Maple", ["japanese maple", "maple", "acer"], {
    checklist: ["Balanced branch structure", "No scorched leaf tips", "Graft clean on standard", "Correct variety tag"],
    redFlags: ["Crispy leaves in nursery shade", "Trunk damage", "Wrong sun exposure for variety"],
    alternatives: ["Bloodgood", "Coral Bark", "Viridis"],
    regionalNotes: "Japanese maples need afternoon shade in hot inland areas like Pasadena.",
    sizes: { "1 gallon": p(18, 40), "3 gallon": p(40, 90), "5 gallon": p(70, 140), "15 gallon": p(150, 280) },
  }),
  profile("bougainvillea", "Bougainvillea", ["bougainvillea", "bouganvilla"], {
    checklist: ["Bracts present or budded", "Flexible stems", "No powdery mildew"],
    redFlags: ["Fully dry in small pot", "Broken main stems", "No new growth"],
    alternatives: ["Barbara Karst (red)", "Rosenka (orange)", "California Gold"],
    regionalNotes: "Bougainvillea loves Pasadena sun. Do not overpay for tiny pots with big labels.",
    sizes: { "1 gallon": p(8, 18), "3 gallon": p(18, 40), "5 gallon": p(30, 65), "15 gallon": p(70, 130) },
  }),
  profile("fiddle-leaf-fig", "Fiddle Leaf Fig", ["fiddle leaf", "ficus lyrata", "fiddle"], {
    checklist: ["Single strong stem or bush form", "No brown spots", "Leaves firm not floppy"],
    redFlags: ["Brown spots spreading", "Leaf drop history", "Cold damage"],
    alternatives: ["Ficus Audrey", "Rubber plant", "Ficus benjamina"],
    regionalNotes: "Indoor staple. Bigger specimens command premium — verify branch stability.",
    sizes: { "1 gallon": p(12, 25), "3 gallon": p(25, 55), "5 gallon": p(45, 95), "15 gallon": p(100, 200) },
  }),
  profile("monstera", "Monstera", ["monstera", "swiss cheese", "deliciosa"], {
    checklist: ["Split leaves on mature sizes", "No pest dots", "Upright support if tall"],
    redFlags: ["Root rot smell", "Yellowing lower leaves with wet soil", "Mealybugs in axils"],
    alternatives: ["Monstera adansonii", "Rhaphidophora tetrasperma", "Philodendron"],
    regionalNotes: "Fast grower indoors. Price varies wildly by fenestration — compare leaf splits.",
    sizes: { "4 inch": p(8, 15), "1 gallon": p(15, 30), "3 gallon": p(28, 60), "5 gallon": p(45, 90) },
  }),
  profile("snake-plant", "Snake Plant", ["snake plant", "sansevieria", "dracaena trifasciata"], {
    checklist: ["Firm upright leaves", "No mushy base", "Multiple pups OK"],
    redFlags: ["Soft base", "Overwatered soggy soil", "Cold damage"],
    alternatives: ["ZZ plant", "Pothos", "Cast iron plant"],
    regionalNotes: "Hard to kill — do not overpay for common varieties at big box.",
    sizes: { "4 inch": p(5, 12), "1 gallon": p(10, 22), "3 gallon": p(18, 40), "5 gallon": p(30, 65) },
  }),
  profile("aloe-vera", "Aloe Vera", ["aloe", "aloe vera"], {
    checklist: ["Plump leaves", "No brown mush", "Offsets healthy"],
    redFlags: ["Rotten center", "Shriveled in wet soil", "Sunburn on nursery shelf"],
    alternatives: ["Agave attenuata", "Haworthia", "Echeveria"],
    regionalNotes: "Succulent — cheap at box stores, premium for large specimens.",
    sizes: { "4 inch": p(4, 10), "1 gallon": p(8, 18), "3 gallon": p(15, 35), "5 gallon": p(25, 55) },
  }),
  profile("lavender", "Lavender", ["lavender", "lavendar"], {
    checklist: ["Silvery foliage", "Not woody and bare", "Fragrant when rubbed"],
    redFlags: ["Leggy no lower leaves", "Overwatered yellow", "Wrong type for humidity"],
    alternatives: ["French lavender", "Spanish lavender", "Phenomenal"],
    regionalNotes: "Loves Pasadena dry heat. Good drainage essential.",
    sizes: { "1 gallon": p(8, 16), "3 gallon": p(16, 32), "5 gallon": p(28, 55) },
  }),
  profile("rosemary", "Rosemary", ["rosemary"], {
    checklist: ["Upright or trailing form as labeled", "Aromatic needle leaves", "No powdery mildew"],
    redFlags: ["Dry dead center", "Root bound in tiny pot", "Pest webbing"],
    alternatives: ["Tuscan Blue", "Prostrate rosemary", "Barbecue rosemary"],
    regionalNotes: "Very easy in SoCal. Often cheaper at herb sections than nursery aisles.",
    sizes: { "1 gallon": p(6, 14), "3 gallon": p(14, 28), "5 gallon": p(22, 45) },
  }),
  profile("hydrangea", "Hydrangea", ["hydrangea", "hydranga"], {
    checklist: ["Buds or blooms for season", "No wilt in morning", "Blue/pink tag if color matters"],
    redFlags: ["Fully dry in sun", "Black spots", "Wrong zone variety"],
    alternatives: ["Endless Summer", "Oakleaf hydrangea", "Panicle hydrangea"],
    regionalNotes: "Hydrangeas need afternoon shade in hot areas. Soil pH affects color.",
    sizes: { "1 gallon": p(12, 25), "3 gallon": p(25, 50), "5 gallon": p(40, 80), "15 gallon": p(90, 160) },
  }),
  profile("rose", "Rose", ["rose", "roses", "hybrid tea"], {
    checklist: ["Own-root or graft labeled", "No black spot", "Healthy cane structure"],
    redFlags: ["Powdery mildew heavy", "Dead canes", "No tag / mystery variety"],
    alternatives: ["David Austin", "Floribunda", "Knock Out"],
    regionalNotes: "Bare-root season (winter) is cheapest. Container roses cost more in spring.",
    sizes: { "1 gallon": p(10, 22), "3 gallon": p(22, 45), "5 gallon": p(35, 70), "15 gallon": p(80, 150) },
  }),
  profile("magnolia", "Magnolia", ["magnolia", "southern magnolia", "little gem"], {
    checklist: ["Single leader", "Glossy leaves", "No split bark"],
    redFlags: ["Transplant shock severe", "Wrong cultivar size for space"],
    alternatives: ["Little Gem", "DD Blanchard", "Teddy Bear"],
    regionalNotes: "Southern magnolias are long-lived — pay for structure on larger sizes.",
    sizes: { "3 gallon": p(35, 70), "5 gallon": p(60, 120), "15 gallon": p(130, 250), "24 inch box": p(250, 450) },
  }),
  profile("crape-myrtle", "Crape Myrtle", ["crape myrtle", "crepe myrtle", "lagerstroemia"], {
    checklist: ["Multi-trunk or single per preference", "No aphid honeydew", "Correct mature height on tag"],
    redFlags: ["Topped/pruned badly", "Wrong mature size cultivar", "Powdery mildew prone variety in shade"],
    alternatives: ["Natchez (white)", "Dynamite (red)", "Catawba (purple)"],
    regionalNotes: "Heat lovers — excellent for Pasadena. Buy for mature height, not just flower color.",
    sizes: { "3 gallon": p(25, 50), "5 gallon": p(45, 90), "15 gallon": p(100, 180), "24 inch box": p(200, 380) },
  }),
  profile("pomegranate", "Pomegranate", ["pomegranate", "pom", "pomagranate"], {
    checklist: ["Grafted or known variety", "No trunk damage", "Compact branching"],
    redFlags: ["Cracked trunk", "Heavy fruit load on tiny tree", "Unknown seed-grown"],
    alternatives: ["Wonderful", "Parfianka", "Eversweet"],
    regionalNotes: "Drought tolerant once established. Wonderful is the common standard.",
    sizes: { "1 gallon": p(14, 28), "3 gallon": p(28, 55), "5 gallon": p(45, 85), "15 gallon": p(95, 170) },
  }),
  profile("fig-tree", "Fig Tree", ["fig", "fig tree", "brown turkey", "black mission"], {
    checklist: ["Known variety tag", "Single trunk form", "No leaf rust"],
    redFlags: ["Root bound in small pot", "Frozen damage", "No variety = unknown quality"],
    alternatives: ["Black Mission", "Brown Turkey", "Panache (striped)"],
    regionalNotes: "Figs love SoCal heat. Black Mission is a Pasadena favorite.",
    sizes: { "1 gallon": p(12, 25), "3 gallon": p(25, 55), "5 gallon": p(40, 80), "15 gallon": p(90, 165) },
  }),
  profile("bird-of-paradise", "Bird of Paradise", ["bird of paradise", "strelitzia"], {
    checklist: ["Upright leaves", "No split damage", "Pups at base OK"],
    redFlags: ["Torn leaves everywhere", "Cold damage", "Overpriced small division"],
    alternatives: ["Strelitzia reginae", "White bird of paradise", "Banana plant"],
    regionalNotes: "Slow to bloom from small sizes — do not pay premium for immature plants expecting flowers soon.",
    sizes: { "1 gallon": p(15, 30), "3 gallon": p(30, 65), "5 gallon": p(50, 100), "15 gallon": p(110, 200) },
  }),
];
