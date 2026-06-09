import type { PlantSpecies, PlantSpeciesType } from "./types";

export function defaultCompanionPlants(type: PlantSpeciesType, commonName: string): string {
  const map: Record<PlantSpeciesType, string> = {
    tree: "Complement with low groundcovers; avoid shallow-rooted competitors under canopy",
    shrub: "Pair with perennials and bulbs at the base; good border plants with matching sun needs",
    flower: "Marigolds with vegetables; lavender with roses; group by water and sun requirements",
    vegetable: "Basil with tomato; carrots with onions; marigolds for pest deterrence",
    herb: "Plant near vegetables they flavor; rosemary with lavender in dry beds",
    indoor: "Group plants with similar light and humidity; avoid overcrowding for airflow",
    succulent: "Mix textures in shallow bowls; avoid pairing with heavy waterers",
    vine: "Support on trellis with understory herbs or shade-tolerant groundcovers",
    grass: "Combine with flowering perennials at edges; avoid aggressive spreaders nearby",
  };
  return map[type] ?? `Choose companions with similar care needs to ${commonName}.`;
}

export function defaultPollinatorValue(type: PlantSpeciesType): string {
  const map: Record<PlantSpeciesType, string> = {
    tree: "Many fruit and flowering trees support bees, butterflies, and birds when in bloom",
    shrub: "Flowering shrubs often attract bees and hummingbirds during bloom season",
    flower: "High pollinator value — nectar and pollen for bees, butterflies, and hummingbirds",
    vegetable: "Flowers and herbs nearby boost pollination for fruiting crops",
    herb: "Many herbs (basil, lavender, thyme) are excellent pollinator magnets when flowering",
    indoor: "Limited outdoor pollinator value; flowering indoor plants rarely attract wild pollinators",
    succulent: "Some succulents produce nectar for bees when flowering outdoors",
    vine: "Climbing flowers often attract hummingbirds and butterflies",
    grass: "Ornamental grasses provide seed for birds; some support butterfly larvae",
  };
  return map[type] ?? "Moderate pollinator support when flowering.";
}

export function defaultFruitingInfo(type: PlantSpeciesType, commonName: string): string {
  const lower = commonName.toLowerCase();
  if (
    lower.includes("lemon") ||
    lower.includes("lime") ||
    lower.includes("orange") ||
    lower.includes("avocado") ||
    lower.includes("apple") ||
    lower.includes("peach") ||
    lower.includes("cherry") ||
    lower.includes("tomato") ||
    lower.includes("pepper") ||
    lower.includes("berry") ||
    lower.includes("grape") ||
    lower.includes("fig")
  ) {
    return "Produces edible fruit when mature; timing varies by climate and cultivar";
  }
  const map: Record<PlantSpeciesType, string> = {
    tree: "Fruiting varies by species — check if ornamental or edible fruiting type",
    shrub: "Some shrubs produce berries or edible fruit; many are ornamental only",
    flower: "Typically grown for blooms, not fruit",
    vegetable: "Harvest fruit or edible parts at peak ripeness for best flavor",
    herb: "Harvest leaves or stems; occasional seeds used as spice",
    indoor: "Rarely fruits indoors unless given ideal light and pollination",
    succulent: "Some produce edible fruit (e.g. prickly pear); many are ornamental",
    vine: "Many vines produce grapes, berries, or gourds when properly pollinated",
    grass: "Ornamental — not typically grown for edible grain in home gardens",
  };
  return map[type] ?? "Not primarily grown for fruit.";
}

export function defaultFloweringInfo(type: PlantSpeciesType): string {
  const map: Record<PlantSpeciesType, string> = {
    tree: "Spring to early summer bloom typical; some species flower in fall",
    shrub: "Seasonal bloom — spring or summer depending on species",
    flower: "Peak bloom in warm season; deadhead to extend flowering",
    vegetable: "Many vegetables flower before fruit set; bolting ends harvest quality",
    herb: "Allow some herbs to flower for pollinators; pinch basil to delay bloom",
    indoor: "Indoor bloom cycles vary; many tropical plants bloom in bright indirect light",
    succulent: "Seasonal blooms on tall stalks; often summer flowering",
    vine: "Heavy bloom in growing season; prune after flowering for shape",
    grass: "Feathery plumes in late summer to fall for ornamental types",
  };
  return map[type] ?? "Flowers seasonally during active growth.";
}

/** Fill knowledge fields missing from older DB rows or imports. */
export function enrichPlantSpecies(
  species: Partial<PlantSpecies> & {
    id: string;
    common_name: string;
    scientific_name: string;
    type: PlantSpeciesType;
  }
): PlantSpecies {
  return {
    family: species.family ?? "Unknown",
    description:
      species.description ??
      `${species.common_name} (${species.scientific_name}) is a popular ${species.type} for home gardeners.`,
    sunlight: species.sunlight ?? "Varies — see care guide",
    watering: species.watering ?? "Varies — see care guide",
    soil_preference: species.soil_preference ?? "Well-draining soil",
    hardiness_zone_min: species.hardiness_zone_min ?? 5,
    hardiness_zone_max: species.hardiness_zone_max ?? 9,
    mature_height: species.mature_height ?? "Varies",
    mature_width: species.mature_width ?? "Varies",
    growth_rate: species.growth_rate ?? "Moderate",
    toxicity: species.toxicity ?? "Verify before pets/children",
    maintenance_level: species.maintenance_level ?? "Moderate",
    image_url:
      species.image_url ??
      "https://images.unsplash.com/photo-1416879595882-337324a7f4f9?w=600&h=400&fit=crop&q=80",
    secondary_images: species.secondary_images ?? [],
    companion_plants:
      species.companion_plants ??
      defaultCompanionPlants(species.type, species.common_name),
    pollinator_value:
      species.pollinator_value ?? defaultPollinatorValue(species.type),
    fruiting_info:
      species.fruiting_info ??
      defaultFruitingInfo(species.type, species.common_name),
    flowering_info:
      species.flowering_info ?? defaultFloweringInfo(species.type),
    source: species.source ?? "plantpal",
    ...species,
  } as PlantSpecies;
}
