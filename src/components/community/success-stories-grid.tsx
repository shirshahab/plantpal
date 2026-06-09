import Image from "next/image";
import { Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SuccessStory } from "@/lib/mock/community";

export function SuccessStoriesGrid({ stories }: { stories: SuccessStory[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stories.map((story) => (
        <Card
          key={story.id}
          padding="none"
          className="overflow-hidden hover:shadow-md transition-shadow group"
        >
          <div className="relative h-36 bg-green-50">
            <Image
              src={story.imageUrl}
              alt={story.title}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="p-4 space-y-2">
            <Badge variant="success" className="text-[10px]">
              <TrendingUp className="w-3 h-3" />
              Success story
            </Badge>
            <h3 className="font-semibold text-gray-900 leading-snug">{story.title}</h3>
            <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
              {story.excerpt}
            </p>
            <p className="text-xs font-medium text-green-700">{story.stat}</p>
            <div className="flex items-center justify-between pt-2 text-xs text-gray-400">
              <span>
                {story.author} · {story.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {story.readMinutes} min · {story.timeAgo}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
