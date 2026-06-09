"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { seedDemoGarden } from "@/lib/demo/seed-demo-garden";
import type { ButtonHTMLAttributes } from "react";

interface DemoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function DemoButton({
  label = "Try Demo",
  variant = "outline",
  size = "lg",
  className,
  ...props
}: DemoButtonProps) {
  const router = useRouter();

  function handleDemo() {
    seedDemoGarden("91107");
    router.push("/dashboard");
    window.location.reload();
  }

  return (
    <Button variant={variant} size={size} className={className} onClick={handleDemo} {...props}>
      {label}
    </Button>
  );
}
