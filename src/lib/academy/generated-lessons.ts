import { buildAcademyLesson, quickLesson } from "./lesson-builder";
import type { AcademyLesson } from "./types";

/** Academy-only lessons (not in legacy education/lessons.ts). */
export const GENERATED_ACADEMY_LESSONS: AcademyLesson[] = [
  buildAcademyLesson({
    id: "what-plants-need",
    pathId: "beginner-gardening",
    title: "What Plants Need",
    icon: "☀️",
    description: "Light, water, air, nutrients, and space: the five essentials.",
    introduction: "Every plant runs on the same basic recipe. Master these five and everything else gets easier.",
    content:
      "Plants need light for energy, water for transport, air in the root zone, nutrients for growth, and enough space for roots and leaves to expand.\n\nWhen one need is missing, plants show stress: yellow leaves, stunted growth, or wilting. Your job is to notice which need is off.",
    funFacts: [
      "Roots breathe oxygen. That's why drainage matters as much as watering.",
      "A plant in the wrong light will survive but rarely thrive.",
    ],
    keyTakeaways: [
      "Five needs: light, water, air, nutrients, space",
      "Stress signals tell you which need is missing",
      "Fix one variable at a time when troubleshooting",
    ],
    commonMistakes: ["Over-correcting with fertilizer when light is the problem", "Ignoring root space in small pots"],
    actionStep: "Pick one plant and rate each of the five needs from 1–5.",
    summary: "Plants are simple when you think in terms of five core needs.",
    quiz: {
      question: "Which is NOT one of the five core plant needs?",
      options: ["Light", "Wi-Fi signal", "Water", "Nutrients"],
      correctIndex: 1,
      explanation: "Plants need light, water, air in soil, nutrients, and space, not internet!",
    },
  }),
  quickLesson(
    "watering-basics",
    "beginner-gardening",
    "Watering Basics",
    "💧",
    "Most plants prefer deep, infrequent watering over daily sprinkles. Check the top 2 inches of soil before adding water. When dry, soak until water drains from the bottom.",
    "When should you water most houseplants?",
    "When the top soil feels dry",
    ["Every morning on a schedule", "Only when leaves are crispy brown"]
  ),
  quickLesson(
    "beginner-common-mistakes",
    "beginner-gardening",
    "Common Mistakes",
    "⚠️",
    "New gardeners often overwater, pick the wrong light, repot too often, or fertilize sick plants. Pause, observe, and change one thing at a time.",
    "What should you do when a plant looks unhealthy?",
    "Observe and change one variable at a time",
    ["Change everything at once", "Throw it away immediately"]
  ),
  quickLesson(
    "soil-types",
    "soil-mastery",
    "Soil Types",
    "🏜️",
    "Sand drains fast but dries quickly. Clay holds water but can suffocate roots. Loam balances both. Most potting mixes are soilless blends designed for containers.",
    "Which soil type drains fastest?",
    "Sandy soil",
    ["Clay soil", "Heavy garden clay"]
  ),
  quickLesson(
    "soil-ph",
    "soil-mastery",
    "pH Basics",
    "⚗️",
    "pH measures acidity. Most plants prefer slightly acidic to neutral soil (6.0–7.0). Blueberries love acid; lavender prefers alkaline. pH affects nutrient availability.",
    "What does soil pH affect?",
    "How available nutrients are to roots",
    ["Only flower color", "Nothing important"]
  ),
  quickLesson(
    "organic-matter",
    "soil-mastery",
    "Organic Matter",
    "🍂",
    "Compost, leaf mold, and aged manure improve soil structure, feed microbes, and help soil hold moisture without becoming waterlogged.",
    "Why add organic matter to soil?",
    "Improves structure and feeds soil life",
    ["Makes soil heavier and harder", "Replaces the need for water"]
  ),
  quickLesson(
    "compost-basics",
    "soil-mastery",
    "Compost",
    "♻️",
    "Compost recycles kitchen scraps and yard waste into garden gold. Balance greens (nitrogen) and browns (carbon), keep it moist, and turn occasionally.",
    "What goes in a compost pile?",
    "A mix of green and brown materials",
    ["Only meat and dairy", "Plastic bags"]
  ),
  quickLesson(
    "mulch-basics",
    "soil-mastery",
    "Mulch",
    "🌾",
    "Mulch cools soil, reduces evaporation, and suppresses weeds. Keep mulch a few inches away from trunks to prevent rot.",
    "Why use mulch in the garden?",
    "Retains moisture and suppresses weeds",
    ["Blocks all rain", "Kills all plants"]
  ),
  quickLesson(
    "raised-beds",
    "soil-mastery",
    "Raised Beds",
    "📦",
    "Raised beds improve drainage, reduce compaction, and warm faster in spring. Fill with quality mix, not plain topsoil alone.",
    "Why use raised beds?",
    "Better drainage and less compaction",
    ["To eliminate watering", "Plants grow without sun"]
  ),
  quickLesson(
    "underwatering-signs",
    "water-mastery",
    "Underwatering",
    "🏜️",
    "Crispy leaf edges, wilting that recovers after watering, and lightweight pots signal drought stress. Slow deep watering fixes most cases.",
    "These leaves are crispy and the pot feels light. Likely cause?",
    "Underwatering",
    ["Overwatering", "Too much shade only"]
  ),
  quickLesson(
    "irrigation-basics",
    "water-mastery",
    "Irrigation",
    "🚿",
    "Drip irrigation delivers water at the root zone with minimal waste. Soaker hoses work for beds; emitters suit individual trees.",
    "What is the most efficient irrigation method?",
    "Drip irrigation at the root zone",
    ["Sprinklers at noon daily", "Hosing leaves only"]
  ),
  quickLesson(
    "rain-collection",
    "water-mastery",
    "Rain Collection",
    "🌧️",
    "Rain barrels capture free, chlorine-free water. Use for ornamentals; avoid on edible leaves if roof debris is a concern unless filtered.",
    "Why collect rainwater?",
    "Free, soft water for garden use",
    ["To replace all soil", "It is always acidic poison"]
  ),
  quickLesson(
    "npk-basics",
    "fertilizer-mastery",
    "NPK Explained",
    "🔬",
    "N (nitrogen) fuels leafy growth. P (phosphorus) supports roots and flowers. K (potassium) strengthens overall health and stress tolerance.",
    "Which nutrient mainly supports leafy growth?",
    "Nitrogen (N)",
    ["Potassium only", "Salt"]
  ),
  quickLesson(
    "organic-fertilizers",
    "fertilizer-mastery",
    "Organic Fertilizers",
    "🌿",
    "Compost, fish emulsion, and bone meal release nutrients slowly and improve soil biology. They are gentler but less precise than synthetics.",
    "Organic fertilizers generally…",
    "Release nutrients slowly and feed soil microbes",
    ["Work instantly like bleach", "Kill all soil life"]
  ),
  quickLesson(
    "synthetic-fertilizers",
    "fertilizer-mastery",
    "Synthetic Fertilizers",
    "⚡",
    "Synthetic fertilizers offer precise NPK ratios and fast uptake. Use sparingly. Over-application can burn roots and harm soil life.",
    "Synthetic fertilizers are best used…",
    "Precisely and sparingly when needed",
    ["Daily in triple doses", "Instead of all watering"]
  ),
  quickLesson(
    "when-to-fertilize",
    "fertilizer-mastery",
    "When To Fertilize",
    "📅",
    "Feed during active growth, usually spring and early summer. Reduce in fall and skip dormant winter for most plants. Never fertilize dry, stressed roots.",
    "When should you fertilize most outdoor plants?",
    "During active growing season",
    ["In deep winter dormancy", "Every day year-round"]
  ),
  quickLesson(
    "micronutrients",
    "fertilizer-mastery",
    "Micronutrients",
    "🧬",
    "Iron, magnesium, calcium, and zinc are needed in tiny amounts. Deficiencies show as specific leaf patterns: yellow veins, brown spots, or tip burn.",
    "Micronutrients are needed…",
    "In small amounts but are still essential",
    ["Never, NPK is enough always", "Only for fake plants"]
  ),
  quickLesson(
    "brown-leaves",
    "plant-health",
    "Brown Leaves",
    "🍂",
    "Brown tips often mean low humidity or salt buildup. Brown spots may indicate fungus or sunburn. Brown mushy leaves suggest overwatering.",
    "Brown crispy tips on leaf edges often indicate…",
    "Low humidity or salt/flouride stress",
    ["Perfect health", "Too much shade only"]
  ),
  quickLesson(
    "root-rot",
    "plant-health",
    "Root Rot",
    "🦠",
    "Root rot happens when roots sit in wet, airless soil. Smell the soil, check for black mushy roots, and repot into fresh mix if caught early.",
    "Root rot is caused by…",
    "Soil staying wet too long",
    ["Too much sunlight", "Not enough leaves"]
  ),
  quickLesson(
    "nutrient-deficiencies",
    "plant-health",
    "Nutrient Deficiencies",
    "🔍",
    "Yellow veins may mean iron deficiency. Purple leaves can signal phosphorus lack. Mobile nutrients show on old leaves first; immobile ones on new growth.",
    "Yellowing between green veins on new leaves suggests…",
    "Iron deficiency",
    ["Perfect nutrition", "Too much water only"]
  ),
  quickLesson(
    "transplant-shock",
    "plant-health",
    "Transplant Shock",
    "🔄",
    "After repotting, plants may wilt as roots adjust. Water once, provide indirect light, and avoid fertilizer for 2–3 weeks.",
    "After repotting, you should…",
    "Water once and avoid fertilizer briefly",
    ["Fertilize heavily immediately", "Place in full hot sun"]
  ),
  quickLesson(
    "beneficial-insects",
    "garden-bugs",
    "Beneficial Insects",
    "🐝",
    "Not all bugs are bad! Predators and pollinators keep your garden balanced. Avoid broad pesticides that kill allies along with pests.",
    "Beneficial insects help by…",
    "Pollinating and eating pest bugs",
    ["Destroying all plants", "Only looking cute"]
  ),
  quickLesson(
    "ladybugs",
    "garden-bugs",
    "Ladybugs",
    "🐞",
    "Ladybugs and their larvae devour aphids. Attract them with dill, yarrow, and no-spray zones.",
    "Ladybugs primarily eat…",
    "Aphids and soft-bodied pests",
    ["Plant roots", "Mulch only"]
  ),
  quickLesson(
    "bees-pollinators",
    "garden-bugs",
    "Bees & Pollinators",
    "🐝",
    "Bees pollinate fruits and flowers. Plant native blooms in succession and avoid pesticides when bees are active.",
    "Why protect bees in the garden?",
    "They pollinate crops and flowers",
    ["They water plants", "They are decorative only"]
  ),
  quickLesson(
    "butterflies",
    "garden-bugs",
    "Butterflies",
    "🦋",
    "Butterflies need host plants for caterpillars and nectar plants for adults. A butterfly garden supports the full lifecycle.",
    "A butterfly garden needs…",
    "Host plants and nectar plants",
    ["Only roses", "Pesticide sprays weekly"]
  ),
  quickLesson(
    "aphids",
    "garden-bugs",
    "Aphids",
    "🟢",
    "Tiny soft-bodied clusters on new growth. Blast with water, introduce ladybugs, or use insecticidal soap. Ants often farm aphids. Control both.",
    "Aphids are best managed first by…",
    "Spraying with water or introducing predators",
    ["Ignoring until plant dies", "Bleach spray"]
  ),
  quickLesson(
    "spider-mites",
    "garden-bugs",
    "Spider Mites",
    "🕸️",
    "Fine webbing and stippled leaves in hot dry weather. Increase humidity, rinse foliage, and use horticultural oil if needed.",
    "Spider mites thrive in…",
    "Hot, dry conditions",
    ["Cold wet winters only", "Underwatered deserts never"]
  ),
  quickLesson(
    "scale-insects",
    "garden-bugs",
    "Scale",
    "🛡️",
    "Immobile bumps on stems and leaves. Scrape gently, apply horticultural oil, and treat ants that protect them.",
    "Scale insects look like…",
    "Small bumps stuck to stems",
    ["Flying beetles at night", "Flower petals"]
  ),
  quickLesson(
    "whiteflies",
    "garden-bugs",
    "Whiteflies",
    "🤍",
    "Clouds of tiny white flies when disturbed. Yellow sticky traps and insecticidal soap help; address heavily infested leaves.",
    "Whiteflies are detected when…",
    "Disturbing leaves causes white clouds",
    ["Leaves turn blue", "Roots grow above soil"]
  ),
  quickLesson(
    "mealybugs",
    "garden-bugs",
    "Mealybugs",
    "☁️",
    "Cottony white clusters in leaf joints. Dab with alcohol on a cotton swab and isolate affected plants.",
    "Mealybugs appear as…",
    "Cottony white clusters",
    ["Green smooth dots only", "Flower buds"]
  ),
  quickLesson(
    "citrus-trees",
    "fruit-trees",
    "Citrus Care",
    "🍋",
    "Citrus loves full sun, deep watering, and nitrogen during growth. Protect from frost and watch for chlorosis in alkaline soil.",
    "Citrus trees need…",
    "Full sun and regular deep watering",
    ["Full shade and never water", "Daily bleach spray"]
  ),
  quickLesson(
    "avocado-trees",
    "fruit-trees",
    "Avocado Trees",
    "🥑",
    "Avocados need excellent drainage and protection from wind and frost. Young trees are sensitive. Mulch well but keep trunk clear.",
    "Avocado roots require…",
    "Excellent drainage",
    ["Standing water always", "No soil at all"]
  ),
  quickLesson(
    "apple-trees",
    "fruit-trees",
    "Apple Trees",
    "🍎",
    "Apples need winter chill hours and cross-pollination for best fruit. Prune for open canopy and thin fruit for size.",
    "Many apple varieties need…",
    "Cross-pollination from another variety",
    ["No sunlight", "Indoor-only growing"]
  ),
  quickLesson(
    "peach-trees",
    "fruit-trees",
    "Peach Trees",
    "🍑",
    "Peaches fruit on last year's wood. Prune annually for airflow and spray preventively for leaf curl in wet climates.",
    "Peach fruit forms on…",
    "Last season's growth",
    ["Only brand-new spring twigs", "Roots underground"]
  ),
  quickLesson(
    "fig-trees",
    "fruit-trees",
    "Fig Trees",
    "🫐",
    "Figs are tough and drought-tolerant once established. Restrict water when fruit ripens for sweeter flavor.",
    "Established fig trees are…",
    "Drought-tolerant once rooted",
    ["Impossible in warm climates", "Aquatic plants"]
  ),
  quickLesson(
    "olive-trees",
    "fruit-trees",
    "Olive Trees",
    "🫒",
    "Olives love sun and lean soil. Overwatering causes root issues. Let soil dry between deep soaks.",
    "Olive trees prefer…",
    "Full sun and well-drained soil",
    ["Constant soggy soil", "Full shade"]
  ),
  quickLesson(
    "pomegranate-trees",
    "fruit-trees",
    "Pomegranate Trees",
    "🍎",
    "Pomegranates handle heat and drought. Fruit splits if watered irregularly during ripening. Keep moisture steady.",
    "Pomegranate fruit splits when…",
    "Watering is irregular during ripening",
    ["You look at them", "They get too much shade"]
  ),
  quickLesson(
    "bonsai-wiring",
    "bonsai",
    "Bonsai Wiring",
    "〰️",
    "Aluminum wire shapes branches slowly. Wrap at 45°, bend gently, and remove before wire cuts in.",
    "Bonsai wire should be removed…",
    "Before it cuts into the bark",
    ["Never, leave forever", "After 10 years only"]
  ),
  quickLesson(
    "bonsai-root-pruning",
    "bonsai",
    "Root Pruning",
    "✂️",
    "Root pruning keeps trees small and healthy in shallow pots. Trim circling roots and refresh soil during repotting.",
    "Root pruning in bonsai…",
    "Keeps the tree healthy in a small pot",
    ["Kills every bonsai instantly", "Is never needed"]
  ),
  quickLesson(
    "bonsai-repotting",
    "bonsai",
    "Bonsai Repotting",
    "🪴",
    "Repot every 2–5 years depending on species. Refresh soil, trim roots, and water carefully after.",
    "Bonsai are repotted to…",
    "Refresh soil and manage root growth",
    ["Make trees taller only", "Eliminate watering"]
  ),
  quickLesson(
    "bonsai-species",
    "bonsai",
    "Species Selection",
    "🌲",
    "Junipers, ficus, and maples are beginner-friendly. Match species to your climate and indoor/outdoor setup.",
    "Beginner bonsai species should…",
    "Match your climate and care setup",
    ["Always be tropical indoors", "Require zero light"]
  ),
  quickLesson(
    "tomato-growing",
    "vegetable-gardening",
    "Tomatoes",
    "🍅",
    "Tomatoes need full sun, consistent water, and support. Stake indeterminate varieties and feed when fruit sets.",
    "Tomatoes produce best with…",
    "Full sun and consistent watering",
    ["Full shade", "Dry soil always"]
  ),
  quickLesson(
    "pepper-growing",
    "vegetable-gardening",
    "Peppers",
    "🌶️",
    "Peppers love heat and well-drained soil. Avoid over-fertilizing with nitrogen or you'll get leaves, not fruit.",
    "Too much nitrogen on peppers causes…",
    "Lots of leaves but little fruit",
    ["Instant giant peppers", "Blue leaves"]
  ),
  quickLesson(
    "herb-garden",
    "vegetable-gardening",
    "Herb Garden",
    "🌿",
    "Basil, rosemary, and mint have different water needs. Harvest regularly to encourage bushy growth. Mint needs its own pot!",
    "Why plant mint in its own container?",
    "It spreads aggressively in garden beds",
    ["It cannot grow alone", "It needs no water"]
  ),
  quickLesson(
    "lettuce-growing",
    "vegetable-gardening",
    "Lettuce",
    "🥬",
    "Lettuce prefers cool weather and partial shade in heat. Succession plant every few weeks for continuous harvest.",
    "Lettuce bolts (flowers) when…",
    "Weather gets too hot",
    ["You water once", "Moon phase only"]
  ),
  quickLesson(
    "squash-growing",
    "vegetable-gardening",
    "Squash",
    "🎃",
    "Squash needs space, pollinators, and watch for squash vine borer. Hand-pollinate if fruit fails to set.",
    "Squash fruit may need…",
    "Pollinators or hand pollination",
    ["Daily pruning to zero leaves", "Indoor shade only"]
  ),
  quickLesson(
    "companion-planting",
    "vegetable-gardening",
    "Companion Planting",
    "🤝",
    "Some plants help neighbors: marigolds deter pests, beans fix nitrogen. Not every pairing is proven, but diversity helps.",
    "Companion planting means…",
    "Growing plants that benefit each other nearby",
    ["Planting one crop only forever", "Mixing bleach with soil"]
  ),
  quickLesson(
    "design-principles",
    "landscaping",
    "Design Principles",
    "✏️",
    "Use repetition, contrast, and focal points. Layer heights for depth: ground cover, shrubs, trees.",
    "Landscape depth comes from…",
    "Layering plants of different heights",
    ["One flat row of identical plants", "Random chaos only"]
  ),
  quickLesson(
    "privacy-trees",
    "landscaping",
    "Privacy Trees",
    "🌲",
    "Evergreen screens block views year-round. Plan mature width so trees don't crowd foundations.",
    "Privacy screens work best with…",
    "Evergreens sized for mature spread",
    ["Annual flowers only", "Indoor ferns"]
  ),
  quickLesson(
    "ground-cover",
    "landscaping",
    "Ground Cover",
    "🍃",
    "Low plants like creeping thyme or mulch alternatives reduce weeds and erosion on slopes.",
    "Ground cover helps…",
    "Reduce weeds and erosion",
    ["Block all rain permanently", "Replace trees"]
  ),
  quickLesson(
    "water-features",
    "landscaping",
    "Water Features",
    "⛲",
    "Fountains and ponds add sound and wildlife habitat. Plan for recirculation, safety, and mosquito control.",
    "Garden water features need…",
    "Circulation and maintenance planning",
    ["Stagnant water forever", "No electricity ever"]
  ),
  quickLesson(
    "landscape-lighting",
    "landscaping",
    "Landscape Lighting",
    "💡",
    "Low-voltage LED uplighting highlights trees and paths. Avoid light pollution. Warm tones feel natural.",
    "Landscape lighting should…",
    "Highlight features without glare",
    ["Blind neighbors", "Use only strobe lights"]
  ),
  quickLesson(
    "hardscaping-basics",
    "landscaping",
    "Hardscaping",
    "🧱",
    "Paths, patios, and walls define outdoor rooms. Plan drainage before paving so water doesn't pool near structures.",
    "Before installing a patio, plan…",
    "Drainage away from structures",
    ["To skip drainage entirely", "Maximum standing water"]
  ),
];

export function getGeneratedLesson(id: string) {
  return GENERATED_ACADEMY_LESSONS.find((l) => l.id === id);
}
