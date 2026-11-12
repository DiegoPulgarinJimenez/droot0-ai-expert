import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";
import { ErrorIcon } from "./icons";

type ErrorStateProps = {
  title?: string;
  /** What went wrong and what the user can do about it. */
  description: string;
  /** When provided, a retry button is shown. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Replaces the retry button with custom actions. */
  action?: ReactNode;
  headingLevel?: "h2" | "h3";
  className?: string;
};

/** Full-region failure state for a page or panel that could not load. */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  action,
  headingLevel: Heading = "h2",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-card border border-danger/30 bg-danger-soft px-6 py-12 text-center",
        className,
      )}
    >
      <ErrorIcon className="mb-4 size-8 text-danger" />
      <Heading className="text-base font-semibold tracking-tight text-ink">{title}</Heading>
      <p className="mt-1 max-w-prose text-sm leading-6 text-ink">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
      {!action && onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
