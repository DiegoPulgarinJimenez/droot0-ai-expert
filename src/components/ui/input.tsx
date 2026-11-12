import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const controlStyles =
  "w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink " +
  "placeholder:text-ink-subtle transition-colors " +
  "hover:border-ink-muted " +
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle disabled:hover:border-line-strong " +
  "aria-invalid:border-danger aria-invalid:outline-danger";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(controlStyles, "h-10", className)} {...props} />;
}
