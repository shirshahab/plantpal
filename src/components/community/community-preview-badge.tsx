export function CommunityPreviewBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-brand-sage/15 text-brand-text-secondary border border-brand-sage/25">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Preview — posting soon
    </span>
  );
}
