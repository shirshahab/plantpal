"use client";

import Link from "next/link";
import { Bell, BellOff, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReminders } from "@/lib/store/reminders-provider";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-3 cursor-pointer touch-manipulation">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
      />
    </label>
  );
}

export default function RemindersSettingsPage() {
  const { settings, updateSettings, requestNotificationPermission } = useReminders();

  const permLabel =
    settings.notificationPermission === "unsupported"
      ? "Not supported in this browser"
      : settings.notificationPermission === "granted"
        ? "Enabled"
        : settings.notificationPermission === "denied"
          ? "Blocked — enable in browser settings"
          : "Not requested yet";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <PageHeader
        title="Reminders"
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

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Daily reminder time</h2>
          <p className="text-sm text-gray-500">When to surface your Today tasks (local time)</p>
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

      <Card padding="none">
        <CardHeader className="px-4 pt-4 pb-0">
          <h2 className="font-semibold text-gray-900">Task reminders</h2>
        </CardHeader>
        <CardContent className="divide-y divide-gray-50 px-4">
          <ToggleRow
            label="Watering"
            description="Plants due for water based on your schedule"
            checked={settings.watering}
            onChange={(v) => updateSettings({ watering: v })}
          />
          <ToggleRow
            label="Fertilizer"
            description="Feed reminders before nutrients run low"
            checked={settings.fertilizer}
            onChange={(v) => updateSettings({ fertilizer: v })}
          />
          <ToggleRow
            label="Health checks"
            description="Scan and inspect when health score drops"
            checked={settings.healthCheck}
            onChange={(v) => updateSettings({ healthCheck: v })}
          />
          <ToggleRow
            label="Growth photos"
            description="Track progress every 2–4 weeks"
            checked={settings.growthPhoto}
            onChange={(v) => updateSettings({ growthPhoto: v })}
          />
          <ToggleRow
            label="Missions"
            description="Goal-based daily missions"
            checked={settings.missions}
            onChange={(v) => updateSettings({ missions: v })}
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
                Enable reminders
              </Button>
            )}
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
            Push notifications coming next. Permission is saved so we can wire real alerts in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
