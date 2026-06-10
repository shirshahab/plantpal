"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TYPE_META } from "@/components/notifications/notification-center";
import { generateNotificationCopy } from "@/lib/notifications/copy-engine";
import { usePlants } from "@/lib/store/plants-provider";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { getLocationProfile } from "@/lib/location/location-service";
import type { AppNotificationType } from "@/lib/types/notifications";
import { cn } from "@/lib/utils";

/**
 * Sample notification previews so users can see exactly what they'd get
 * before enabling anything — built with their real plant and location
 * when available.
 */
export function NotificationPreviews() {
  const { plants } = usePlants();

  const previews = useMemo(() => {
    const plant = plants[0] ?? null;
    const zip = plant?.zipCode || loadUserProfile().zipCode || "";
    const city = zip ? getLocationProfile(zip).city : null;
    const plantName = plant?.name || plant?.species || "Meyer Lemon";
    const seed = new Date().toISOString().slice(0, 10);

    const samples: { label: string; type: AppNotificationType; title: string; body: string }[] =
      [];

    const water = generateNotificationCopy({
      notificationType: "water",
      plant,
      plantNames: [plantName],
      locationName: city,
      seed,
    });
    samples.push({ label: "Watering reminder", type: "water", ...water });

    const heat = generateNotificationCopy({
      notificationType: "weather",
      weatherAlert: {
        type: "heat",
        severity: "warning",
        title: "Heat alert",
        message: "",
        wateringAdjustment: "",
      },
      weather: city
        ? {
            location: city,
            zipCode: zip,
            condition: "Sunny",
            tempF: 96,
            tempHighF: 101,
            alerts: [],
            summary: "",
          }
        : null,
      locationName: city,
      seed,
    });
    samples.push({ label: "Weather alert", type: "weather", ...heat });

    const academy = generateNotificationCopy({
      notificationType: "streak",
      academyProgress: { currentStreak: 5 },
      seed,
    });
    samples.push({ label: "Academy reminder", type: "streak", ...academy });

    const friend = generateNotificationCopy({
      notificationType: "friend",
      friendActivity: {
        title: "Sabina added a Meyer Lemon",
        body: "A new tree joined her garden — leave a reaction.",
      },
      seed,
    });
    samples.push({ label: "Friend activity", type: "friend", ...friend });

    return samples;
  }, [plants]);

  return (
    <Card padding="none">
      <CardHeader className="px-4 pt-4 pb-0">
        <h2 className="font-semibold text-gray-900">What they look like</h2>
        <p className="text-sm text-gray-500">
          Sample notifications, personalized with your garden
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3 space-y-2">
        {previews.map((p) => {
          const meta = TYPE_META[p.type];
          const Icon = meta.icon;
          return (
            <div
              key={p.label}
              className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                {p.label}
              </p>
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    meta.bg,
                    meta.fg
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
