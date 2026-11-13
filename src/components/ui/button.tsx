import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap " +
  "transition-colors select-none " +
  "disabled:pointer-events-none disabled:opacity-55";

const variants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "bg-danger text-on-primary hover:bg-danger-hover",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-10",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/**
 * Button classes for elements that are not a <button>, such as a Next.js <Link>
 * used as a call to action.
 */
export function buttonStyles({ variant = "primary", size = "md", className }: ButtonStyleOptions) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction while an action is in flight. */
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner size="sm" label="" /> : null}
      {children}
    </button>
  );
}
