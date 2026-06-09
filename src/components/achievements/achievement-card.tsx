import type { Achievement } from "@/lib/types/phase6";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const unlocked = !!achievement.unlockedAt;
  const progress = unlocked ? 100 : 35;

  return (
    <Card
      padding="md"
      className={cn(
        "relative overflow-hidden transition-all",
        unlocked ? "border-amber-200 bg-gradient-to-br from-amber-50/80 to-white" : "opacity-75 grayscale-[0.3]"
      )}
    >
      {!unlocked && (
        <div className="absolute top-3 right-3 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Locked
        </div>
      )}
      <div className="text-3xl mb-2">{achievement.icon}</div>
      <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
      <p className="text-sm text-gray-500 mt-1">{achievement.description}</p>
      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", unlocked ? "bg-amber-400 w-full" : "bg-gray-300")}
          style={{ width: unlocked ? "100%" : `${progress}%` }}
        />
      </div>
      {unlocked && achievement.unlockedAt && (
        <p className="text-xs text-amber-600 mt-2 font-medium">
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
