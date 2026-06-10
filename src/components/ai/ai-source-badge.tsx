import type { AIResponseSource } from "@/lib/types/ai";
import { cn } from "@/lib/utils";

export function AiSourceBadge({
  source,
  saved,
  className,
}: {
  source: AIResponseSource;
  saved?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full",
        source === "ai"
          ? "bg-violet-100 text-violet-700"
          : "bg-gray-100 text-gray-600",
        className
      )}
    >
      {source === "ai" ? "Personalized for your garden" : "Preview plan"}
      {saved && <span className="opacity-70">· saved</span>}
    </span>
  );
}
