import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { controlStyles } from "./input";

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(controlStyles, "min-h-20 resize-y py-2 leading-6", className)}
      {...props}
    />
  );
}
