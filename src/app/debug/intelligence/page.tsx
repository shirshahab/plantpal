import { probeNoaa } from "@/lib/intelligence/noaa";
import { getUsdaDatasetCount } from "@/lib/intelligence/usda-plants";
import { getDiseaseReferenceCount } from "@/lib/intelligence/disease-intelligence";
import { getRedditSignalCount } from "@/lib/intelligence/reddit-intelligence";
import { getTrendProviderStatus } from "@/lib/intelligence/trend-intelligence";
import { getCommunitySignalCount } from "@/lib/intelligence/community-intelligence";
import { getLocalInsights } from "@/lib/intelligence/local-insights";
import { isPerenualEnabled } from "@/lib/integrations/perenual";

export const dynamic = "force-dynamic";

function StatusDot({ ok }: { ok: boolean | null }) {
  const color = ok === null ? "bg-gray-300" : ok ? "bg-green-500" : "bg-red-500";
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function Row({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean | null;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <StatusDot ok={ok} />
      <span className="text-sm font-medium text-gray-900 w-44 shrink-0">{label}</span>
      <span className="text-sm text-gray-600">{detail}</span>
    </div>
  );
}

export default async function IntelligenceDebugPage({
  searchParams,
}: {
  searchParams: Promise<{ zip?: string }>;
}) {
  const params = await searchParams;
  const zip = /^\d{5}$/.test(params.zip ?? "") ? (params.zip as string) : "91107";

  const [noaa, communityCount, bundle] = await Promise.all([
    probeNoaa(),
    getCommunitySignalCount(),
    getLocalInsights({ zip }).catch(() => null),
  ]);

  const openWeatherKey = Boolean(process.env.OPENWEATHER_API_KEY);
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const trendStatus = getTrendProviderStatus();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Intelligence Debug</h1>
        <p className="text-sm text-gray-500 mt-1">
          Data sources powering Local Grower Pulse, Trending Near You, Planty
          facts, care plans, and Plant Health Check. Dev only.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 px-4 py-2">
        <Row label="NOAA / NWS" ok={noaa.ok} detail={noaa.detail} />
        <Row
          label="OpenWeather"
          ok={openWeatherKey}
          detail={openWeatherKey ? "OPENWEATHER_API_KEY set" : "No key. Climate mock fallback in use."}
        />
        <Row
          label="Perenual"
          ok={isPerenualEnabled()}
          detail={isPerenualEnabled() ? "PERENUAL_API_KEY set" : "No key. Local species database only."}
        />
        <Row
          label="Trend provider"
          ok={trendStatus.provider === "serpapi"}
          detail={`${trendStatus.provider}: ${trendStatus.detail}`}
        />
        <Row
          label="USDA dataset"
          ok={getUsdaDatasetCount() > 0}
          detail={`${getUsdaDatasetCount()} plant reference records`}
        />
        <Row
          label="Disease reference"
          ok={getDiseaseReferenceCount() > 0}
          detail={`${getDiseaseReferenceCount()} issue records`}
        />
        <Row
          label="Reddit signals"
          ok={getRedditSignalCount() > 0}
          detail={`${getRedditSignalCount()} curated seasonal signals (estimated)`}
        />
        <Row
          label="Community signals"
          ok={communityCount !== null}
          detail={
            communityCount === null
              ? serviceRole
                ? "Table unreachable. Run migration 029_intelligence_signals.sql."
                : "SUPABASE_SERVICE_ROLE_KEY not set."
              : `${communityCount} aggregate rows`
          }
        />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">
            Local insights for {zip}
          </h2>
          <form className="flex items-center gap-2">
            <input
              name="zip"
              defaultValue={zip}
              maxLength={5}
              className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="text-sm font-medium text-green-700 hover:text-green-800"
            >
              Load
            </button>
          </form>
        </div>
        {bundle ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              {bundle.area} · {bundle.season} · {bundle.risks.length} weather risks ·{" "}
              {bundle.trends.length} trend signals · {bundle.communitySignals.length}{" "}
              community signals
            </p>
            {bundle.insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3"
              >
                <p className="text-sm font-medium text-gray-900">
                  {insight.emoji} {insight.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{insight.summary}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-mono">
                  type={insight.type} · source={insight.source} · confidence=
                  {insight.confidence}
                  {insight.estimated ? " · ESTIMATED" : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-red-600">Insights engine failed for this ZIP.</p>
        )}
      </section>
    </div>
  );
}
