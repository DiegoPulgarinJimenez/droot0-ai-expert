import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Decorative illustration or icon. */
  icon?: ReactNode;
  /** The next step, such as a "Start a conversation" button. */
  action?: ReactNode;
  /** Heading level, so the state fits the page outline. */
  headingLevel?: "h2" | "h3";
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel: Heading = "h2",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-line-strong/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div aria-hidden="true" className="mb-4 text-ink-subtle">
          {icon}
        </div>
      ) : null}
      <Heading className="text-base font-semibold tracking-tight text-ink">{title}</Heading>
      {description ? (
        <p className="mt-1 max-w-prose text-sm leading-6 text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
