import type { GalleryItem } from "@/lib/types/phase6";

/** Featured garden archetypes — matches community preview categories. */
export type FeaturedGardenType =
  | "backyard_orchard"
  | "bonsai_collection"
  | "houseplant_jungle"
  | "vegetable_garden"
  | "mediterranean_yard"
  | "pollinator_garden";

export const FEATURED_GARDEN_TYPE_LABELS: Record<FeaturedGardenType, string> = {
  backyard_orchard: "Backyard orchard",
  bonsai_collection: "Bonsai collection",
  houseplant_jungle: "Houseplant jungle",
  vegetable_garden: "Vegetable garden",
  mediterranean_yard: "Mediterranean yard",
  pollinator_garden: "Pollinator garden",
};

/** Future-ready post types — maps to community_posts.post_type. */
export type CommunityPostType =
  | "tip"
  | "question"
  | "story"
  | "transformation"
  | "garden_showcase";

export type CommunityReactionType = "cheer" | "helpful" | "love" | "wow";

export interface PlantOfWeek {
  id: string;
  commonName: string;
  scientificName: string;
  imageUrl: string;
  blurb: string;
  whyNow: string;
  zone: string;
  updatedLabel: string;
  cheers: number;
}

export interface CommunityTip {
  id: string;
  author: string;
  avatar: string;
  location: string;
  tip: string;
  tag: string;
  cheers: number;
  timeAgo: string;
}

export interface CommunityQuestion {
  id: string;
  author: string;
  avatar: string;
  location: string;
  title: string;
  body: string;
  tags: string[];
  answers: number;
  cheers: number;
  timeAgo: string;
  status: "open" | "answered";
}

export interface SuccessStory {
  id: string;
  title: string;
  author: string;
  avatar: string;
  location: string;
  excerpt: string;
  imageUrl: string;
  stat: string;
  readMinutes: number;
  timeAgo: string;
}

export interface FeaturedGarden {
  id: string;
  gardenType: FeaturedGardenType;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  owner: string;
  ownerAvatar: string;
  location: string;
  plantCount: number;
  cheers: number;
  tags: string[];
}

export const COMMUNITY_STATS = {
  activeGrowers: 847,
  tipsThisWeek: 124,
  gardensNearby: 38,
  questionsThisWeek: 56,
};

export const PLANT_OF_WEEK: PlantOfWeek = {
  id: "pow-1",
  commonName: "Meyer Lemon",
  scientificName: "Citrus × meyeri",
  imageUrl: "/artwork/species/lemon.webp",
  blurb:
    "Sweet, thin-skinned lemons perfect for patio trees in Southern California. Right now is peak bloom-to-fruit transition season.",
  whyNow:
    "March–April is when Meyer lemons set fruit in zones 9–10. Deep watering now supports the crop you'll harvest in fall.",
  zone: "USDA 8–11",
  updatedLabel: "Updated this Monday",
  cheers: 312,
};

export const LOCAL_GROWER_TIPS: CommunityTip[] = [
  {
    id: "tip-1",
    author: "Maria G.",
    avatar: "MG",
    location: "Pasadena, CA",
    tip: "Water citrus deeply but less often — if the top 2 inches are dry, it's time. Shallow daily sprinkles cause fruit drop.",
    tag: "Citrus",
    cheers: 89,
    timeAgo: "3h ago",
  },
  {
    id: "tip-2",
    author: "James L.",
    avatar: "JL",
    location: "Altadena, CA",
    tip: "Group humidity-loving plants together and mist in the morning. Your ferns will thank you before the afternoon heat.",
    tag: "Houseplants",
    cheers: 64,
    timeAgo: "Yesterday",
  },
  {
    id: "tip-3",
    author: "Priya S.",
    avatar: "PS",
    location: "Sierra Madre, CA",
    tip: "Start tomatoes after the last frost window — here that's usually mid-March. Mulch immediately to keep soil cool.",
    tag: "Vegetables",
    cheers: 112,
    timeAgo: "2 days ago",
  },
  {
    id: "tip-4",
    author: "Tom R.",
    avatar: "TR",
    location: "Glendale, CA",
    tip: "For bonsai, check wire every 3 weeks in growing season. Scars heal slower once bark thickens.",
    tag: "Bonsai",
    cheers: 47,
    timeAgo: "This week",
  },
  {
    id: "tip-5",
    author: "Sofia N.",
    avatar: "SN",
    location: "San Marino, CA",
    tip: "Mediterranean yards: gravel mulch + lavender edges cut water use by half. Drip on a timer, not overhead spray.",
    tag: "Mediterranean",
    cheers: 73,
    timeAgo: "This week",
  },
];

/** @deprecated Use LOCAL_GROWER_TIPS */
export const COMMUNITY_TIPS = LOCAL_GROWER_TIPS;

export const COMMUNITY_QUESTIONS: CommunityQuestion[] = [
  {
    id: "q-1",
    author: "Nina K.",
    avatar: "NK",
    location: "Pasadena, CA",
    title: "Avocado leaves curling inward — heat or pests?",
    body: "New growth looks fine but older leaves are cupping. Watered Sunday, no visible bugs. Zone 10b, full afternoon sun.",
    tags: ["Avocado", "Troubleshooting"],
    answers: 4,
    cheers: 18,
    timeAgo: "5h ago",
    status: "open",
  },
  {
    id: "q-2",
    author: "Chris P.",
    avatar: "CP",
    location: "Altadena, CA",
    title: "Best pollinator mix for a narrow side yard?",
    body: "Only 4 ft wide between fence and house. Want native color spring through fall without blocking the path.",
    tags: ["Pollinators", "Design"],
    answers: 7,
    cheers: 31,
    timeAgo: "Yesterday",
    status: "answered",
  },
  {
    id: "q-3",
    author: "Lena W.",
    avatar: "LW",
    location: "South Pasadena, CA",
    title: "When to repot a root-bound Monstera?",
    body: "Roots circling the pot but still pushing new leaves. Wait until spring or repot now?",
    tags: ["Houseplants", "Repotting"],
    answers: 3,
    cheers: 12,
    timeAgo: "2 days ago",
    status: "open",
  },
  {
    id: "q-4",
    author: "Ray M.",
    avatar: "RM",
    location: "Glendale, CA",
    title: "Raised bed soil recipe for tomatoes?",
    body: "First year with raised beds. Compost + topsoil + what else? Drainage seems fine after test dig.",
    tags: ["Vegetables", "Soil"],
    answers: 9,
    cheers: 44,
    timeAgo: "3 days ago",
    status: "answered",
  },
];

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: "story-1",
    title: "From yellow leaves to first harvest",
    author: "Elena Martinez",
    avatar: "EM",
    location: "Pasadena, CA",
    excerpt:
      "My Meyer lemon looked hopeless after a heat wave. I adjusted watering, added mulch, and waited. Six months later — 14 lemons.",
    imageUrl:
      "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=600&h=400&fit=crop&q=80",
    stat: "14 lemons · first harvest",
    readMinutes: 3,
    timeAgo: "4 days ago",
  },
  {
    id: "story-2",
    title: "Revived a root-bound Fiddle Leaf Fig",
    author: "Marcus Webb",
    avatar: "MW",
    location: "La Cañada, CA",
    excerpt:
      "Dropped leaves, soggy soil, zero confidence. Repotted with fresh mix, moved to brighter indirect light, and stuck to a schedule.",
    imageUrl:
      "https://images.unsplash.com/photo-1614594975524-2aba8ac3cb18?w=600&h=400&fit=crop&q=80",
    stat: "12 new leaves in 8 weeks",
    readMinutes: 4,
    timeAgo: "1 week ago",
  },
  {
    id: "story-3",
    title: "First season tomatoes that actually worked",
    author: "Aisha Okonkwo",
    avatar: "AO",
    location: "Altadena, CA",
    excerpt:
      "Previous years I over-watered and under-fed. This time I used PlantPal tasks, mulched early, and harvested through November.",
    imageUrl:
      "https://images.unsplash.com/photo-1592840064570-884177fccc7a?w=600&h=400&fit=crop&q=80",
    stat: "40+ lbs harvested",
    readMinutes: 5,
    timeAgo: "2 weeks ago",
  },
];

export const COMMUNITY_TRANSFORMATIONS: GalleryItem[] = [
  {
    id: "comm-t-1",
    plantId: "mock-1",
    plantName: "Meyer Lemon Tree",
    beforeUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    afterUrl:
      "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=400&fit=crop",
    daysBetween: 90,
    note: "Sparse leaves → full canopy after deep watering schedule.",
  },
  {
    id: "comm-t-2",
    plantId: "mock-2",
    plantName: "Monstera",
    beforeUrl:
      "https://images.unsplash.com/photo-1593691502-6c263a056f09?w=400&h=400&fit=crop",
    afterUrl:
      "https://images.unsplash.com/photo-1614594975524-2aba8ac3cb18?w=400&h=400&fit=crop",
    daysBetween: 120,
    note: "Split leaves after brighter indirect light + repot.",
  },
  {
    id: "comm-t-3",
    plantId: "mock-4",
    plantName: "Japanese Maple Bonsai",
    beforeUrl:
      "https://images.unsplash.com/photo-1592150628122-0e8b6a11a6b0?w=400&h=400&fit=crop",
    afterUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4863644?w=400&h=400&fit=crop",
    daysBetween: 365,
    note: "One year of wiring, pruning, and patience.",
  },
];

export const FEATURED_GARDENS: FeaturedGarden[] = [
  {
    id: "garden-orchard",
    gardenType: "backyard_orchard",
    title: "Backyard Orchard",
    subtitle: "Citrus, stone fruit & pollinators",
    description:
      "A zone 10 backyard with Meyer lemon, avocado, and peach trees — designed for staggered harvests and bee-friendly understory.",
    imageUrl:
      "https://images.unsplash.com/photo-1466692476860-a088c219fe7a?w=800&h=500&fit=crop&q=80",
    owner: "Elena Martinez",
    ownerAvatar: "EM",
    location: "Pasadena, CA",
    plantCount: 24,
    cheers: 428,
    tags: ["Fruit trees", "Zone 10", "Pollinator-friendly"],
  },
  {
    id: "garden-bonsai",
    gardenType: "bonsai_collection",
    title: "Bonsai Collection",
    subtitle: "12 trees · wired & refined",
    description:
      "A patio collection spanning maple, juniper, and ficus — each on its own care rhythm with seasonal repotting notes.",
    imageUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4863644?w=800&h=500&fit=crop&q=80",
    owner: "David Chen",
    ownerAvatar: "DC",
    location: "South Pasadena, CA",
    plantCount: 18,
    cheers: 356,
    tags: ["Bonsai", "Daily care", "Patience pays"],
  },
  {
    id: "garden-jungle",
    gardenType: "houseplant_jungle",
    title: "Houseplant Jungle",
    subtitle: "67 plants · one living room",
    description:
      "A bright corner turned into a layered indoor ecosystem — pothos trails, monsteras, and a humidifier on a timer.",
    imageUrl:
      "https://images.unsplash.com/photo-1614594975524-2aba8ac3cb18?w=800&h=500&fit=crop&q=80",
    owner: "Marcus Webb",
    ownerAvatar: "MW",
    location: "La Cañada, CA",
    plantCount: 67,
    cheers: 612,
    tags: ["Indoor", "Humidity", "Low light tips"],
  },
  {
    id: "garden-vegetable",
    gardenType: "vegetable_garden",
    title: "Vegetable Garden",
    subtitle: "Raised beds · year-round",
    description:
      "A four-bed rotation that keeps tomatoes, peppers, and greens producing through mild winters.",
    imageUrl:
      "https://images.unsplash.com/photo-1592840064570-884177fccc7a?w=800&h=500&fit=crop&q=80",
    owner: "Aisha Okonkwo",
    ownerAvatar: "AO",
    location: "Altadena, CA",
    plantCount: 31,
    cheers: 289,
    tags: ["Vegetables", "Raised beds", "Compost"],
  },
  {
    id: "garden-mediterranean",
    gardenType: "mediterranean_yard",
    title: "Mediterranean Yard",
    subtitle: "Olive, lavender & gravel paths",
    description:
      "A front yard that trades lawn for drought-tolerant structure — Italian cypress anchors, lavender borders, and smart drip zones.",
    imageUrl:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=500&fit=crop&q=80",
    owner: "Sofia Navarro",
    ownerAvatar: "SN",
    location: "San Marino, CA",
    plantCount: 42,
    cheers: 374,
    tags: ["Low water", "Gravel mulch", "Zone 10"],
  },
  {
    id: "garden-pollinator",
    gardenType: "pollinator_garden",
    title: "Pollinator Garden",
    subtitle: "Native blooms · year-round visitors",
    description:
      "A narrow side strip converted into a hummingbird highway — salvia, penstemon, milkweed, and a shallow water dish.",
    imageUrl:
      "https://images.unsplash.com/photo-1499006089348-7297094601c2?w=800&h=500&fit=crop&q=80",
    owner: "Chris Park",
    ownerAvatar: "CP",
    location: "Altadena, CA",
    plantCount: 28,
    cheers: 501,
    tags: ["Native plants", "Bees & birds", "Side yard"],
  },
];
