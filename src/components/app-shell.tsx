"use client";

import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { MobileHeader } from "@/components/mobile/mobile-header";
import { MockModeBadge } from "@/components/mock-mode-badge";
import { FloatingFeedbackButton } from "@/components/feedback/feedback-panel";
import { PwaRegister } from "@/components/pwa-register";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <PwaRegister />
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      {/* Mobile header */}
      <MobileHeader />
      <main className="md:pl-72 pb-28 md:pb-8 safe-bottom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 page-enter">
          {children}
        </div>
      </main>
      <BottomNav />
      <MockModeBadge />
      <FloatingFeedbackButton />
    </div>
  );
}
