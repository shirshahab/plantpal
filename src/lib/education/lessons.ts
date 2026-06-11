import type { Lesson } from "./types";

export const LESSONS: Lesson[] = [
  {
    id: "yellow-leaves",
    slug: "why-yellow-leaves-happen",
    title: "Why Yellow Leaves Happen",
    category: "Plant Basics",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description:
      "Yellow leaves are a signal, not a single problem. Learn to read the pattern.",
    icon: "🍂",
    content:
      "Yellow leaves are not one problem. They are a signal. The main causes are overwatering, underwatering, nutrient deficiency, pest pressure, root stress, or seasonal shedding.\n\nStart by looking at which leaves are yellow. Older leaves at the bottom often mean natural aging or nitrogen deficiency. Yellow on new growth points to root issues, iron deficiency, or overwatering. Spotted or patchy yellowing may indicate pests or disease.\n\nBefore you act, check the soil, inspect the roots if possible, and note whether the plant is in active growth or dormancy.",
    keyTakeaways: [
      "Yellow leaves usually mean stress, not always disaster",
      "Check soil before adding more water",
      "Look at the pattern: old leaves, new leaves, edges, spots",
      "Do not fertilize a sick plant without checking roots first",
    ],
    commonMistakes: [
      "Watering more automatically when leaves yellow",
      "Adding fertilizer too early",
      "Ignoring drainage problems",
      "Treating all yellow leaves the same way",
    ],
    actionStep: "Check the soil 2 inches deep before watering again.",
    quiz: {
      question: "What should you check first when leaves turn yellow?",
      options: [
        "Add fertilizer immediately",
        "Check soil moisture",
        "Cut all leaves off",
        "Move plant into full sun",
      ],
      correctIndex: 1,
      explanation:
        "Soil moisture tells you whether the problem is too much or too little water, the most common cause of yellow leaves.",
    },
    relatedPlantTypes: ["citrus", "ficus", "maple", "bougainvillea", "indoor", "outdoor"],
  },
  {
    id: "water-deeply",
    slug: "how-to-water-deeply",
    title: "How to Water Deeply",
    category: "Watering",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description:
      "Deep watering builds stronger roots. Shallow watering creates weak, surface-dependent plants.",
    icon: "💧",
    content:
      "Deep watering means soaking the root zone until water runs out the drainage holes, then letting the soil dry before the next session. This encourages roots to grow downward in search of moisture.\n\nFor outdoor trees and shrubs, water slowly at the drip line, where the outer branches reach, not right against the trunk. For pots, water until you see runoff, then empty the saucer.\n\nFrequency depends on the plant, pot size, and climate. But depth matters more than a rigid schedule.",
    keyTakeaways: [
      "Water until the root zone is soaked, not just the surface",
      "Let soil dry between waterings for most plants",
      "Empty saucers to prevent root rot",
      "Morning watering reduces evaporation loss",
    ],
    commonMistakes: [
      "Light daily sprinkles instead of deep soaks",
      "Leaving pots sitting in standing water",
      "Watering on a calendar instead of checking soil",
    ],
    actionStep:
      "Next time you water, soak until water drains out, then wait and check soil depth before watering again.",
    quiz: {
      question: "Why is deep watering better than frequent shallow watering?",
      options: [
        "It uses less water overall",
        "It encourages deeper root growth",
        "It prevents all pests",
        "It makes leaves greener instantly",
      ],
      correctIndex: 1,
      explanation:
        "Deep watering trains roots to grow downward, making plants more drought-tolerant and stable.",
    },
    relatedPlantTypes: ["tree", "olive", "maple", "outdoor", "citrus"],
  },
  {
    id: "soil-drainage",
    slug: "understanding-soil-drainage",
    title: "Understanding Soil Drainage",
    category: "Soil",
    difficulty: "Beginner",
    estimatedMinutes: 5,
    description:
      "Most potted plants die from poor drainage, not lack of love. Learn why drainage matters.",
    icon: "🪴",
    content:
      "Drainage is how quickly water moves through soil and out of the pot. When soil stays wet too long, roots can't breathe and root rot begins, often before you see any above-ground symptoms.\n\nGood potting mix contains materials like perlite, bark, or pumice that create air pockets. Garden soil alone is too dense for containers.\n\nTest drainage by watering thoroughly: if water sits on the surface or the pot stays heavy for days, you have a drainage problem.",
    keyTakeaways: [
      "Roots need air as much as they need water",
      "Heavy, compacted soil suffocates roots",
      "Every pot needs a drainage hole",
      "Add perlite or bark to improve container mix",
    ],
    commonMistakes: [
      "Using garden soil in pots",
      "Putting rocks at the bottom (it doesn't help)",
      "Choosing decorative pots with no drainage hole",
    ],
    actionStep:
      "Check your pot's drainage holes and lift the pot after watering. It should feel lighter within a few days.",
    quiz: {
      question: "What happens when soil stays wet too long?",
      options: [
        "Plants grow faster",
        "Roots can't breathe and may rot",
        "Leaves turn darker green",
        "Nothing, plants love wet soil",
      ],
      correctIndex: 1,
      explanation:
        "Waterlogged soil pushes out air. Without oxygen, roots die and the plant can't take up water or nutrients.",
    },
    relatedPlantTypes: ["ficus", "indoor", "bougainvillea", "citrus", "pot"],
  },
  {
    id: "fertilize-citrus",
    slug: "when-to-fertilize-citrus-trees",
    title: "When to Fertilize Citrus Trees",
    category: "Fertilizer",
    difficulty: "Intermediate",
    estimatedMinutes: 4,
    description:
      "Citrus are hungry plants. Timing and formula matter more than quantity.",
    icon: "🍋",
    content:
      "Citrus trees need regular feeding during active growth, typically spring through early fall. Use a fertilizer with higher nitrogen and include micronutrients like iron, zinc, and manganese.\n\nStop fertilizing in late fall and winter when growth slows. Over-fertilizing a dormant plant wastes nutrients and can burn roots.\n\nYellow leaves with green veins on new growth often signal iron deficiency. Common in citrus and fixable with chelated iron.",
    keyTakeaways: [
      "Feed citrus during active growth, not dormancy",
      "Use citrus-specific or balanced fertilizer with micronutrients",
      "Yellow new leaves with green veins may mean iron deficiency",
      "Less is more. Follow label rates",
    ],
    commonMistakes: [
      "Fertilizing in winter when the tree is resting",
      "Using generic lawn fertilizer",
      "Feeding a stressed or overwatered tree",
    ],
    actionStep:
      "Check if your citrus is pushing new growth. If yes, feed at half the label rate and observe for two weeks.",
    quiz: {
      question: "When should you avoid fertilizing citrus?",
      options: [
        "During active spring growth",
        "When the tree is dormant in winter",
        "After a good rain",
        "When new leaves are forming",
      ],
      correctIndex: 1,
      explanation:
        "Dormant trees can't use nutrients effectively. Fertilizing during rest can stress roots.",
    },
    relatedPlantTypes: ["citrus", "lemon", "meyer"],
  },
  {
    id: "sun-exposure",
    slug: "full-sun-vs-partial-sun",
    title: "Full Sun vs Partial Sun",
    category: "Sunlight",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description:
      "Light labels on plant tags are vague. Here is what they actually mean.",
    icon: "☀️",
    content:
      "Full sun means 6 or more hours of direct sunlight daily. Partial sun is 3–6 hours, often morning sun with afternoon shade. Shade means less than 3 hours of direct sun.\n\n'Full sun' plants in hot climates may still need afternoon protection. 'Shade' plants in dark corners may become leggy and weak.\n\nWatch your space across a full day before placing a plant. A spot that looks sunny at noon may be in shadow by 3 PM.",
    keyTakeaways: [
      "Full sun = 6+ hours of direct light",
      "Partial sun = 3–6 hours, often morning preferred",
      "Hot afternoon sun is harsher than gentle morning sun",
      "Observe your space before choosing a spot",
    ],
    commonMistakes: [
      "Assuming a sunny windowsill equals full sun",
      "Placing shade plants in direct afternoon sun",
      "Not adjusting for seasonal light changes",
    ],
    actionStep:
      "Track how many hours of direct sun your plant's spot gets today.",
    quiz: {
      question: "How many hours of direct sun counts as 'full sun'?",
      options: ["1–2 hours", "3–4 hours", "6 or more hours", "All day only"],
      correctIndex: 2,
      explanation:
        "Six or more hours of direct sunlight is the standard definition of full sun for most plants.",
    },
    relatedPlantTypes: ["bougainvillea", "olive", "citrus", "outdoor"],
  },
  {
    id: "prune-safely",
    slug: "how-to-prune-without-damaging-growth",
    title: "How to Prune Without Damaging Growth",
    category: "Pruning",
    difficulty: "Intermediate",
    estimatedMinutes: 5,
    description:
      "Good pruning helps plants. Bad pruning creates wounds that never heal properly.",
    icon: "✂️",
    content:
      "Always cut just above a node or bud at a 45-degree angle. Remove dead, diseased, or crossing branches first. These are the priority.\n\nNever remove more than one-third of a plant in a single session. For trees, avoid 'topping': cutting the main leader creates weak, bushy regrowth.\n\nUse clean, sharp tools. Disinfect between cuts when working on diseased material.",
    keyTakeaways: [
      "Cut above a node at a slight angle",
      "Remove dead and crossing branches first",
      "Never remove more than one-third at once",
      "Use sharp, clean tools",
    ],
    commonMistakes: [
      "Flat cuts that don't heal well",
      "Topping trees and shrubs",
      "Pruning during active stress or heat waves",
    ],
    actionStep:
      "Inspect your plant for one dead or crossing branch you can remove cleanly.",
    quiz: {
      question: "How much of a plant should you remove in one pruning session?",
      options: [
        "As much as needed",
        "No more than one-third",
        "At least half",
        "Only the top",
      ],
      correctIndex: 1,
      explanation:
        "Removing more than one-third shocks the plant and reduces its ability to recover.",
    },
    relatedPlantTypes: ["maple", "tree", "bougainvillea", "ficus"],
  },
  {
    id: "overwatering-signs",
    slug: "common-signs-of-overwatering",
    title: "Common Signs of Overwatering",
    category: "Watering",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description:
      "Overwatering looks like underwatering from above. The difference is in the soil.",
    icon: "🌊",
    content:
      "Overwatered plants often have yellow leaves, soft stems, and soil that stays wet for days. You may also see fungus gnats, mold on the soil surface, or a musty smell from the pot.\n\nUnderwatered plants have crispy, brown leaf edges and soil that pulls away from the pot walls.\n\nThe fix for overwatering is not less water forever. It's better drainage and a corrected watering rhythm.",
    keyTakeaways: [
      "Yellow + wet soil = likely overwatering",
      "Crispy brown edges + dry soil = likely underwatering",
      "Fungus gnats often indicate consistently wet soil",
      "Fix drainage before changing your schedule",
    ],
    commonMistakes: [
      "Assuming yellow always means 'needs water'",
      "Not checking soil before watering",
      "Keeping saucers full of water",
    ],
    actionStep:
      "Stick your finger 2 inches into the soil. If it's wet, wait before watering.",
    quiz: {
      question: "Which combo most likely indicates overwatering?",
      options: [
        "Crispy brown edges and dry soil",
        "Yellow leaves and constantly wet soil",
        "New growth and dry soil",
        "Wilting in afternoon heat only",
      ],
      correctIndex: 1,
      explanation:
        "Yellow leaves combined with soggy soil is the classic overwatering signature.",
    },
    relatedPlantTypes: ["ficus", "indoor", "citrus", "bougainvillea"],
  },
  {
    id: "new-growth",
    slug: "how-to-read-new-growth",
    title: "How to Read New Growth",
    category: "Plant Basics",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description:
      "New leaves and shoots tell you whether your plant is happy, or struggling.",
    icon: "🌱",
    content:
      "Healthy new growth is firm, evenly colored, and proportional to the plant's size. Pale, stunted, or curled new leaves suggest something is off, usually light, nutrients, or water.\n\nIf a plant is producing new growth, it's generally healthy enough to care for actively. No new growth during the growing season is a warning sign.\n\nCompare new growth to older leaves on the same plant. Differences in color or size reveal what the plant needs right now.",
    keyTakeaways: [
      "New growth is the best health indicator",
      "Pale or stunted new leaves signal a problem",
      "Active growth means the plant can handle care adjustments",
      "Compare new leaves to mature ones on the same plant",
    ],
    commonMistakes: [
      "Ignoring new growth and only watching old leaves",
      "Fertilizing when there's no new growth to support",
      "Assuming all new growth is automatically healthy",
    ],
    actionStep:
      "Find the newest leaf or shoot on your plant and compare its color and size to older leaves.",
    quiz: {
      question: "What does healthy new growth usually look like?",
      options: [
        "Pale and curled",
        "Firm and evenly colored",
        "Brown at the tips",
        "Smaller than all old leaves always",
      ],
      correctIndex: 1,
      explanation:
        "Firm, evenly colored new growth means the plant has what it needs to thrive.",
    },
    relatedPlantTypes: ["ficus", "citrus", "maple", "indoor", "outdoor"],
  },
  {
    id: "citrus-watering",
    slug: "citrus-watering-basics",
    title: "Citrus Watering Basics",
    category: "Trees",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description:
      "Citrus trees need consistent moisture but hate wet feet. Here is the balance.",
    icon: "🍊",
    content:
      "Citrus prefer deep, infrequent watering over daily light sprinkles. In containers, water when the top 2 inches of soil are dry. In ground, water at the drip line and mulch to retain moisture.\n\nReduce watering in winter when growth slows. Increase during fruit development and hot spells.\n\nLeaf drop after inconsistent watering is common. Establish a rhythm and stick to it.",
    keyTakeaways: [
      "Water deeply when top 2 inches of soil are dry",
      "Reduce watering in winter dormancy",
      "Mulch in-ground trees to retain moisture",
      "Consistency matters more than exact frequency",
    ],
    commonMistakes: [
      "Daily light watering in pots",
      "Watering the trunk instead of the root zone",
      "Same schedule year-round regardless of season",
    ],
    actionStep:
      "Water your citrus deeply today, then mark the date and check soil before the next watering.",
    quiz: {
      question: "When should you water a potted citrus tree?",
      options: [
        "Every day regardless of soil",
        "When the top 2 inches of soil are dry",
        "Only when leaves drop",
        "Once a month always",
      ],
      correctIndex: 1,
      explanation:
        "Checking soil moisture prevents both over- and underwatering for citrus in containers.",
    },
    relatedPlantTypes: ["citrus", "lemon", "meyer"],
  },
  {
    id: "maple-sun",
    slug: "protecting-trees-from-afternoon-sun",
    title: "Protecting Trees From Afternoon Sun",
    category: "Trees",
    difficulty: "Intermediate",
    estimatedMinutes: 4,
    description:
      "Japanese maples and other delicate trees scorch in harsh afternoon light.",
    icon: "🌳",
    content:
      "Many ornamental trees, especially Japanese maples, prefer morning sun and afternoon shade. Hot afternoon sun scorches leaf edges and causes leaf curl.\n\nIf your tree shows brown, crispy leaf margins in summer, it's likely getting too much afternoon exposure. A shade cloth or relocation may help.\n\nIn cooler climates, these same trees may tolerate more sun. Always adjust for your specific microclimate.",
    keyTakeaways: [
      "Morning sun + afternoon shade suits many maples",
      "Scorched leaf edges mean too much hot sun",
      "Microclimate matters. Watch your specific spot",
      "Shade cloth is a quick fix for young trees",
    ],
    commonMistakes: [
      "Planting maples in west-facing full sun in hot climates",
      "Assuming 'partial sun' means any random spot",
      "Not providing shade during heat waves",
    ],
    actionStep:
      "Note whether your tree gets direct sun after 2 PM. If yes, consider afternoon shade.",
    quiz: {
      question: "What light pattern suits Japanese maples in hot climates?",
      options: [
        "Full sun all day",
        "Morning sun, afternoon shade",
        "Complete shade always",
        "Indoor only",
      ],
      correctIndex: 1,
      explanation:
        "Morning sun provides energy without the intense heat stress of afternoon exposure.",
    },
    relatedPlantTypes: ["maple", "acer", "tree"],
  },
  {
    id: "maple-watering",
    slug: "how-to-water-maples",
    title: "How to Water Maples",
    category: "Trees",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description:
      "Maples like consistent moisture but not soggy roots. Here is how to get it right.",
    icon: "🍁",
    content:
      "Japanese maples have shallow, fibrous root systems that dry out quickly but also rot in standing water. Water deeply at the drip line and mulch 2–3 inches to keep roots cool and moist.\n\nNewly planted maples need more frequent watering for the first two years. Established trees are more drought-tolerant but still appreciate deep soaks during dry spells.\n\nWilting in afternoon heat that recovers by morning is normal. Wilting that persists means the tree needs water.",
    keyTakeaways: [
      "Water at the drip line, not the trunk",
      "Mulch keeps shallow roots cool and moist",
      "Afternoon wilting that recovers overnight is normal",
      "Persistent wilting means water now",
    ],
    commonMistakes: [
      "Watering the trunk base only",
      "Letting mulch touch the trunk",
      "Confusing heat wilt with drought stress",
    ],
    actionStep:
      "Apply mulch around your maple's drip line, keeping it 2 inches away from the trunk.",
    quiz: {
      question: "Where should you water a maple tree?",
      options: [
        "Directly at the trunk",
        "At the drip line where roots spread",
        "Only on the leaves",
        "In the neighbor's yard",
      ],
      correctIndex: 1,
      explanation:
        "Most absorbing roots are at the drip line, where the canopy edge meets the ground.",
    },
    relatedPlantTypes: ["maple", "acer", "tree"],
  },
  {
    id: "seasonal-leaf-drop",
    slug: "seasonal-leaf-drop-vs-disease",
    title: "Seasonal Leaf Drop vs Disease",
    category: "Trees",
    difficulty: "Intermediate",
    estimatedMinutes: 5,
    description:
      "Some leaf loss is normal. Some is a cry for help. Learn the difference.",
    icon: "🍃",
    content:
      "Deciduous trees naturally drop leaves in fall. Uniform yellowing followed by leaf fall is expected. Evergreens shed older interior needles periodically.\n\nDisease-related drop is different: spots, patches, wilting, or leaves falling out of season. Pest damage shows chewed edges or sticky residue.\n\nIf leaf drop happens during the growing season with discoloration patterns, investigate soil, water, and pests before assuming it's seasonal.",
    keyTakeaways: [
      "Fall leaf drop on deciduous trees is normal",
      "Out-of-season drop with spots or wilting is not",
      "Interior needle drop on evergreens is often normal aging",
      "Pattern and timing tell you whether to worry",
    ],
    commonMistakes: [
      "Panicking about normal autumn color change",
      "Ignoring summer leaf drop as 'just seasonal'",
      "Spraying pesticides without identifying the cause",
    ],
    actionStep:
      "Check if leaf drop is happening on old interior leaves only or across new growth too.",
    quiz: {
      question: "When is leaf drop most likely normal?",
      options: [
        "Mid-summer with spotted leaves",
        "Autumn on a deciduous tree with uniform yellowing",
        "New growth falling in spring",
        "All leaves dropping in one day in June",
      ],
      correctIndex: 1,
      explanation:
        "Autumn color change and leaf fall on deciduous trees is a natural seasonal cycle.",
    },
    relatedPlantTypes: ["maple", "acer", "tree"],
  },
  {
    id: "indoor-humidity",
    slug: "indoor-plant-humidity-tips",
    title: "Indoor Plant Humidity Tips",
    category: "Indoor Plants",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description:
      "Dry indoor air stresses tropical plants. Simple fixes make a big difference.",
    icon: "🏠",
    content:
      "Most houseplants come from humid environments. Indoor heating and AC drop humidity to 20–30%, while many plants prefer 40–60%.\n\nGrouping plants together, using pebble trays with water, and placing plants away from heating vents all help. Misting provides only brief relief. A humidifier is the most effective solution.\n\nBrown leaf tips on fiddle leaf figs and ferns often mean the air is too dry.",
    keyTakeaways: [
      "Indoor air is often too dry for tropical plants",
      "Grouping plants raises local humidity",
      "Keep plants away from heating vents and AC blasts",
      "A humidifier is the most reliable fix",
    ],
    commonMistakes: [
      "Relying on occasional misting alone",
      "Placing plants directly above radiators",
      "Assuming all houseplants need the same humidity",
    ],
    actionStep:
      "Move your most sensitive indoor plant away from any heating vent or AC direct flow.",
    quiz: {
      question: "What's the most effective way to raise humidity for indoor plants?",
      options: [
        "Misting once a week",
        "Using a humidifier",
        "Watering more often",
        "Moving plants to the bathroom permanently",
      ],
      correctIndex: 1,
      explanation:
        "A humidifier consistently raises ambient humidity. Misting only helps for minutes.",
    },
    relatedPlantTypes: ["ficus", "fiddle", "indoor"],
  },
  {
    id: "citrus-yellow-leaves",
    slug: "why-citrus-leaves-turn-yellow",
    title: "Why Citrus Leaves Turn Yellow",
    category: "Pests & Disease",
    difficulty: "Intermediate",
    estimatedMinutes: 4,
    description:
      "Citrus yellowing has specific causes. Learn to diagnose before you treat.",
    icon: "🟡",
    content:
      "Citrus yellow leaves often trace to one of four causes: overwatering, nitrogen deficiency, iron deficiency, or cold stress.\n\nIron deficiency shows yellow new leaves with green veins (interveinal chlorosis). Nitrogen deficiency yellows older leaves first. Overwatering yellows leaves while soil stays wet.\n\nTreat the cause, not the symptom. And never fertilize a waterlogged tree.",
    keyTakeaways: [
      "Yellow new leaves with green veins = likely iron deficiency",
      "Yellow old leaves first = likely nitrogen deficiency",
      "Yellow + wet soil = overwatering",
      "Diagnose before treating",
    ],
    commonMistakes: [
      "Adding nitrogen when iron is the problem",
      "Fertilizing waterlogged citrus",
      "Assuming all yellow citrus leaves need the same fix",
    ],
    actionStep:
      "Look at which citrus leaves are yellow: old, new, or all. Then check soil moisture.",
    quiz: {
      question: "Yellow new leaves with green veins on citrus usually indicate:",
      options: [
        "Too much sun",
        "Iron deficiency",
        "Normal aging",
        "Over-pruning",
      ],
      correctIndex: 1,
      explanation:
        "Interveinal chlorosis on new growth is a classic sign of iron deficiency in citrus.",
    },
    relatedPlantTypes: ["citrus", "lemon", "meyer"],
  },
  {
    id: "buy-healthy-nursery-plant",
    slug: "how-to-buy-a-healthy-nursery-plant",
    title: "How to Buy a Healthy Nursery Plant",
    category: "Plant Basics",
    difficulty: "Beginner",
    estimatedMinutes: 6,
    description:
      "Avoid overpaying for stressed plants. Learn what to inspect before you buy.",
    icon: "🏷️",
    content:
      "Buying a nursery plant is like a mini health inspection. Start with the roots. Gently tip the pot and look for white, firm roots. Brown mush or circling roots are red flags.\n\nCheck the trunk or main stem for damage, scars, or soft spots. Leaves should match the season: new growth should look fresh, not crispy or yellow unless the plant is dormant.\n\nUnderstand nursery sizes: a 1-gallon is starter size, 3–5 gallon is common for fruit trees, 15-gallon is established. Bigger is not always better if roots are bound.\n\nFor fruit trees, grafted trees produce predictable fruit; seed-grown avocados and citrus may never fruit well. Big box stores can be great values on common plants; local nurseries often have better variety tags and staff knowledge.\n\nCheap plants that die cost more than a fair-price healthy plant. When in doubt, pass and come back next week.",
    keyTakeaways: [
      "Inspect roots before you buy: firm and white, not mushy or circling",
      "Fruit trees should be grafted with a visible, healthy union",
      "Nursery size labels describe pot volume, not instant maturity",
      "Big box can save money; local nurseries excel on specialty stock",
      "A stressed discount plant is rarely a bargain",
    ],
    commonMistakes: [
      "Buying root-bound plants without negotiating price down",
      "Assuming all avocado trees will fruit like Hass",
      "Ignoring pest signs because the plant 'looks OK from the front'",
      "Paying premium prices for common herbs and succulents",
    ],
    actionStep:
      "Next nursery visit: tip one pot, check roots, and read the variety tag before buying.",
    quiz: {
      question: "Why is a grafted fruit tree usually worth more than a seedling?",
      options: [
        "Grafted trees are always bigger",
        "Grafted trees produce known fruit varieties reliably",
        "Seedlings are illegal to sell",
        "Grafted trees never need water",
      ],
      correctIndex: 1,
      explanation:
        "Grafting ensures you get a known variety like Hass avocado instead of unpredictable seedling genetics.",
    },
    relatedPlantTypes: ["citrus", "avocado", "tree", "nursery", "outdoor"],
  },
  {
    id: "climate-affects-care",
    slug: "how-climate-affects-plant-care",
    title: "How Your Climate Affects Plant Care",
    category: "Climate",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description: "Your ZIP code changes how often you water, when you fertilize, and what risks to watch for.",
    icon: "🌡️",
    content:
      "Plant care is not one-size-fits-all. A watering schedule that works in Seattle will fail in Pasadena.\n\nYour local climate's heat, humidity, frost, and rain patterns determine how fast soil dries, when plants grow, and when they rest.\n\nPlantPal uses your ZIP to estimate USDA zone and seasonal patterns so recommendations match where you actually garden.",
    keyTakeaways: [
      "Climate beats calendar dates for watering decisions",
      "Heat increases evaporation. Pots dry faster than in-ground plants",
      "Local frost dates matter for citrus, avocado, and tropicals",
    ],
    commonMistakes: [
      "Copying a friend's schedule from a different state",
      "Watering on the same day every week regardless of weather",
    ],
    actionStep: "Check your garden soil moisture before watering today, not the calendar.",
    quiz: {
      question: "What should drive your watering schedule most?",
      options: ["The day of the week", "Soil moisture and local weather", "Fertilizer schedule", "Plant height"],
      correctIndex: 1,
      explanation: "Soil moisture and weather reflect your local climate better than a fixed calendar.",
    },
    relatedPlantTypes: ["indoor", "outdoor"],
  },
  {
    id: "usda-zones",
    slug: "what-usda-zones-mean",
    title: "What USDA Zones Mean",
    category: "Climate",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description: "USDA hardiness zones estimate the average coldest winter temperature in your area.",
    icon: "🗺️",
    content:
      "USDA zones (like 10a or 8b) help you match plants to winter survival. A plant rated zones 8–10 can handle winters in those zones.\n\nZones do not tell you about summer heat, drought, or humidity. But they are a essential first filter when buying trees and shrubs.",
    keyTakeaways: [
      "Zone = average minimum winter temperature",
      "Always check zone range on nursery tags",
      "Indoor plants still benefit from knowing your outdoor zone for patio season",
    ],
    commonMistakes: ["Assuming zone tells you everything about summer care"],
    actionStep: "Look up your zone and compare it to the next plant you want to buy.",
    quiz: {
      question: "USDA zones primarily describe:",
      options: ["Summer heat", "Average coldest winter temps", "Rainfall", "Soil pH"],
      correctIndex: 1,
      explanation: "Zones are based on historical average minimum winter temperatures.",
    },
    relatedPlantTypes: ["outdoor", "tree"],
  },
  {
    id: "heat-wave-stress",
    slug: "how-heat-waves-stress-plants",
    title: "How Heat Waves Stress Plants",
    category: "Climate",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description: "Extreme heat shuts down growth, increases water loss, and makes fertilizer risky.",
    icon: "☀️",
    content:
      "During heat waves, plants close stomata to conserve water. Growth slows even when soil is wet.\n\nLeaf scorch, wilting, and dropped fruit are common. Young trees and potted plants suffer first.\n\nDeep morning watering, mulch, and afternoon shade help. Hold fertilizer until temperatures moderate.",
    keyTakeaways: [
      "Heat stress looks like underwatering but may need shade, not more water",
      "Avoid fertilizing during extreme heat",
      "Containers heat faster than in-ground soil",
    ],
    commonMistakes: ["Fertilizing wilting plants during a heat wave"],
    actionStep: "Deep water one stressed plant early tomorrow morning.",
    quiz: {
      question: "During a heat wave you should generally:",
      options: ["Fertilize heavily", "Deep water early and avoid feeding", "Prune heavily", "Repot immediately"],
      correctIndex: 1,
      explanation: "Deep early watering helps; fertilizer during heat adds stress.",
    },
    relatedPlantTypes: ["citrus", "avocado", "outdoor"],
  },
  {
    id: "water-hot-dry-summers",
    slug: "water-in-hot-dry-summers",
    title: "How to Water in Hot Dry Summers",
    category: "Climate",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description: "Mediterranean and desert climates need deep, infrequent watering, not daily sprinkles.",
    icon: "💧",
    content:
      "In hot dry summers, shallow watering trains roots to stay near the surface where soil heats up fast.\n\nWater deeply until moisture reaches the root zone, then let the top inch dry before watering again.\n\nMorning is best: less evaporation and plants enter the hot afternoon hydrated.",
    keyTakeaways: [
      "Deep and less often beats shallow and daily",
      "Morning watering reduces evaporation loss",
      "Mulch keeps soil cooler and moist longer",
    ],
    commonMistakes: ["Daily light sprinkles on trees", "Watering at midday in full sun"],
    actionStep: "Water one tree until water runs from drainage holes, then probe soil depth.",
    quiz: {
      question: "Best watering approach in hot dry climates:",
      options: ["Daily sprinkles", "Deep soak when top soil dries", "Never water in summer", "Only mist leaves"],
      correctIndex: 1,
      explanation: "Deep soaking when the top soil dries encourages deeper, healthier roots.",
    },
    relatedPlantTypes: ["citrus", "outdoor", "tree"],
  },
  {
    id: "frost-protection",
    slug: "frost-protection-basics",
    title: "Frost Protection Basics",
    category: "Climate",
    difficulty: "Beginner",
    estimatedMinutes: 4,
    description: "One cold night can damage citrus, bougainvillea, and avocado. Plan ahead.",
    icon: "❄️",
    content:
      "Frost injures tender tissue when water inside cells freezes. Lower leaves and new growth go first.\n\nCover plants with frost cloth or sheets, not plastic touching leaves. Move pots indoors or against a warm wall.\n\nWater soil before a frost night. Moist soil holds heat better than dry soil.",
    keyTakeaways: [
      "Cover before sunset on frost nights",
      "Potted plants are most vulnerable",
      "Citrus, avocado, and bougainvillea need protection in marginal zones",
    ],
    commonMistakes: ["Using plastic that touches foliage", "Covering after sunrise when damage is done"],
    actionStep: "Identify your most frost-sensitive plant and plan where you'd move or cover it.",
    quiz: {
      question: "When should you cover plants for frost?",
      options: ["After leaves turn black", "Before sunset on cold nights", "Only in snow", "Never cover citrus"],
      correctIndex: 1,
      explanation: "Covers trap ground heat. Install before sunset for best protection.",
    },
    relatedPlantTypes: ["citrus", "avocado", "bougainvillea", "outdoor"],
  },
  {
    id: "local-soil",
    slug: "why-local-soil-matters",
    title: "Why Local Soil Matters",
    category: "Climate",
    difficulty: "Beginner",
    estimatedMinutes: 3,
    description: "Clay, sand, and alkaline soil change drainage and nutrient availability in your yard.",
    icon: "🪨",
    content:
      "Climate and soil work together. Heavy clay in a wet climate holds water and risks root rot. Sandy soil in a hot climate dries in hours.\n\nMany home gardens need amended soil in pots regardless of native ground. Know your drainage before choosing plants and watering frequency.",
    keyTakeaways: [
      "Drainage matters as much as watering frequency",
      "Potting mix differs from native yard soil",
      "Local alkalinity affects citrus and blueberries differently",
    ],
    commonMistakes: ["Using garden soil straight in containers", "Ignoring drainage holes"],
    actionStep: "Dig 2 inches down and note if soil is sandy, clay, or loamy.",
    quiz: {
      question: "Why is drainage especially important in pots?",
      options: [
        "Pots have less soil volume and heat up faster",
        "Plants in pots never need water",
        "Drainage only matters for cacti",
        "Pots always have perfect soil",
      ],
      correctIndex: 0,
      explanation: "Limited soil volume and faster heating make drainage critical in containers.",
    },
    relatedPlantTypes: ["indoor", "outdoor"],
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id || l.slug === id);
}

export function getLessonsByCategory(category: string): Lesson[] {
  return LESSONS.filter((l) => l.category === category);
}
