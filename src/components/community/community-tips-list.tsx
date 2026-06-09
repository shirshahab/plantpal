import { Heart, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CommunityTip } from "@/lib/mock/community";

function Avatar({ label }: { label: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center justify-center shrink-0">
      {label}
    </div>
  );
}

export function CommunityTipsList({ tips }: { tips: CommunityTip[] }) {
  return (
    <div className="space-y-3">
      {tips.map((tip) => (
        <Card key={tip.id} padding="md" className="hover:border-green-100 transition-colors">
          <div className="flex gap-3">
            <Avatar label={tip.avatar} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-gray-900 text-sm">{tip.author}</span>
                <span className="text-xs text-gray-400">· {tip.location}</span>
                <span className="text-xs text-gray-400">· {tip.timeAgo}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{tip.tip}</p>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant="outline" className="text-[10px]">
                  {tip.tag}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <Heart className="w-3 h-3" />
                  {tip.cheers}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                  <MessageCircle className="w-3 h-3" />
                  Reply soon
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
