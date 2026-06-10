"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Tag,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  GraduationCap,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { checkPlantPrice } from "@/lib/mock/price-checker";
import { requestPriceCheck } from "@/lib/ai/client";
import { searchPricesApi } from "@/lib/integrations/client";
import { useAiResults } from "@/lib/store/ai-provider";
import { AiPriceCheckDisplay } from "@/components/ai/ai-price-check-display";
import { DataSourceBadge, dataSourceFromPrice } from "@/components/data-source/data-source-badge";
import type { AIPriceCheckResponse } from "@/lib/types/ai";
import type { PriceSearchResponse } from "@/lib/types/integrations";
import type {
  NurserySize,
  StoreType,
  PlantCondition,
  PriceCheckResult,
  BuyRecommendation,
} from "@/lib/types/price-checker";
import { useToast } from "@/lib/store/toast-provider";
import { emitAwardXp } from "@/lib/academy/xp-events";
import { friendlyAiError } from "@/lib/errors/user-messages";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/marketplace/product-card";
import { BuyingGuidesTeaser } from "@/components/marketplace/buying-guides-panel";
import { BUYING_GUIDES, getRelatedProductsForPlant } from "@/lib/marketplace";

const SIZE_OPTIONS: { value: NurserySize; label: string }[] = [
  { value: "4 inch", label: "4 inch" },
  { value: "1 gallon", label: "1 gallon" },
  { value: "2 gallon", label: "2 gallon" },
  { value: "3 gallon", label: "3 gallon" },
  { value: "5 gallon", label: "5 gallon" },
  { value: "7 gallon", label: "7 gallon" },
  { value: "10 gallon", label: "10 gallon" },
  { value: "15 gallon", label: "15 gallon" },
  { value: "24 inch box", label: "24 inch box" },
  { value: "36 inch box", label: "36 inch box" },
  { value: "other", label: "Other" },
];

const STORE_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "big_box", label: "Home Depot / Lowe's" },
  { value: "local_nursery", label: "Local nursery" },
  { value: "online", label: "Online seller" },
  { value: "wholesale", label: "Wholesale nursery" },
];

const CONDITION_OPTIONS = [
  { value: "healthy", label: "Looks healthy" },
  { value: "yellow_leaves", label: "Yellow leaves" },
  { value: "wilting", label: "Wilting" },
  { value: "root_bound", label: "Root bound" },
  { value: "not_sure", label: "Not sure" },
];

const REC_COLORS: Record<BuyRecommendation, string> = {
  "Strong Buy": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Good Buy": "bg-green-50 text-green-700 border-green-200",
  Fair: "bg-amber-50 text-amber-700 border-amber-200",
  Pass: "bg-red-50 text-red-700 border-red-200",
  "Needs Inspection": "bg-blue-50 text-blue-700 border-blue-200",
};

export function PriceCheckerPanel() {
  const { toast } = useToast();
  const { savePriceCheck } = useAiResults();
  const fileRef = useRef<HTMLInputElement>(null);
  const [plantName, setPlantName] = useState("");
  const [size, setSize] = useState<NurserySize>("3 gallon");
  const [zipCode, setZipCode] = useState("91107");
  const [storeType, setStoreType] = useState<StoreType>("any");
  const [condition, setCondition] = useState<PlantCondition>("healthy");
  const [priceAsked, setPriceAsked] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PriceCheckResult | null>(null);
  const [aiResult, setAiResult] = useState<AIPriceCheckResponse | null>(null);
  const [shoppingResults, setShoppingResults] = useState<PriceSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportStore, setReportStore] = useState("");
  const [reportCity, setReportCity] = useState("");
  const [reportPrice, setReportPrice] = useState("");
  const [reportNotes, setReportNotes] = useState("");

  async function handleCheck() {
    if (!plantName.trim()) return;
    setLoading(true);
    setError(null);
    setShoppingResults(null);

    const parsedPrice = priceAsked ? parseFloat(priceAsked.replace(/[^0-9.]/g, "")) : undefined;
    const zip = zipCode.trim() || "91107";

    const [res, prices] = await Promise.all([
      requestPriceCheck({
        plantName: plantName.trim(),
        size,
        zipCode: zip,
        storeType,
        condition,
        priceAsked: Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      }),
      searchPricesApi({
        plantName: plantName.trim(),
        size,
        zipCode: zip,
      }),
    ]);

    if (prices) setShoppingResults(prices);

    if (res.ok) {
      setAiResult(res.data);
      savePriceCheck(res.data);
      setResult(null);
      emitAwardXp("price_check_completed");
      toast(
        res.data.source === "ai"
          ? "Price check ready."
          : "Price check ready — based on typical nursery pricing."
      );
    } else {
      setError(friendlyAiError(res.error, "price check"));
      setResult(
        checkPlantPrice({
          plantName: plantName.trim(),
          size,
          zipCode: zip,
          storeType,
          condition,
          hasPhoto: !!preview,
        })
      );
      setAiResult(null);
    }

    setLoading(false);
  }

  async function handleQuickCheck() {
    if (!plantName.trim()) return;
    setLoading(true);
    setError(null);
    const zip = zipCode.trim() || "91107";

    const prices = await searchPricesApi({
      plantName: plantName.trim(),
      size,
      zipCode: zip,
    });
    setShoppingResults(prices);

    setTimeout(() => {
      setResult(
        checkPlantPrice({
          plantName: plantName.trim(),
          size,
          zipCode: zip,
          storeType,
          condition,
          hasPhoto: !!preview,
        })
      );
      setAiResult(null);
      setLoading(false);
    }, 400);
  }

  function handleReportSubmit() {
    toast("Thanks! Your report helps us build better local pricing data.");
    setReportOpen(false);
    setReportStore("");
    setReportCity("");
    setReportPrice("");
    setReportNotes("");
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <PageHeader
        title="Plant Price Checker"
        description="Know if a plant is worth buying before you bring it home."
        action={
          <Link href="/shop-assistant">
            <Button variant="secondary" size="sm" className="touch-manipulation">
              <ShoppingBag className="w-4 h-4" />
              Shop Assistant
            </Button>
          </Link>
        }
      />

      <Card padding="md" className="bg-amber-50/50 border-amber-100">
        <p className="text-sm text-gray-700 leading-relaxed">
          Check fair price ranges first — then use{" "}
          <Link href="/shop-assistant" className="text-green-700 font-medium hover:underline">
            Shop Assistant
          </Link>{" "}
          for buying guides on soil, fertilizer, and tools.
        </p>
      </Card>

      {!result && !aiResult ? (
        <Card padding="md" className="space-y-4">
          <Input
            label="Plant name"
            placeholder="Avocado tree, Meyer lemon, Japanese maple..."
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            className="text-base"
          />
          <Select
            label="Size"
            value={size}
            onChange={(e) => setSize(e.target.value as NurserySize)}
            options={SIZE_OPTIONS}
          />
          <Input
            label="ZIP code"
            placeholder="91107"
            inputMode="numeric"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
          />
          <Select
            label="Store type"
            value={storeType}
            onChange={(e) => setStoreType(e.target.value as StoreType)}
            options={STORE_OPTIONS}
          />
          <Select
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as PlantCondition)}
            options={CONDITION_OPTIONS}
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Photo (optional)</p>
            <div
              className="relative h-28 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer touch-manipulation"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <Image src={preview} alt="Plant preview" fill className="object-cover rounded-xl" unoptimized />
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Tap to add photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => setPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>

          <Input
            label="Asking price (optional)"
            placeholder="$49.99"
            inputMode="decimal"
            value={priceAsked}
            onChange={(e) => setPriceAsked(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button
            className="w-full h-14 touch-manipulation"
            loading={loading}
            disabled={!plantName.trim()}
            onClick={handleCheck}
          >
            <Sparkles className="w-5 h-5" />
            Check Price
          </Button>
          <Button
            variant="outline"
            className="w-full touch-manipulation"
            disabled={!plantName.trim() || loading}
            onClick={handleQuickCheck}
          >
            <Tag className="w-5 h-5" />
            Quick estimate (offline)
          </Button>
        </Card>
      ) : aiResult ? (
        <Card padding="md" className="space-y-4">
          {shoppingResults && (
            <LiveShoppingSection results={shoppingResults} />
          )}
          <AiPriceCheckDisplay result={aiResult} />
          <MarketplaceExtras plantName={plantName} />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAiResult(null);
              setResult(null);
              setShoppingResults(null);
            }}
          >
            Check another plant
          </Button>
        </Card>
      ) : result ? (
        <>
          {error && (
            <Card padding="sm" className="border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-800">
                Live price analysis didn&apos;t go through — showing an estimate based on
                typical nursery pricing instead. You can check this plant again in a moment.
              </p>
            </Card>
          )}
          <PriceCheckerResults
            result={result!}
          plantName={plantName}
          shoppingResults={shoppingResults}
          onReset={() => {
            setResult(null);
            setShoppingResults(null);
          }}
          reportOpen={reportOpen}
          setReportOpen={setReportOpen}
          reportStore={reportStore}
          setReportStore={setReportStore}
          reportCity={reportCity}
          setReportCity={setReportCity}
          reportPrice={reportPrice}
          setReportPrice={setReportPrice}
          reportNotes={reportNotes}
          setReportNotes={setReportNotes}
            onReportSubmit={handleReportSubmit}
          />
        </>
      ) : null}
    </div>
  );
}

function MarketplaceExtras({ plantName }: { plantName: string }) {
  const { guide, products } = getRelatedProductsForPlant(plantName);
  const teaserGuides = guide
    ? [guide, ...BUYING_GUIDES.filter((g) => g.id !== guide.id)].slice(0, 4)
    : BUYING_GUIDES.slice(0, 4);

  return (
    <div className="space-y-4 pt-2 border-t border-gray-100">
      <BuyingGuidesTeaser
        guides={teaserGuides}
        onViewAll={undefined}
      />
      <Link
        href="/shop-assistant"
        className="block text-center text-sm text-green-600 hover:underline touch-manipulation"
      >
        Open Shop Assistant for all guides & products →
      </Link>
      {products.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-3">Related supplies</p>
          <div className="space-y-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveShoppingSection({ results }: { results: PriceSearchResponse }) {
  return (
    <section className="space-y-3 pb-4 border-b border-gray-100">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">Shopping results</h2>
        <DataSourceBadge source={dataSourceFromPrice(results.source)} />
      </div>
      <p className="text-xs text-gray-500">Query: {results.query}</p>
      <div className="space-y-2">
        {results.results.map((item, i) => (
          <Card key={`${item.retailer}-${i}`} padding="md" className="text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{item.retailer} · {item.size}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">
                  {item.price > 0 ? `$${item.price.toFixed(2)}` : "See site"}
                </p>
                <DataSourceBadge
                  source={dataSourceFromPrice(item.source)}
                  className="mt-1"
                />
              </div>
            </div>
            {item.url && item.url !== "#" && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-700 hover:underline mt-2 inline-block"
              >
                View at retailer →
              </a>
            )}
            {item.distanceOrShipping && (
              <p className="text-xs text-gray-400 mt-1">{item.distanceOrShipping}</p>
            )}
          </Card>
        ))}
      </div>
    </section>
  );
}

function PriceCheckerResults({
  result,
  plantName,
  shoppingResults,
  onReset,
  reportOpen,
  setReportOpen,
  reportStore,
  setReportStore,
  reportCity,
  setReportCity,
  reportPrice,
  setReportPrice,
  reportNotes,
  setReportNotes,
  onReportSubmit,
}: {
  result: PriceCheckResult;
  plantName: string;
  shoppingResults: PriceSearchResponse | null;
  onReset: () => void;
  reportOpen: boolean;
  setReportOpen: (v: boolean) => void;
  reportStore: string;
  setReportStore: (v: string) => void;
  reportCity: string;
  setReportCity: (v: string) => void;
  reportPrice: string;
  setReportPrice: (v: string) => void;
  reportNotes: string;
  setReportNotes: (v: string) => void;
  onReportSubmit: () => void;
}) {
  return (
    <div className="space-y-4 page-enter">
      {shoppingResults && <LiveShoppingSection results={shoppingResults} />}

      {result.correction && (
        <Card padding="md" className="bg-blue-50 border-blue-100">
          <p className="text-sm text-blue-800">
            {result.correction.suggestion ?? (
              <>Showing results for <strong>{result.correctedName}</strong>.</>
            )}
          </p>
          {result.correction.suggestion && (
            <p className="text-xs text-blue-600 mt-1">
              Showing results for {result.displayQuery}.
            </p>
          )}
        </Card>
      )}

      {!result.correction && (
        <p className="text-sm text-gray-600">
          Showing results for <strong>{result.displayQuery}</strong>.
        </p>
      )}

      <Card padding="md" className={cn("border-2", REC_COLORS[result.recommendation])}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-bold text-lg">{result.recommendation}</span>
        </div>
        <p className="text-sm leading-relaxed">{result.recommendationText}</p>
      </Card>

      <Section title="Price Verdict">
        <p className="text-sm text-gray-700">{result.verdict}</p>
      </Section>

      <Section title="Estimated Fair Price">
        <div className="flex items-center gap-2 mb-2">
          <DataSourceBadge source="estimated_price" />
        </div>
        <p className="text-2xl font-bold text-gray-900">
          ${result.fairRange[0]} – ${result.fairRange[1]}
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <PriceRow label="Big box" value={result.bigBoxLabel} />
          <PriceRow label="Local nursery" value={result.nurseryLabel} />
          <PriceRow label="Premium nursery" value={result.premiumLabel} />
          <PriceRow label="Online" value={result.onlineLabel} />
        </div>
      </Section>

      <Section title="Price Range">
        <div className="grid grid-cols-2 gap-2">
          {result.tiers.map((tier) => (
            <Card key={tier.label} padding="md" className="text-center">
              <p className="text-xs font-medium text-gray-400 uppercase">{tier.label}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{tier.range}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{tier.description}</p>
            </Card>
          ))}
        </div>
      </Section>

      {result.photoInspection && (
        <Section title="Photo Inspection">
          <Card padding="md" className="bg-gray-50 border-dashed">
            <Badge variant="info" className="mb-2">Early preview</Badge>
            <div className="text-sm space-y-1 text-gray-600">
              <p>Visible leaves: <strong>{result.photoInspection.visibleLeaves}</strong></p>
              <p>Structure: <strong>{result.photoInspection.structure}</strong></p>
              <p>Risk: <strong className="capitalize">{result.photoInspection.risk}</strong></p>
              <p>{result.photoInspection.recommendation}</p>
            </div>
          </Card>
        </Section>
      )}

      <Section title="What To Look For">
        <ul className="space-y-2">
          {result.checklist.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-gray-700">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Red Flags">
        <ul className="space-y-2">
          {result.redFlags.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-gray-700">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Better Alternatives">
        <div className="flex flex-wrap gap-2">
          {result.alternatives.map((alt) => (
            <Badge key={alt} variant="outline">{alt}</Badge>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-3">{result.regionalNotes}</p>
      </Section>

      <Link href={`/learn/${result.lessonId}`}>
        <Card padding="md" className="flex items-center gap-3 hover:bg-green-50/50 transition-colors touch-manipulation">
          <GraduationCap className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">How to Buy a Healthy Nursery Plant</p>
            <p className="text-xs text-gray-500">Read the full buying guide</p>
          </div>
        </Card>
      </Link>

      <Section title="Report a Price">
        {!reportOpen ? (
          <Button variant="outline" className="w-full touch-manipulation" onClick={() => setReportOpen(true)}>
            Report a Price
          </Button>
        ) : (
          <Card padding="md" className="space-y-3">
            <Input label="Store name" value={reportStore} onChange={(e) => setReportStore(e.target.value)} placeholder="Armstrong Garden Centers" />
            <Input label="City" value={reportCity} onChange={(e) => setReportCity(e.target.value)} placeholder="Pasadena" />
            <Input label="Price" value={reportPrice} onChange={(e) => setReportPrice(e.target.value)} placeholder="59.99" inputMode="decimal" />
            <Input label="Notes" value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="3 gallon Hass, looked healthy" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button className="flex-1 touch-manipulation" onClick={onReportSubmit}>Submit</Button>
            </div>
            <p className="text-xs text-gray-400 text-center">Reports help calibrate local price ranges</p>
          </Card>
        )}
      </Section>

      <MarketplaceExtras plantName={plantName} />

      <Button variant="secondary" className="w-full touch-manipulation" onClick={onReset}>
        Check another plant
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 hidden" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg bg-gray-50">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}
