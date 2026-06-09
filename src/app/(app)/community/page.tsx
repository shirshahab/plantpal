"use client";

import { Users, MessageCircle, MapPin, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MOCK_GALLERY } from "@/lib/mock/gallery";

const features = [
  { icon: MessageCircle, title: "Ask Community", desc: "Get help from local plant parents." },
  { icon: MapPin, title: "Browse Local Gardens", desc: "Discover what's growing near you." },
  { icon: Sparkles, title: "Share Progress", desc: "Post growth timeline updates." },
  { icon: Users, title: "Follow Gardeners", desc: "Learn from experienced collectors." },
];

export default function CommunityPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Community"
        description="Connect, share, and learn — coming soon."
      />

      <Card padding="md" className="bg-gradient-to-br from-green-50 to-white border-green-100 text-center py-8">
        <p className="text-lg font-semibold text-gray-900">PlantPal Community</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          A social layer for sharing transformations, asking questions, and discovering local gardens.
        </p>
        <Button className="mt-4" disabled>
          Join waitlist
        </Button>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((f) => (
          <Card key={f.title} padding="md">
            <f.icon className="w-5 h-5 text-green-600 mb-2" />
            <p className="font-medium text-gray-900">{f.title}</p>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </Card>
        ))}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">Featured transformations</p>
        <div className="space-y-2">
          {MOCK_GALLERY.slice(0, 2).map((g) => (
            <Card key={g.id} padding="md" className="text-sm">
              <p className="font-medium">{g.plantName}</p>
              <p className="text-gray-500 text-xs mt-1">{g.note}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
