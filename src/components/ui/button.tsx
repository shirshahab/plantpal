import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        "bg-brand-primary text-white hover:bg-[#245a42] active:bg-[#1e4d38] shadow-sm shadow-brand-primary/15",
      secondary:
        "bg-brand-sage/20 text-brand-primary hover:bg-brand-sage/30 active:bg-brand-sage/35",
      outline:
        "bg-white text-brand-primary border border-brand-sage/50 hover:bg-brand-sage/10 hover:border-brand-sage",
      ghost: "text-brand-primary hover:bg-brand-sage/15 active:bg-brand-sage/25",
      danger: "bg-red-500 text-white hover:bg-red-600",
    };
    const sizes = {
      sm: "px-3 py-2 text-sm rounded-lg gap-1.5 min-h-[40px]",
      md: "px-4 py-3 text-sm rounded-xl gap-2 min-h-[48px]",
      lg: "px-6 py-3.5 text-base rounded-xl gap-2 min-h-[52px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
