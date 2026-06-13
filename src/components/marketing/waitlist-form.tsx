"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialLinks } from "@/components/marketing/social-links";
import { PlantyAvatar } from "@/components/brand/planty";
import {
  GROW_TYPE_OPTIONS,
  PROBLEM_OPTIONS,
  submitWaitlist,
  type BiggestProblem,
  type GrowType,
} from "@/lib/waitlist/types";
import { cn } from "@/lib/utils";

interface WaitlistFormProps {
  variant?: "full" | "compact";
  source?: string;
  className?: string;
}

export function WaitlistForm({ variant = "full", source = "website", className }: WaitlistFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [growTypes, setGrowTypes] = useState<GrowType[]>([]);
  const [problem, setProblem] = useState<BiggestProblem>("forget_watering");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGrowType(value: GrowType) {
    setGrowTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (variant === "full" && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    const result = await submitWaitlist({
      name: name.trim() || "Waitlist",
      email: email.trim(),
      zip_code: zip.trim(),
      grow_types: growTypes,
      biggest_problem: problem,
      source,
    });
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.error ?? "Something went wrong.");
    }
  }

  if (success) {
    return (
      <div className={cn("text-center py-8 px-4", className)}>
        <PlantyAvatar variant="niceWork" size={56} className="mx-auto mb-4" />
        <h3 className="font-heading text-xl font-bold text-gray-900">
          You&apos;re in. Your plants have a fighting chance.
        </h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          We&apos;ll email you when early access opens. Or start your garden right now.
        </p>
        <Link href="/onboarding" className="inline-block mt-6">
          <Button size="md">Start My Garden</Button>
        </Link>
        <div className="mt-8 pt-6 border-t border-brand-sage/20">
          <p className="text-sm text-gray-500 mb-3">
            Follow us for plant tips, product updates, and fewer dead leaves.
          </p>
          <SocialLinks className="justify-center" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-3", className)}>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" size="lg" loading={loading} className="shrink-0 sm:min-w-[140px]">
            Join Waitlist
          </Button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <Input
        label="ZIP code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        placeholder="91107"
        inputMode="numeric"
      />

      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">What do you grow?</legend>
        <div className="flex flex-wrap gap-2">
          {GROW_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleGrowType(opt.value)}
              className={cn(
                "text-sm px-3 py-2 rounded-xl border transition-colors touch-manipulation",
                growTypes.includes(opt.value)
                  ? "border-brand-primary bg-brand-sage/20 text-brand-primary"
                  : "border-brand-sage/30 bg-white text-brand-text-secondary hover:border-brand-sage"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Biggest plant problem?</legend>
        <div className="space-y-2">
          {PROBLEM_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                problem === opt.value
                  ? "border-brand-primary bg-brand-sage/15"
                  : "border-brand-sage/20 bg-white hover:border-brand-sage/40"
              )}
            >
              <input
                type="radio"
                name="problem"
                value={opt.value}
                checked={problem === opt.value}
                onChange={() => setProblem(opt.value)}
                className="accent-brand-primary"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" size="lg" loading={loading} className="w-full">
        Join Waitlist
      </Button>
    </form>
  );
}
