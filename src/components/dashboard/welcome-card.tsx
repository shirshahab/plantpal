"use client";

import { useEffect, useState } from "react";
import { Flame, CloudSun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/store/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { loadUserProfile } from "@/lib/profile/user-profile";
import { getLocationProfile } from "@/lib/location/location-service";
import { useWeather } from "@/lib/hooks/use-weather";
import { greetingForHour, firstName } from "@/lib/dashboard/activity-feed";

interface WelcomeCardProps {
  streak: number;
}

export function DashboardWelcomeCard({ streak }: WelcomeCardProps) {
  const { user, isMockMode } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profile] = useState(() => loadUserProfile());
  const zip = profile.zipCode;
  const location = zip ? getLocationProfile(zip) : null;
  const { weather } = useWeather(zip);

  useEffect(() => {
    if (isMockMode) {
      // No fake names — fall back to a generic greeting in local mode.
      setDisplayName(null);
      return;
    }
    const meta = user?.user_metadata?.full_name as string | undefined;
    if (meta) {
      setDisplayName(firstName(meta));
      return;
    }
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.full_name) setDisplayName(firstName(data.full_name));
      });
  }, [user, isMockMode]);

  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const headline = displayName ? `${greeting}, ${displayName}.` : `${greeting}.`;

  return (
    <Card
      padding="md"
      className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white border-0 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <p className="text-xl sm:text-2xl font-bold tracking-tight">{headline}</p>
        <p className="text-sm text-green-100 mt-1">Here&apos;s what your garden needs today.</p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {location ? (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm">
                <CloudSun className="w-4 h-4 text-green-100" />
                <span>
                  {location.city}, {location.state}
                  {weather.tempF != null ? ` · ${weather.tempF}°F` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm">
                <span className="text-green-100 text-xs">ZIP</span>
                <span className="font-medium">{zip}</span>
              </div>
            </>
          ) : (
            <a
              href="/settings"
              className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm hover:bg-white/25 transition-colors"
            >
              <CloudSun className="w-4 h-4 text-green-100" />
              <span>Add your ZIP for local weather →</span>
            </a>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl bg-orange-400/25 px-3 py-2 text-sm">
              <Flame className="w-4 h-4 text-orange-200" />
              <span>{streak} day streak</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
