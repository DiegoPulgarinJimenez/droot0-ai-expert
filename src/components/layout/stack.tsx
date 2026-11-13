import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

const gaps = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-10",
} as const;

type Gap = keyof typeof gaps;

type StackProps = ComponentProps<"div"> & {
  gap?: Gap;
};

/** Vertical flow with consistent spacing. */
export function Stack({ gap = "md", className, ...props }: StackProps) {
  return <div className={cn("flex flex-col", gaps[gap], className)} {...props} />;
}

/** Horizontal group that wraps on narrow screens. */
export function Cluster({ gap = "sm", className, ...props }: StackProps) {
  return <div className={cn("flex flex-wrap items-center", gaps[gap], className)} {...props} />;
}

const columns = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
} as const;

type GridProps = ComponentProps<"div"> & {
  /** Column count on large screens. Always one column on mobile. */
  columns?: keyof typeof columns;
  gap?: Gap;
};

/** Responsive grid: one column on mobile, growing to `columns` on larger screens. */
export function Grid({ columns: count = 3, gap = "md", className, ...props }: GridProps) {
  return (
    <div className={cn("grid grid-cols-1", columns[count], gaps[gap], className)} {...props} />
  );
}
