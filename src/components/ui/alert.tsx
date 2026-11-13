import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { CheckIcon, ErrorIcon, InfoIcon, WarningIcon } from "./icons";

const variants = {
  info: { styles: "border-primary/30 bg-primary-soft", iconStyles: "text-primary", Icon: InfoIcon },
  success: {
    styles: "border-success/30 bg-success-soft",
    iconStyles: "text-success",
    Icon: CheckIcon,
  },
  warning: {
    styles: "border-warning/30 bg-warning-soft",
    iconStyles: "text-warning",
    Icon: WarningIcon,
  },
  error: { styles: "border-danger/30 bg-danger-soft", iconStyles: "text-danger", Icon: ErrorIcon },
} as const;

export type AlertVariant = keyof typeof variants;

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  /** Optional action, such as a retry button. */
  action?: ReactNode;
  className?: string;
};

/**
 * Inline message. Errors and warnings interrupt screen readers (role="alert");
 * info and success are announced politely (role="status").
 */
export function Alert({ variant = "info", title, children, action, className }: AlertProps) {
  const { styles, iconStyles, Icon } = variants[variant];
  const assertive = variant === "error" || variant === "warning";

  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cn("flex gap-3 rounded-card border p-4 text-sm text-ink", styles, className)}
    >
      <Icon className={cn("mt-0.5 size-5 shrink-0", iconStyles)} />
      <div className="min-w-0 flex-1 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="leading-6">{children}</div> : null}
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
