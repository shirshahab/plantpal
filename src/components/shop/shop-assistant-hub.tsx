"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, BookOpen, Package, Tag } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductCard } from "@/components/marketplace/product-card";
import { BuyingGuidesPanel } from "@/components/marketplace/buying-guides-panel";
import { calculateSuitabilityScore, findSpeciesForName } from "@/lib/location/suitability";
import {
  BUYING_GUIDES,
  MOCK_PRODUCTS,
  PRODUCT_CATEGORY_LABELS,
  getProductsByCategory,
} from "@/lib/marketplace";
import type { ProductCategory } from "@/lib/marketplace/types";
import type { ShopRecommendation } from "@/lib/types/phase6";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { cn } from "@/lib/utils";

type Tab = "finder" | "guides" | "products";

function getRecommendations(input: {
  zip: string;
  location: string;
  sun: string;
  space: string;
  experience: string;
  type: string;
  petSafe: boolean;
  lowMaintenance: boolean;
}): ShopRecommendation[] {
  const base: ShopRecommendation[] = [
    {
      name: "Olive Tree",
      whyItFits: `Thrives in ${input.zip || "your area"} with ${input.sun} and handles heat well.`,
      watering: "Deep water every 10–14 days once established",
      soil: "Well-draining loam or raised bed mix",
      difficulty: "Easy",
      buyChecklist: ["Look for healthy silvery leaves", "Avoid root-bound pots", "Choose dwarf if space is limited"],
    },
    {
      name: "Lavender",
      whyItFits: "Low maintenance, drought tolerant, and perfect for full sun patios.",
      watering: "Allow soil to dry between waterings",
      soil: "Sandy, alkaline mix",
      difficulty: "Easy",
      buyChecklist: ["Check for good airflow around plant", "Avoid overwatered nursery stock"],
    },
    {
      name: "Rosemary",
      whyItFits: "Hardy herb that loves sun and needs minimal care.",
      watering: "Weekly in summer, less in winter",
      soil: "Light, well-draining soil",
      difficulty: "Very Easy",
      buyChecklist: ["Upright vs trailing form", "Fragrant foliage = healthy plant"],
    },
  ];

  if (input.type.includes("citrus") || input.sun.includes("full")) {
    base.unshift({
      name: "Meyer Lemon",
      whyItFits: "Best citrus for home gardens — compact and productive.",
      watering: "Deep water weekly in summer",
      soil: "Citrus mix, slightly acidic",
      difficulty: "Moderate",
      buyChecklist: ["Grafted tree for faster fruit", "No yellow leaves", "Multiple branches"],
    });
  }

  return scoreRecommendations(base.slice(0, input.lowMaintenance ? 3 : 4), input);
}

function scoreRecommendations(
  items: ShopRecommendation[],
  input: { zip: string; experience: string }
): ShopRecommendation[] {
  return items.map((rec) => {
    const species = findSpeciesForName(rec.name);
    if (!species) return rec;
    const suit = calculateSuitabilityScore(species, {
      zipCode: input.zip || "91107",
      experienceLevel: input.experience as "beginner" | "intermediate" | "advanced",
    });
    return {
      ...rec,
      suitabilityScore: suit.score,
      whyItFits: `${rec.whyItFits} Suitability: ${suit.score}/100.`,
    };
  });
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "finder", label: "Plant finder", icon: ShoppingBag },
  { id: "guides", label: "Buying guides", icon: BookOpen },
  { id: "products", label: "Products", icon: Package },
];

const ALL_CATEGORIES = Object.keys(PRODUCT_CATEGORY_LABELS) as ProductCategory[];

export function ShopAssistantHub() {
  const [tab, setTab] = useState<Tab>("finder");
  const [zip, setZip] = useState("91107");
  const [location, setLocation] = useState("outdoor");
  const [sun, setSun] = useState("full_sun");
  const [space, setSpace] = useState("medium");
  const [experience, setExperience] = useState("beginner");
  const [type, setType] = useState("any");
  const [petSafe, setPetSafe] = useState(false);
  const [lowMaint, setLowMaint] = useState(true);
  const [results, setResults] = useState<ShopRecommendation[] | null>(null);
  const [category, setCategory] = useState<ProductCategory | "all">("all");

  useEffect(() => {
    const profile = loadUserProfile();
    if (profile.zipCode) setZip(profile.zipCode);
  }, []);

  const products =
    category === "all" ? MOCK_PRODUCTS : getProductsByCategory(category);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="Shop Assistant"
        description="Buy smarter — plants, soil, fertilizer, and tools matched to your yard."
        action={
          <Link href="/price-checker">
            <Button variant="secondary" size="sm" className="touch-manipulation">
              <Tag className="w-4 h-4" />
              Price checker
            </Button>
          </Link>
        }
      />

      <Card padding="md" className="bg-gradient-to-br from-green-50/80 to-white border-green-100">
        <p className="text-sm text-gray-700 leading-relaxed">
          PlantPal helps you choose the right plants and supplies <strong>before</strong> you buy.
          Recommendations are mock previews — affiliate links and live pricing come later.
        </p>
      </Card>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 flex-1 min-w-[100px] py-2.5 px-3 text-sm font-medium rounded-lg transition-colors touch-manipulation whitespace-nowrap",
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
            )}
          >
            <t.icon className="w-4 h-4 shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "finder" && (
        <>
          <Card padding="md" className="space-y-3">
            <Input label="ZIP code" value={zip} onChange={(e) => setZip(e.target.value)} />
            <Select
              label="Indoor / outdoor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              options={[
                { value: "outdoor", label: "Outdoor" },
                { value: "indoor", label: "Indoor" },
              ]}
            />
            <Select
              label="Sun exposure"
              value={sun}
              onChange={(e) => setSun(e.target.value)}
              options={[
                { value: "full_sun", label: "Full sun" },
                { value: "partial_sun", label: "Partial sun" },
                { value: "shade", label: "Shade" },
              ]}
            />
            <Select
              label="Space size"
              value={space}
              onChange={(e) => setSpace(e.target.value)}
              options={[
                { value: "small", label: "Small (patio pot)" },
                { value: "medium", label: "Medium (yard)" },
                { value: "large", label: "Large (landscape)" },
              ]}
            />
            <Select
              label="Experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
            <Select
              label="Plant type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: "any", label: "Any" },
                { value: "citrus", label: "Citrus / fruit" },
                { value: "herb", label: "Herbs" },
                { value: "indoor", label: "Indoor tropical" },
              ]}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={petSafe} onChange={(e) => setPetSafe(e.target.checked)} />
              Pet safe required
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={lowMaint} onChange={(e) => setLowMaint(e.target.checked)} />
              Low maintenance required
            </label>
            <Button
              className="w-full touch-manipulation"
              onClick={() =>
                setResults(
                  getRecommendations({
                    zip,
                    location,
                    sun,
                    space,
                    experience,
                    type,
                    petSafe,
                    lowMaintenance: lowMaint,
                  })
                )
              }
            >
              Get plant recommendations
            </Button>
          </Card>

          {results && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                For {zip}, {sun.replace("_", " ")}, {lowMaint ? "low maintenance" : "your criteria"}:
              </p>
              {results.map((r) => (
                <Card key={r.name} padding="md" className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    {r.suitabilityScore != null && (
                      <span className="text-sm font-bold text-green-700">{r.suitabilityScore}/100</span>
                    )}
                  </div>
                  <p className="text-sm text-green-700">{r.whyItFits}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Water: {r.watering}</p>
                    <p>Soil: {r.soil}</p>
                    <p>Difficulty: {r.difficulty}</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-400 uppercase">Buy checklist</p>
                    <ul className="text-sm text-gray-600 list-disc pl-4 mt-1">
                      {r.buyChecklist.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setTab("guides")}>
                See related buying guides
              </Button>
            </div>
          )}
        </>
      )}

      {tab === "guides" && <BuyingGuidesPanel guides={BUYING_GUIDES} zipCode={zip} />}

      {tab === "products" && (
        <div className="space-y-4">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory | "all")}
            options={[
              { value: "all", label: "All categories" },
              ...ALL_CATEGORIES.map((c) => ({ value: c, label: PRODUCT_CATEGORY_LABELS[c] })),
            ]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
