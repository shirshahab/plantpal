import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullPage?: boolean;
}

export function LoadingState({
  message = "Loading...",
  className,
  fullPage,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullPage ? "min-h-[50vh]" : "py-16",
        className
      )}
    >
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-green-100" />
        <div className="absolute inset-0 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-100 rounded-xl",
        className
      )}
    />
  );
}
