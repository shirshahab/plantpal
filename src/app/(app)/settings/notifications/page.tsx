"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BellOff, BellRing, ChevronLeft, Mail, PauseCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReminders } from "@/lib/store/reminders-provider";
import { useNotifications } from "@/lib/store/notifications-provider";
import { showLocalNotification } from "@/lib/notifications/push";
import { NotificationPreviews } from "@/components/notifications/notification-previews";
import { cn } from "@/lib/utils";

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-4 py-3 touch-manipulation",
        disabled ? "opacity-50" : "cursor-pointer"
      )}
    >
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
      />
    </label>
  );
}

export default function NotificationsSettingsPage() {
  const { settings, updateSettings, requestNotificationPermission } = useReminders();
  const { prefs, updatePrefs } = useNotifications();
  const [testStatus, setTestStatus] = useState<"idle" | "sent" | "failed">("idle");

  const paused = prefs.paused;

  const permLabel =
    settings.notificationPermission === "unsupported"
      ? "Not supported in this browser"
      : settings.notificationPermission === "granted"
        ? "Enabled"
        : settings.notificationPermission === "denied"
          ? "Blocked — enable in browser settings"
          : "Not requested yet";

  const sendTest = async () => {
    const ok = await showLocalNotification(
      "PlantPal reminders are working",
      "You'll get a daily digest like this at your reminder time.",
      "/dashboard"
    );
    setTestStatus(ok ? "sent" : "failed");
    setTimeout(() => setTestStatus("idle"), 4000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <PageHeader
        title="Notifications"
        description="Control when and what PlantPal reminds you about"
        action={
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        }
      />

      <Card
        className={cn(
          paused ? "border-amber-200 bg-amber-50/60" : "border-gray-100"
        )}
      >
        <CardContent className="py-4">
          <label className="flex items-start justify-between gap-4 cursor-pointer touch-manipulation">
            <div className="flex items-start gap-3">
              <PauseCircle
                className={cn(
                  "w-5 h-5 mt-0.5 shrink-0",
                  paused ? "text-amber-600" : "text-gray-400"
                )}
              />
              <div>
                <p className="font-semibold text-gray-900">Pause all notifications</p>
                <p className="text-sm text-gray-500">
                  {paused
                    ? "Notifications are paused — nothing will be generated or sent."
                    : "One switch to silence reminders, alerts, and digests."}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={paused}
              onChange={(e) => updatePrefs({ paused: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Daily reminder time</h2>
          <p className="text-sm text-gray-500">
            When to surface your Today tasks (local time). Reminders never send overnight.
          </p>
        </CardHeader>
        <CardContent>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => updateSettings({ reminderTime: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
          />
        </CardContent>
      </Card>

      <NotificationPreviews />

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-0">
          <h2 className="font-semibold text-gray-900">Care reminders</h2>
          <p className="text-sm text-gray-500">Capped at 3 per day — no spam</p>
        </CardHeader>
        <CardContent className="divide-y divide-gray-50 px-4">
          <ToggleRow
            label="Watering reminders"
            description="Plants due for water based on your schedule"
            checked={settings.watering}
            disabled={paused}
            onChange={(v) => updateSettings({ watering: v })}
          />
          <ToggleRow
            label="Fertilizer reminders"
            description="Feed reminders before nutrients run low"
            checked={settings.fertilizer}
            disabled={paused}
            onChange={(v) => updateSettings({ fertilizer: v })}
          />
          <ToggleRow
            label="Health checks"
            description="Scan and inspect when health score drops"
            checked={settings.healthCheck}
            disabled={paused}
            onChange={(v) => updateSettings({ healthCheck: v })}
          />
          <ToggleRow
            label="Growth photos"
            description="Track progress every 2–4 weeks"
            checked={settings.growthPhoto}
            disabled={paused}
            onChange={(v) => updateSettings({ growthPhoto: v })}
          />
          <ToggleRow
            label="Missions"
            description="Goal-based daily missions"
            checked={settings.missions}
            disabled={paused}
            onChange={(v) => updateSettings({ missions: v })}
          />
        </CardContent>
      </Card>

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-0">
          <h2 className="font-semibold text-gray-900">Alerts</h2>
          <p className="text-sm text-gray-500">What shows up in your notification center</p>
        </CardHeader>
        <CardContent className="divide-y divide-gray-50 px-4">
          <ToggleRow
            label="Health alerts"
            description="Pest & disease risks and recovery follow-ups"
            checked={prefs.pestAlerts}
            disabled={paused}
            onChange={(v) => updatePrefs({ pestAlerts: v })}
          />
          <ToggleRow
            label="Weather alerts"
            description="Frost, heat waves, wind, rain, and drought"
            checked={prefs.weatherAlerts}
            disabled={paused}
            onChange={(v) => updatePrefs({ weatherAlerts: v })}
          />
          <ToggleRow
            label="Academy reminders"
            description="A nudge when your learning streak is at risk"
            checked={prefs.academyStreak}
            disabled={paused}
            onChange={(v) => updatePrefs({ academyStreak: v })}
          />
          <ToggleRow
            label="Friend activity"
            description="Friend requests, comments, and reactions"
            checked={prefs.friendActivity}
            disabled={paused}
            onChange={(v) => updatePrefs({ friendActivity: v })}
          />
          <ToggleRow
            label="Challenge updates"
            description="Challenges starting, ending soon, or completed"
            checked={prefs.challengeUpdates}
            disabled={paused}
            onChange={(v) => updatePrefs({ challengeUpdates: v })}
          />
          <ToggleRow
            label="Marketing updates"
            description="Occasional news about new PlantPal features"
            checked={prefs.marketingUpdates}
            disabled={paused}
            onChange={(v) => updatePrefs({ marketingUpdates: v })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {settings.notificationPermission === "granted" ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <h2 className="font-semibold text-gray-900">Push notifications</h2>
              <p className="text-sm text-gray-500">Status: {permLabel}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.notificationPermission !== "unsupported" &&
            settings.notificationPermission !== "granted" && (
              <Button onClick={() => requestNotificationPermission()}>
                Enable push notifications
              </Button>
            )}
          {settings.notificationPermission === "granted" && (
            <div className="space-y-2">
              <Button variant="secondary" onClick={() => void sendTest()}>
                <BellRing className="w-4 h-4" />
                Send test notification
              </Button>
              {testStatus === "sent" && (
                <p className="text-sm text-green-700">Test sent — check your notifications.</p>
              )}
              {testStatus === "failed" && (
                <p className="text-sm text-red-600">
                  Couldn&apos;t send. Check browser notification settings for this site.
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
            With push enabled, PlantPal sends one daily digest at your reminder time covering
            water, feeding, recovery check-ins, and alerts. Install PlantPal to your home
            screen for the best experience on mobile.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500" />
            <div>
              <h2 className="font-semibold text-gray-900">Email fallback</h2>
              <p className="text-sm text-gray-500">
                Get a daily email digest when push isn&apos;t available
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ToggleRow
            label="Email me my reminders"
            description="Only used on days when push notifications can't reach you"
            checked={prefs.emailFallback}
            disabled={paused}
            onChange={(v) => updatePrefs({ emailFallback: v })}
          />
          {prefs.emailFallback && (
            <input
              type="email"
              placeholder="you@example.com"
              value={prefs.emailAddress}
              onChange={(e) => updatePrefs({ emailAddress: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
