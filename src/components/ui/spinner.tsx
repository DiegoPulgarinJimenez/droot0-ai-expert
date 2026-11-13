import { cn } from "@/lib/utils/cn";

const sizes = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-8 border-[3px]",
} as const;

type SpinnerProps = {
  size?: keyof typeof sizes;
  /** Announced to screen readers. Pass an empty string when a visible label already exists. */
  label?: string;
  className?: string;
};

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  const decorative = label === "";

  return (
    <span
      role={decorative ? undefined : "status"}
      aria-hidden={decorative || undefined}
      className={cn("inline-flex", className)}
    >
      <span
        aria-hidden="true"
        className={cn("animate-spin rounded-full border-current border-r-transparent", sizes[size])}
      />
      {decorative ? null : <span className="sr-only">{label}</span>}
    </span>
  );
}
