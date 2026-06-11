import { WaitlistForm } from "@/components/marketing/waitlist-form";
import { cn } from "@/lib/utils";

interface WaitlistCtaProps {
  heading?: string;
  subheading?: string;
  source?: string;
  className?: string;
}

/** Lightweight email capture block for marketing pages. */
export function WaitlistCta({
  heading = "Stop guessing. Start growing.",
  subheading = "Get PlantPal free during beta.",
  source = "cta-block",
  className,
}: WaitlistCtaProps) {
  return (
    <section className={cn("max-w-2xl mx-auto px-4 sm:px-6", className)}>
      <div className="bg-white rounded-3xl border border-brand-sage/25 shadow-sm p-8 sm:p-10 text-center">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-brand-text tracking-tight">
          {heading}
        </h2>
        <p className="text-brand-text-secondary mt-3">{subheading}</p>
        <div className="mt-6 max-w-md mx-auto text-left">
          <WaitlistForm variant="compact" source={source} />
        </div>
      </div>
    </section>
  );
}
