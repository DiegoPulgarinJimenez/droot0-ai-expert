import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const widths = {
  /** Forms and reading content. */
  narrow: "max-w-xl",
  /** Default page content. */
  content: "max-w-3xl",
  /** Tables, dashboards, and marketing sections. */
  wide: "max-w-6xl",
} as const;

type ContainerProps = ComponentProps<"div"> & {
  width?: keyof typeof widths;
};

/** Centers content and applies the horizontal page gutters at every breakpoint. */
export function Container({ width = "wide", className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widths[width], className)}
      {...props}
    />
  );
}
