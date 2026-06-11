import { Users, Lightbulb, MapPin, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { COMMUNITY_STATS } from "@/lib/mock/community";

export function CommunityHero({
  stats,
}: {
  stats: typeof COMMUNITY_STATS;
}) {
  return (
    <Card
      padding="md"
      className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white border-0"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative space-y-4">
        <div>
          <p className="text-sm font-medium text-green-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            {stats.activeGrowers} growers active this week
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-2 leading-tight">
            Learn from real gardens near you
          </h2>
          <p className="text-sm text-green-100/90 mt-2 max-w-lg leading-relaxed">
            Browse tips, transformations, and featured gardens from the PlantPal
            community. Sharing and posting open soon. Explore the preview below.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, value: stats.activeGrowers, label: "Active growers" },
            { icon: Lightbulb, value: stats.tipsThisWeek, label: "Tips this week" },
            { icon: MapPin, value: stats.gardensNearby, label: "Gardens nearby" },
            { icon: BookOpen, value: stats.questionsThisWeek, label: "Questions" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2.5 text-center"
            >
              <stat.icon className="w-4 h-4 mx-auto text-green-200 mb-1" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-[10px] text-green-100/80 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-green-100/70 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Read-only preview · no posting yet
        </p>
      </div>
    </Card>
  );
}
