import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card border border-line bg-surface shadow-raised", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-1 px-5 pt-5", className)} {...props} />;
}

type CardTitleProps = ComponentProps<"h2"> & {
  /** Heading level, so the card fits the page outline. */
  as?: "h2" | "h3" | "h4";
};

export function CardTitle({ as: Heading = "h2", className, ...props }: CardTitleProps) {
  return (
    <Heading
      className={cn("text-base font-semibold tracking-tight text-ink", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-sm leading-6 text-ink-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-3 border-t border-line px-5 py-4", className)}
      {...props}
    />
  );
}
