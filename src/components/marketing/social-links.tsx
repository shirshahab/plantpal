import { SOCIAL_LINKS, type SocialId } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

function SocialIcon({ id, className }: { id: SocialId; className?: string }) {
  const cls = cn("w-5 h-5", className);
  switch (id) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cls} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={cls} aria-hidden="true">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1Z" />
        </svg>
      );
  }
}

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  showHandles?: boolean;
}

export function SocialLinks({ className, iconClassName, showHandles = false }: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {SOCIAL_LINKS.map((social) => (
        <a
          key={social.id}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`PlantPal on ${social.label}`}
          className="flex items-center gap-2 text-brand-text-secondary hover:text-brand-primary transition-colors"
        >
          <SocialIcon id={social.id} className={iconClassName} />
          {showHandles && <span className="text-sm">{social.handle}</span>}
        </a>
      ))}
    </div>
  );
}
