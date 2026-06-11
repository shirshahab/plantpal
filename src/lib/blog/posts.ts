/**
 * Marketing blog content. Plain data, no CMS.
 * Add new posts to the POSTS array. Newest date sorts first on /blog.
 */

export const BLOG_CATEGORIES = [
  "Plant Care",
  "Plant Problems",
  "Fruit Trees",
  "Houseplants",
  "Garden Design",
  "PlantPal News",
  "Local Gardening",
  "Tools & Supplies",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** ISO date, e.g. "2026-06-01" */
  date: string;
  author: string;
  category: BlogCategory;
  tags: string[];
  /** Optional path under /public. Falls back to a styled placeholder. */
  featuredImage?: string;
  intro: string;
  sections: BlogSection[];
  faqs: BlogFaq[];
  /** Optional one-liner for the "Planty says" tip box. Falls back to a rotating default. */
  plantyTip?: string;
}

/** Default Planty lines for posts without a custom tip. Picked by slug. */
export const PLANTY_BLOG_TIPS = [
  "Yellow leaves are not a personality trait. Check the soil first.",
  "Check the soil before you panic.",
  "Your plant is being dramatic. It usually just wants consistent water.",
  "That leaf is trying to tell us something. Look at the underside too.",
  "Water less than you think, more consistently than you do.",
];

export function getPlantyTipForPost(post: BlogPost): string {
  if (post.plantyTip) return post.plantyTip;
  let hash = 0;
  for (let i = 0; i < post.slug.length; i++) {
    hash = (hash * 31 + post.slug.charCodeAt(i)) | 0;
  }
  return PLANTY_BLOG_TIPS[Math.abs(hash) % PLANTY_BLOG_TIPS.length];
}

const POSTS: BlogPost[] = [
  {
    slug: "why-are-my-plant-leaves-turning-yellow",
    title: "Why Are My Plant Leaves Turning Yellow?",
    description:
      "Yellow leaves usually mean water, light, or food problems. Here's how to tell which one is killing the vibe.",
    date: "2026-06-08",
    author: "PlantPal Team",
    category: "Plant Problems",
    tags: ["yellow leaves", "diagnosis", "watering", "houseplants"],
    intro:
      "Yellow leaves are your plant filing a complaint. The good news: most complaints fall into three buckets. Water, light, or food. Here's how to figure out which one you're dealing with.",
    plantyTip: "Yellow leaves are not a personality trait. Check the soil first.",
    sections: [
      {
        heading: "Check the watering first",
        paragraphs: [
          "Overwatering is the number one cause of yellow leaves. Stick a finger two inches into the soil. Wet and the leaves are soft and yellow? You're loving it to death. Bone dry and the leaves are crispy and yellow? Opposite problem.",
        ],
      },
      {
        heading: "Then check the light",
        paragraphs: [
          "A plant in a dark corner will slowly turn pale yellow because it can't make food. A plant on a scorching windowsill gets bleached patches. Match the plant to the light it actually wants, not the spot that looks best on your shelf.",
        ],
      },
      {
        heading: "Then check the food",
        paragraphs: [
          "If watering and light look fine, your plant may be hungry. Old leaves turning yellow while new growth looks fine usually means nitrogen deficiency. A balanced fertilizer during the growing season fixes it.",
        ],
      },
      {
        heading: "When to worry",
        paragraphs: [
          "One or two old yellow leaves at the bottom? Normal aging. Yellow spreading fast, spots, or sticky residue? That can be pests or disease, and it's worth a closer look.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I cut off yellow leaves?",
        answer:
          "Yes. Once a leaf is fully yellow it won't turn green again. Trim it so the plant puts energy into new growth.",
      },
      {
        question: "Can a plant recover from yellow leaves?",
        answer:
          "Almost always, if you fix the cause. Fix the watering or light issue and new growth should come in green.",
      },
      {
        question: "How fast should I see improvement?",
        answer:
          "Give it two to four weeks. Plants move slower than your group chat.",
      },
    ],
  },
  {
    slug: "how-often-should-you-water-a-lemon-tree",
    title: "How Often Should You Water a Lemon Tree?",
    description:
      "Lemon trees hate soggy feet and bone-dry soil. Here's the watering rhythm that keeps them happy.",
    date: "2026-06-07",
    author: "PlantPal Team",
    category: "Fruit Trees",
    tags: ["lemon tree", "citrus", "watering", "fruit trees"],
    intro:
      "Lemon trees are drama queens about water. Too much and the roots rot. Too little and they drop leaves out of spite. Here's the rhythm that works.",
    sections: [
      {
        heading: "The short answer",
        paragraphs: [
          "Water deeply when the top two to three inches of soil are dry. For most climates that's once or twice a week in summer and every couple of weeks in winter. Potted trees dry out faster than in-ground trees.",
        ],
      },
      {
        heading: "Deep watering beats frequent sprinkles",
        paragraphs: [
          "A light daily sprinkle trains shallow roots. A deep soak once or twice a week trains roots to grow down, which makes the tree tougher. Water slowly until it drains from the bottom of the pot or soaks a wide ring around the trunk.",
        ],
      },
      {
        heading: "Adjust for weather",
        paragraphs: [
          "Heat wave coming? Water more. Cool and cloudy week? Back off. Your ZIP code matters more than any generic schedule, which is exactly why PlantPal builds watering plans around local weather.",
        ],
      },
      {
        heading: "Signs you got it wrong",
        paragraphs: [],
        list: [
          "Yellow leaves and wet soil: overwatering",
          "Curled, crispy leaves: underwatering",
          "Leaf drop after a schedule change: give it two weeks to adjust",
          "Fruit splitting: inconsistent watering, keep it steady",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I water a lemon tree every day?",
        answer:
          "No. Daily watering is the fast lane to root rot. Deep and infrequent wins.",
      },
      {
        question: "Do potted lemon trees need more water?",
        answer:
          "Yes. Pots dry out faster, especially terracotta. Check the soil every few days in summer.",
      },
    ],
  },
  {
    slug: "best-plants-for-pasadena-gardens",
    title: "Best Plants for Pasadena Gardens",
    description:
      "Warm days, mild winters, USDA zone 10. Here's what actually thrives in Pasadena yards.",
    date: "2026-06-06",
    author: "PlantPal Team",
    category: "Local Gardening",
    tags: ["pasadena", "zone 10", "california", "garden planning"],
    intro:
      "Pasadena sits in USDA zone 10 with warm summers and winters that barely count as winter. That opens up a huge menu. Here's the short list of plants that thrive there with minimal drama.",
    sections: [
      {
        heading: "Fruit trees that love it",
        paragraphs: [],
        list: [
          "Meyer lemon: practically the official tree of Southern California",
          "Avocado: needs space and patience, pays you back in guacamole",
          "Fig: handles heat and looks great doing it",
          "Pomegranate: thrives on neglect once established",
        ],
      },
      {
        heading: "Low-water champions",
        paragraphs: [],
        list: [
          "Bougainvillea: blooms like it's showing off",
          "Lavender: smells great, pollinators love it",
          "California native sages: built for this exact climate",
          "Rosemary: herb, hedge, and survivor all in one",
        ],
      },
      {
        heading: "What to skip",
        paragraphs: [
          "Plants that need cold winters to fruit, like most cherries and many apples, will sulk. Thirsty tropical plants can work but will run up your water bill. Check chill hours before buying any stone fruit.",
        ],
      },
    ],
    faqs: [
      {
        question: "When should I plant in Pasadena?",
        answer:
          "Fall is the secret weapon. Mild winters let roots establish before summer heat. Spring works too.",
      },
      {
        question: "What USDA zone is Pasadena?",
        answer:
          "Zone 10a in most neighborhoods. Foothill areas can run slightly cooler.",
      },
    ],
  },
  {
    slug: "powdery-mildew-on-plants-what-to-do-first",
    title: "Powdery Mildew on Plants: What to Do First",
    description:
      "White powder on your leaves is a fungus, not dust. Here's the first 48 hours of fighting back.",
    date: "2026-06-05",
    author: "PlantPal Team",
    category: "Plant Problems",
    tags: ["powdery mildew", "fungus", "plant disease", "treatment"],
    intro:
      "That white dusty coating on your leaves is powdery mildew, a fungus that spreads fast and weakens plants. Caught early, it's very beatable. Here's what to do first.",
    sections: [
      {
        heading: "Step 1: Isolate and trim",
        paragraphs: [
          "Move affected potted plants away from healthy ones. Trim off the worst-hit leaves and throw them in the trash, not the compost. Don't rinse the leaves first, water spreads the spores.",
        ],
      },
      {
        heading: "Step 2: Improve airflow",
        paragraphs: [
          "Powdery mildew loves still, humid air. Space plants out, prune crowded growth, and skip overhead watering. Water the soil, not the leaves.",
        ],
      },
      {
        heading: "Step 3: Treat",
        paragraphs: [
          "A simple homemade spray works for mild cases: one tablespoon of baking soda and a half teaspoon of liquid soap in a gallon of water. Spray every week. For stubborn cases, neem oil or a sulfur-based fungicide from the nursery does the job. Always test a leaf first and follow the label.",
        ],
      },
      {
        heading: "Step 4: Watch for two weeks",
        paragraphs: [
          "Check new growth every few days. If white patches keep appearing, escalate the treatment. If new leaves come in clean, you won.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is powdery mildew dangerous to people?",
        answer:
          "No, but it can wreck your plant's energy production. It's a plant problem, not a people problem.",
      },
      {
        question: "Will powdery mildew go away on its own?",
        answer:
          "Rarely. It usually spreads. Treat it early and it's an easy win.",
      },
      {
        question: "Can I eat vegetables from a plant with powdery mildew?",
        answer:
          "Wash them well and they're generally fine. Avoid eating the visibly affected leaves.",
      },
    ],
  },
  {
    slug: "how-to-tell-if-your-plant-is-overwatered",
    title: "How to Tell If Your Plant Is Overwatered",
    description:
      "Drooping with wet soil? That's not thirst. Here's how to spot overwatering before root rot sets in.",
    date: "2026-06-04",
    author: "PlantPal Team",
    category: "Plant Care",
    tags: ["overwatering", "root rot", "watering", "diagnosis"],
    intro:
      "Here's the plot twist that kills more plants than anything else: an overwatered plant looks thirsty. It droops, you water it more, and the spiral continues. Break the cycle.",
    sections: [
      {
        heading: "The telltale signs",
        paragraphs: [],
        list: [
          "Drooping leaves while the soil is still wet",
          "Yellow leaves that feel soft, not crispy",
          "Mushy stems near the soil line",
          "Fungus gnats partying around the pot",
          "A swampy smell from the soil",
        ],
      },
      {
        heading: "The finger test settles it",
        paragraphs: [
          "Stick a finger two inches into the soil before every watering. Damp? Walk away. Dry? Water deeply. This one habit prevents most overwatering deaths.",
        ],
      },
      {
        heading: "How to rescue an overwatered plant",
        paragraphs: [
          "Stop watering and move it somewhere bright with good airflow. If the pot has no drainage hole, repot immediately into one that does. For bad cases, slide the plant out and check the roots. Healthy roots are firm and pale. Brown mushy roots get trimmed off before repotting in fresh, dry soil.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long does it take an overwatered plant to recover?",
        answer:
          "One to three weeks if the roots are mostly healthy. Be patient and resist the urge to water.",
      },
      {
        question: "Should I fertilize a recovering plant?",
        answer:
          "No. Stressed roots can't handle fertilizer. Wait until you see new growth.",
      },
    ],
  },
  {
    slug: "best-fruit-trees-for-small-backyards",
    title: "Best Fruit Trees for Small Backyards",
    description:
      "No orchard required. These compact fruit trees produce real harvests in small spaces and even pots.",
    date: "2026-06-03",
    author: "PlantPal Team",
    category: "Fruit Trees",
    tags: ["fruit trees", "small spaces", "dwarf trees", "backyard"],
    intro:
      "You don't need an orchard. You need one good tree and a sunny corner. These compact options produce real fruit in small yards, patios, and even large pots.",
    sections: [
      {
        heading: "Top picks for tight spaces",
        paragraphs: [],
        list: [
          "Dwarf Meyer lemon: 6 to 8 feet, happy in a pot, fruits nearly year-round in mild climates",
          "Dwarf peach: compact varieties stay under 6 feet and still load up with fruit",
          "Columnar apple: grows straight up like a fruit-bearing fence post",
          "Fig: tolerates hard pruning, so you decide how big it gets",
          "Kumquat: small tree, tons of fruit, surprisingly cold-tolerant for a citrus",
        ],
      },
      {
        heading: "Pots vs. ground",
        paragraphs: [
          "Pots give you control and mobility but need more frequent watering and feeding. Ground planting means deeper roots and less babysitting. Either works. Just match the variety to the space.",
        ],
      },
      {
        heading: "One tree, real expectations",
        paragraphs: [
          "Most dwarf trees fruit within two to three years. Some need a pollinator partner, so check before buying if you only have room for one. Self-fertile varieties like Meyer lemon and most figs fruit solo.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can fruit trees really grow in pots?",
        answer:
          "Yes. Citrus, figs, and dwarf stone fruit do great in 15 to 25 gallon containers with drainage.",
      },
      {
        question: "How much sun do fruit trees need?",
        answer:
          "Six to eight hours of direct sun. Less sun means less fruit. There's no negotiating this one.",
      },
    ],
  },
  {
    slug: "what-to-check-before-buying-a-plant",
    title: "What to Check Before Buying a Plant",
    description:
      "Nurseries sell sick plants all the time. Here's the 60-second inspection that saves you money and heartbreak.",
    date: "2026-06-02",
    author: "PlantPal Team",
    category: "Tools & Supplies",
    tags: ["buying plants", "nursery", "plant shopping", "inspection"],
    intro:
      "That gorgeous plant at the nursery might be hiding pests, root rot, or a price tag from another dimension. Run this 60-second inspection before it comes home with you.",
    sections: [
      {
        heading: "The 60-second inspection",
        paragraphs: [],
        list: [
          "Flip the leaves: check undersides for webbing, sticky spots, or tiny moving dots",
          "Check the soil line: mushy stems or mold mean trouble",
          "Look at the pot bottom: roots circling out of the drainage holes mean it's rootbound",
          "Squeeze the nursery pot gently: rock-hard soil means it's been neglected",
          "Smell it: healthy soil smells earthy, rot smells sour",
        ],
      },
      {
        heading: "Pick the boring one",
        paragraphs: [
          "The plant covered in blooms is spending all its energy on flowers. The compact, deep-green plant with new growth coming in will outperform it within a month. Buy potential, not the party trick.",
        ],
      },
      {
        heading: "Know the fair price",
        paragraphs: [
          "Prices for the same plant can vary wildly between stores. PlantPal's Price Checker tells you a fair range before you pay nursery-boutique markup for a pothos.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I repot a new plant right away?",
        answer:
          "Wait a week or two. Moving homes is stressful enough. Let it settle before disturbing the roots.",
      },
      {
        question: "Should I quarantine new plants?",
        answer:
          "Yes, two weeks away from your other plants. Hitchhiking pests are real and they multiply fast.",
      },
    ],
  },
  {
    slug: "how-to-keep-houseplants-alive-without-losing-your-mind",
    title: "How to Keep Houseplants Alive Without Losing Your Mind",
    description:
      "You don't need 40 care guides. You need five habits. Here's houseplant care minus the overwhelm.",
    date: "2026-06-01",
    author: "PlantPal Team",
    category: "Houseplants",
    tags: ["houseplants", "beginners", "plant care", "routine"],
    intro:
      "Houseplant care advice has somehow become a part-time job's worth of reading. Forget all that. Five habits keep most houseplants alive, and none of them involve a moisture meter spreadsheet.",
    sections: [
      {
        heading: "Habit 1: Finger before watering",
        paragraphs: [
          "Two inches into the soil. Damp means skip it. Dry means water deeply until it drains. This single habit prevents the most common houseplant death.",
        ],
      },
      {
        heading: "Habit 2: Match plant to light, not to shelf",
        paragraphs: [
          "Plants don't care about your interior design vision. A fern in a dark hallway is a slow-motion funeral. Put the plant where the light is, then decorate around it.",
        ],
      },
      {
        heading: "Habit 3: One walkthrough a week",
        paragraphs: [
          "Once a week, look at every plant for 10 seconds. Yellow leaves, sticky spots, droop, bugs. Catching problems in week one instead of week four is the entire difference between a trim and a funeral.",
        ],
      },
      {
        heading: "Habit 4: Drainage is non-negotiable",
        paragraphs: [
          "Pots without drainage holes are decorative until proven otherwise. Keep the plant in a plastic nursery pot inside the pretty one, and dump the excess water.",
        ],
      },
      {
        heading: "Habit 5: Stop moving them around",
        paragraphs: [
          "Plants hate moving more than you do. Find a good spot, leave it there, and let it acclimate. Dropped leaves after a move are normal for a couple of weeks.",
        ],
      },
    ],
    faqs: [
      {
        question: "What's the best houseplant for beginners?",
        answer:
          "Pothos, snake plant, or ZZ plant. All three forgive neglect and bounce back from mistakes.",
      },
      {
        question: "Do houseplants need fertilizer?",
        answer:
          "Lightly, during spring and summer. A diluted balanced fertilizer once a month is plenty. Skip winter.",
      },
      {
        question: "Why does my houseplant keep dying no matter what?",
        answer:
          "Usually it's the spot, not you. Wrong light or a draft can doom a plant before care even matters. Scan it with PlantPal and find out what it actually wants.",
      },
    ],
  },
];

/** All posts, newest first. */
export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Same category first, then recent. Never includes the post itself. */
export function getRelatedPosts(slug: string, count = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  const others = getAllPosts().filter((p) => p.slug !== slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, count);
}

/** Approximate reading time in minutes. */
export function getReadingTime(post: BlogPost): number {
  const words = [
    post.intro,
    ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.list ?? [])]),
    ...post.faqs.flatMap((f) => [f.question, f.answer]),
  ]
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
