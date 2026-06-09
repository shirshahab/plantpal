import { PlantPalIconTile } from "@/components/brand/plantpal-logo";
import { CalendarCheck, Droplets, Sun } from "lucide-react";

/** CSS phone mockup showing PlantPal dashboard preview. */
export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      <div className="absolute inset-0 bg-brand-growth/15 blur-3xl rounded-full scale-110" aria-hidden />
      <div className="relative rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl shadow-brand-primary/20 overflow-hidden">
        <div className="h-6 bg-gray-900 flex items-center justify-center">
          <div className="w-16 h-1 rounded-full bg-gray-700" />
        </div>
        <div className="bg-brand-bg min-h-[480px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlantPalIconTile size={28} />
              <span className="text-xs font-heading font-semibold text-brand-text">PlantPal</span>
            </div>
            <span className="text-[10px] text-brand-primary font-medium">Today</span>
          </div>

          <div className="rounded-2xl bg-white border border-brand-sage/25 p-3 shadow-sm">
            <p className="text-[10px] text-brand-text-secondary uppercase tracking-wide">Garden health</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-2xl font-heading font-bold text-brand-growth">87</p>
              <p className="text-[10px] text-brand-text-secondary">5 plants · Pasadena</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-brand-sage/25 shadow-sm">
            <div className="h-24 bg-gradient-to-br from-brand-sage/40 to-brand-growth/20 relative">
              <div className="absolute bottom-2 left-3">
                <p className="text-xs font-heading font-semibold text-brand-text">Meyer Lemon</p>
                <p className="text-[10px] text-brand-text-secondary">Water today</p>
              </div>
            </div>
          </div>

          <p className="text-[10px] font-heading font-semibold text-brand-text px-1">Today&apos;s tasks</p>
          {[
            { icon: Droplets, label: "Deep water lemon tree", done: false },
            { icon: Sun, label: "Check for heat stress", done: false },
            { icon: CalendarCheck, label: "Log growth photo", done: true },
          ].map((task) => (
            <div
              key={task.label}
              className="flex items-center gap-2 rounded-xl bg-white border border-brand-sage/20 px-3 py-2"
            >
              <task.icon className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              <span
                className={`text-[10px] flex-1 ${task.done ? "text-brand-text-secondary line-through" : "text-brand-text"}`}
              >
                {task.label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-5 bg-gray-900" />
      </div>
    </div>
  );
}
