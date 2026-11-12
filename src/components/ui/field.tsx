"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Label } from "./label";

export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

type FieldProps = {
  label: string;
  /** Helper text shown under the control. */
  hint?: string;
  /** Validation message. When set, the control is marked invalid. */
  error?: string;
  className?: string;
  /** Receives the props that wire the control to its label, hint, and error. */
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Pairs a form control with its label, hint, and error message so the
 * associations (htmlFor, aria-describedby, aria-invalid) are always correct.
 *
 *   <Field label="Email" error={errors.email}>
 *     {(control) => <Input type="email" {...control} />}
 *   </Field>
 */
export function Field({ label, hint, error, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
