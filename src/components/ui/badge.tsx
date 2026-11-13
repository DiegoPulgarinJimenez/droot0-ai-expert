import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const variants = {
  neutral: "bg-sunken text-ink-muted",
  primary: "bg-primary-soft text-primary-hover",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
} as const;

type BadgeProps = ComponentProps<"span"> & {
  variant?: keyof typeof variants;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
